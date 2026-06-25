import "server-only";
import { getCharacter, getVideo, updateVideo } from "./repo";
import { synthesizeSpeech } from "./services/voice";
import { getVideoProvider } from "./providers/video";
import { BUCKETS, downloadAndStore, publicUrl, uploadBytes } from "./supabase";
import type { Video } from "./types";

/**
 * Kick off a render for an existing video row (synchronous setup, async render):
 *   1. ElevenLabs TTS -> store the MP3 in our `audio` bucket.
 *   2. Upload that MP3 to the provider as an asset.
 *   3. Submit the job (character image URL + audio) -> store provider_job_id.
 * The long render itself is polled later via `refreshRender`.
 */
export async function startRender(videoId: string): Promise<void> {
  const video = await getVideo(videoId);
  if (!video) throw new Error("Video not found.");

  const character = await getCharacter(video.character_id);
  if (!character) throw new Error("Character not found.");

  const voiceId = video.voice_id ?? character.voice_id;
  if (!voiceId) throw new Error("No voice selected — pick an ElevenLabs voice first.");
  if (!video.script.trim()) throw new Error("Script is empty.");

  // 1. Synthesize speech and keep a durable copy.
  const { buffer: audio, contentType } = await synthesizeSpeech({ voiceId, text: video.script });
  const audioPath = `${video.id}.mp3`;
  await uploadBytes(BUCKETS.audio, audioPath, audio, contentType);
  await updateVideo(video.id, { audio_path: audioPath });

  // 2 + 3. Hand audio + image to the provider and submit.
  const provider = getVideoProvider(video.provider);
  const imageUrl = publicUrl(BUCKETS.characters, character.image_path);
  const audioAssetId = provider.uploadAsset
    ? await provider.uploadAsset(audio, `${video.id}.mp3`, contentType)
    : undefined;

  const { providerJobId } = await provider.submit({
    imageUrl,
    audioAssetId,
    audioUrl: audioAssetId ? undefined : publicUrl(BUCKETS.audio, audioPath),
    dimension: { width: 720, height: 1280 },
  });

  await updateVideo(video.id, { status: "processing", provider_job_id: providerJobId });
}

/**
 * Poll the provider for a processing video. On completion, copy the MP4 into our
 * `videos` bucket (provider URLs expire) and flip the row. Returns the latest row.
 */
export async function refreshRender(videoId: string): Promise<Video> {
  const video = await getVideo(videoId);
  if (!video) throw new Error("Video not found.");
  if (video.status !== "processing" || !video.provider_job_id) return video;

  const provider = getVideoProvider(video.provider);
  const result = await provider.getStatus(video.provider_job_id);

  if (result.status === "completed" && result.videoUrl) {
    const path = `${video.id}.mp4`;
    await downloadAndStore(BUCKETS.videos, path, result.videoUrl, "video/mp4");
    return updateVideo(video.id, { status: "completed", video_path: path });
  }
  if (result.status === "failed") {
    return updateVideo(video.id, { status: "failed", error: result.error ?? "Render failed." });
  }
  return video;
}
