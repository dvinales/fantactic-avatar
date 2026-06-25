import "server-only";
import { requireEnv, HEYGEN_ENGINE } from "@/lib/env";
import type {
  VideoCapabilities,
  VideoProvider,
  VideoStatusResult,
  VideoSubmitInput,
} from "./types";

const API_BASE = "https://api.heygen.com";

function key() {
  return requireEnv("HEYGEN_API_KEY");
}

/**
 * HeyGen provider — Avatar IV (single photo -> talking video), HeyGen API v3.
 *
 * Flow: upload the ElevenLabs MP3 as an asset (`POST /v3/assets`) -> submit a
 * video with the character image URL + that audio asset (`POST /v3/videos`) ->
 * poll (`GET /v3/videos/{id}`) -> download the MP4.
 *
 * ⚠️ VERIFY AT BUILD TIME: HeyGen's docs render as SPA shells, so the exact
 * `/v3/videos` request body for the *photo-input + external-audio* combination
 * is best-effort here (engine `avatar_iv`, `image_url`, nested `voice` audio
 * source). Confirm against live docs / one test call before a production run —
 * all response parsing below is defensive so a field rename is a localized fix.
 */
export class HeyGenProvider implements VideoProvider {
  readonly name = "heygen";
  readonly capabilities: VideoCapabilities = {
    supportsScriptDrivenLipSync: true,
    supportsAvatarIdentity: true,
    maxDurationSec: 300,
    resolutions: ["720p", "1080p"],
  };

  async uploadAsset(bytes: Buffer, filename: string, contentType: string): Promise<string> {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type: contentType }), filename);
    // No explicit Content-Type header: fetch sets the multipart boundary itself.
    const res = await fetch(`${API_BASE}/v3/assets`, {
      method: "POST",
      headers: { "X-Api-Key": key() },
      body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`HeyGen asset upload failed (${res.status}): ${JSON.stringify(json)}`);
    }
    const id = json?.data?.asset_id ?? json?.data?.id ?? json?.asset_id;
    if (!id) throw new Error(`HeyGen asset upload returned no id: ${JSON.stringify(json)}`);
    return id as string;
  }

  async submit(input: VideoSubmitInput): Promise<{ providerJobId: string }> {
    if (!input.imageUrl && !input.imageAssetId) {
      throw new Error("HeyGen submit: an image (imageUrl or imageAssetId) is required.");
    }
    const hasAudio = input.audioAssetId || input.audioUrl;
    if (!hasAudio && !(input.script && input.voiceId)) {
      throw new Error("HeyGen submit: an audio source (or script + voiceId) is required.");
    }

    const voice = input.audioAssetId
      ? { type: "audio", audio_asset_id: input.audioAssetId }
      : input.audioUrl
        ? { type: "audio", audio_url: input.audioUrl }
        : { type: "text", input_text: input.script, voice_id: input.voiceId };

    const body: Record<string, unknown> = {
      type: "avatar",
      engine: HEYGEN_ENGINE, // avatar_iv
      ...(input.imageUrl ? { image_url: input.imageUrl } : { image_asset_id: input.imageAssetId }),
      voice,
      dimension: input.dimension ?? { width: 720, height: 1280 },
      ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
    };

    const res = await fetch(`${API_BASE}/v3/videos`, {
      method: "POST",
      headers: { "X-Api-Key": key(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`HeyGen create video failed (${res.status}): ${JSON.stringify(json)}`);
    }
    const id = json?.data?.video_id ?? json?.data?.id ?? json?.video_id;
    if (!id) throw new Error(`HeyGen create video returned no video_id: ${JSON.stringify(json)}`);
    return { providerJobId: id as string };
  }

  async getStatus(providerJobId: string): Promise<VideoStatusResult> {
    const res = await fetch(`${API_BASE}/v3/videos/${providerJobId}`, {
      headers: { "X-Api-Key": key() },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`HeyGen status failed (${res.status}): ${JSON.stringify(json)}`);
    }
    const data = json?.data ?? json;
    const status = String(data?.status ?? "").toLowerCase();

    if (status === "completed" || status === "success") {
      return { status: "completed", videoUrl: data?.video_url ?? data?.url };
    }
    if (status === "failed" || status === "error") {
      return {
        status: "failed",
        error: data?.error?.message ?? data?.msg ?? "HeyGen render failed",
      };
    }
    return { status: "processing" };
  }
}
