import type { NextRequest } from "next/server";
import { createCharacter, listCharacters } from "@/lib/repo";
import { BUCKETS, uploadBytes } from "@/lib/supabase";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listCharacters());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      description?: string;
      imageBase64?: string;
      mimeType?: string;
      imageModelId?: string;
    };
    if (!body.name?.trim() || !body.imageBase64) {
      return fail("name and a generated image are required.", 400);
    }
    const mimeType = body.mimeType ?? "image/png";
    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : "png";
    const path = `${crypto.randomUUID()}.${ext}`;
    await uploadBytes(BUCKETS.characters, path, Buffer.from(body.imageBase64, "base64"), mimeType);

    const character = await createCharacter({
      name: body.name.trim(),
      description: body.description ?? "",
      image_path: path,
      image_model_id: body.imageModelId ?? "",
    });
    return ok(character, 201);
  } catch (e) {
    return fail(e);
  }
}
