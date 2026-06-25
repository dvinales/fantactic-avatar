import type { NextRequest } from "next/server";
import { generateScript, reviseScript } from "@/lib/services/script";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mode?: "generate" | "revise";
      brief?: string;
      tone?: string;
      durationSeconds?: number;
      characterDescription?: string;
      script?: string;
      instruction?: string;
    };

    if (body.mode === "revise") {
      if (!body.script || !body.instruction) {
        return fail("script and instruction are required to revise.", 400);
      }
      return ok({ script: await reviseScript({ script: body.script, instruction: body.instruction }) });
    }

    if (!body.brief?.trim()) return fail("A brief is required.", 400);
    return ok({
      script: await generateScript({
        brief: body.brief.trim(),
        tone: body.tone,
        durationSeconds: body.durationSeconds,
        characterDescription: body.characterDescription,
      }),
    });
  } catch (e) {
    return fail(e);
  }
}
