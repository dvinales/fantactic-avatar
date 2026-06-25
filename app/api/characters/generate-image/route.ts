import type { NextRequest } from "next/server";
import { generateCharacterImage, type ReferenceImage } from "@/lib/services/image";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 120; // image generation can take a while at 2K/4K

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      prompt?: string;
      referenceImages?: ReferenceImage[];
      aspectRatio?: string;
      imageSize?: "512" | "1K" | "2K" | "4K";
    };
    if (!body.prompt?.trim()) return fail("A prompt is required.", 400);

    const image = await generateCharacterImage({
      prompt: body.prompt.trim(),
      referenceImages: body.referenceImages,
      aspectRatio: body.aspectRatio,
      imageSize: body.imageSize,
    });

    return ok({
      imageBase64: image.buffer.toString("base64"),
      mimeType: image.mimeType,
      modelId: image.modelId,
    });
  } catch (e) {
    return fail(e);
  }
}
