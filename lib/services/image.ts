import "server-only";
import { GoogleGenAI } from "@google/genai";
import { requireEnv, IMAGE_MODEL } from "@/lib/env";

/**
 * Nano Banana Pro (Gemini 3 Pro Image) wrapper.
 *
 * Uses the SDK's `interactions.create` surface — the documented path for the
 * `gemini-3-pro-image-preview` model in @google/genai v2. The interactions API
 * isn't strongly typed in every SDK build, so we cast the call to a minimal
 * structural type. If a future SDK changes the shape, this is the single place
 * to adjust. (Flagged in README as "verify at build time".)
 */
interface ImageInteractionsClient {
  interactions: {
    create(req: {
      model: string;
      input:
        | string
        | Array<{ type: string; text?: string; data?: string; mime_type?: string }>;
      response_modalities: string[];
      response_format?: { type: "image"; aspect_ratio?: string; image_size?: string };
    }): Promise<{ outputs?: Array<{ type: string; data?: string; mime_type?: string }> }>;
  };
}

export interface ReferenceImage {
  /** base64-encoded image bytes (no data: prefix). */
  data: string;
  mimeType: string;
}

export interface GenerateImageInput {
  prompt: string;
  /** Optional reference images for identity/style consistency (up to ~14 total). */
  referenceImages?: ReferenceImage[];
  aspectRatio?: string; // e.g. "3:4" portrait headshot, "9:16", "1:1"
  imageSize?: "512" | "1K" | "2K" | "4K";
}

export interface GeneratedImage {
  buffer: Buffer;
  mimeType: string;
  modelId: string;
}

export async function generateCharacterImage(
  input: GenerateImageInput,
): Promise<GeneratedImage> {
  const genai = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });

  const promptParts = input.referenceImages?.length
    ? [
        { type: "text", text: input.prompt },
        ...input.referenceImages.map((r) => ({
          type: "image",
          data: r.data,
          mime_type: r.mimeType,
        })),
      ]
    : input.prompt;

  const res = await (genai as unknown as ImageInteractionsClient).interactions.create({
    model: IMAGE_MODEL,
    input: promptParts,
    response_modalities: ["image"],
    response_format: {
      type: "image",
      aspect_ratio: input.aspectRatio ?? "3:4",
      image_size: input.imageSize ?? "2K",
    },
  });

  const image = res.outputs?.find((o) => o.type === "image" && o.data);
  if (!image?.data) {
    throw new Error("Nano Banana Pro returned no image (possibly blocked or rate-limited).");
  }
  return {
    buffer: Buffer.from(image.data, "base64"),
    mimeType: image.mime_type ?? "image/png",
    modelId: IMAGE_MODEL,
  };
}
