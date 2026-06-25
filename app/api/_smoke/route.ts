import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api";
import { BUCKETS, publicUrl, signedUrl, uploadBytes } from "@/lib/supabase";
import { generateCharacterImage } from "@/lib/services/image";
import { listVoices, synthesizeSpeech } from "@/lib/services/voice";
import { getVideoProvider } from "@/lib/providers/video";

/**
 * THROWAWAY provider smoke tests (Phase 1) — delete before launch.
 * Validates each external call end-to-end with your real keys:
 *   /api/_smoke?check=supabase   (free)  storage round-trip
 *   /api/_smoke?check=voices     (free)  ElevenLabs voice list
 *   /api/_smoke?check=image      ($)     Nano Banana Pro -> store
 *   /api/_smoke?check=tts&voiceId=...           ($) ElevenLabs TTS -> store
 *   /api/_smoke?check=video&imageUrl=...&voiceId=...  ($$$) HeyGen submit
 *   /api/_smoke?check=video-status&jobId=...    (free) HeyGen poll
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const check = sp.get("check");
  const stamp = Date.now();

  try {
    switch (check) {
      case "supabase": {
        const path = `_smoke/ping-${stamp}.txt`;
        await uploadBytes(BUCKETS.characters, path, Buffer.from("ok"), "text/plain");
        return ok({ check, stored: publicUrl(BUCKETS.characters, path) });
      }
      case "voices": {
        const voices = await listVoices(sp.get("search") ?? undefined);
        return ok({ check, count: voices.length, sample: voices.slice(0, 3) });
      }
      case "image": {
        const prompt =
          sp.get("prompt") ?? "Studio headshot of a friendly presenter, soft key light, neutral backdrop";
        const img = await generateCharacterImage({ prompt, imageSize: "1K" });
        const path = `_smoke/img-${stamp}.png`;
        await uploadBytes(BUCKETS.characters, path, img.buffer, img.mimeType);
        return ok({ check, model: img.modelId, url: publicUrl(BUCKETS.characters, path) });
      }
      case "tts": {
        const voiceId = sp.get("voiceId");
        if (!voiceId) return fail("Pass ?voiceId= (grab one from ?check=voices).", 400);
        const text = sp.get("text") ?? "Hello from Soundstage.";
        const { buffer, contentType } = await synthesizeSpeech({ voiceId, text });
        const path = `_smoke/tts-${stamp}.mp3`;
        await uploadBytes(BUCKETS.audio, path, buffer, contentType);
        return ok({ check, bytes: buffer.length, url: await signedUrl(BUCKETS.audio, path) });
      }
      case "video": {
        const imageUrl = sp.get("imageUrl");
        const voiceId = sp.get("voiceId");
        if (!imageUrl || !voiceId) return fail("Pass ?imageUrl= and ?voiceId=. Costs ~$4/min.", 400);
        const text = sp.get("text") ?? "Hello from Soundstage.";
        const { buffer, contentType } = await synthesizeSpeech({ voiceId, text });
        const provider = getVideoProvider();
        const audioAssetId = provider.uploadAsset
          ? await provider.uploadAsset(buffer, "smoke.mp3", contentType)
          : undefined;
        const { providerJobId } = await provider.submit({ imageUrl, audioAssetId });
        return ok({ check, providerJobId, poll: `/api/_smoke?check=video-status&jobId=${providerJobId}` });
      }
      case "video-status": {
        const jobId = sp.get("jobId");
        if (!jobId) return fail("Pass ?jobId=.", 400);
        return ok({ check, status: await getVideoProvider().getStatus(jobId) });
      }
      default:
        return ok({
          usage: "?check=supabase|voices|image|tts|video|video-status",
          note: "image, tts and video make real (paid) API calls.",
        });
    }
  } catch (e) {
    return fail(e);
  }
}
