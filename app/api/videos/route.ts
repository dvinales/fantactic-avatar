import type { NextRequest } from "next/server";
import { createVideo, getVideo, listVideos, updateVideo } from "@/lib/repo";
import { DEFAULT_VIDEO_PROVIDER } from "@/lib/providers/video";
import { startRender } from "@/lib/video-pipeline";
import { serializeVideo } from "@/lib/views";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // TTS + asset upload + submit happen inline

export async function GET() {
  try {
    return ok(await listVideos());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      character_id?: string;
      title?: string;
      script?: string;
      voice_id?: string;
      provider?: string;
    };
    if (!body.character_id || !body.script?.trim()) {
      return fail("character_id and script are required.", 400);
    }

    const video = await createVideo({
      character_id: body.character_id,
      title: body.title ?? null,
      script: body.script.trim(),
      voice_id: body.voice_id ?? null,
      provider: body.provider ?? DEFAULT_VIDEO_PROVIDER,
    });

    // Submit the render inline; the long render is polled later. Failures are
    // recorded on the row (not thrown) so the detail page can show them.
    try {
      await startRender(video.id);
    } catch (e) {
      await updateVideo(video.id, {
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }

    const fresh = await getVideo(video.id);
    return ok(serializeVideo(fresh!), 201);
  } catch (e) {
    return fail(e);
  }
}
