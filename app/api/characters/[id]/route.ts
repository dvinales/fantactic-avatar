import type { NextRequest } from "next/server";
import { deleteCharacter, getCharacter, setCharacterVoice } from "@/lib/repo";
import { ok, fail } from "@/lib/api";
import type { VoiceSettings } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const character = await getCharacter(id);
    if (!character) return fail("Character not found.", 404);
    return ok(character);
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      voice_id?: string;
      voice_name?: string | null;
      voice_settings?: VoiceSettings | null;
    };
    if (!body.voice_id) return fail("voice_id is required.", 400);
    const character = await setCharacterVoice(id, {
      voice_id: body.voice_id,
      voice_name: body.voice_name ?? null,
      voice_settings: body.voice_settings ?? null,
    });
    return ok(character);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteCharacter(id);
    return ok({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
