import type { NextRequest } from "next/server";
import { listVoices } from "@/lib/services/voice";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    return ok(await listVoices(search));
  } catch (e) {
    return fail(e);
  }
}
