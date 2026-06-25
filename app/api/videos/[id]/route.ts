import type { NextRequest } from "next/server";
import { refreshRender } from "@/lib/video-pipeline";
import { serializeVideo } from "@/lib/views";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Poll endpoint: checks the provider, persists a finished MP4, returns the row. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const video = await refreshRender(id);
    return ok(serializeVideo(video));
  } catch (e) {
    return fail(e);
  }
}
