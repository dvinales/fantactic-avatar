import "server-only";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { requireEnv, TTS_MODEL } from "@/lib/env";
import type { VoiceOption } from "@/lib/types";

function client() {
  return new ElevenLabsClient({ apiKey: requireEnv("ELEVENLABS_API_KEY") });
}

/** Collect a TTS stream (web ReadableStream or Node async-iterable) into a Buffer. */
async function collectStream(stream: unknown): Promise<Buffer> {
  const s = stream as {
    [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array>;
    getReader?: () => ReadableStreamDefaultReader<Uint8Array>;
  };
  const chunks: Buffer[] = [];
  if (typeof s?.[Symbol.asyncIterator] === "function") {
    for await (const c of s as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(c));
    return Buffer.concat(chunks);
  }
  if (typeof s?.getReader === "function") {
    const reader = s.getReader!();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }
  return Buffer.from(stream as Uint8Array);
}

/**
 * List voices for the picker UI. Reads from the user's voice library
 * (`voices.search`), whose ids are directly usable in TTS. Field access is
 * defensive (snake_case JSON vs camelCase SDK mapping varies by SDK build).
 */
export async function listVoices(search?: string): Promise<VoiceOption[]> {
  const res = (await client().voices.search({
    search: search || undefined,
    pageSize: 100,
  })) as unknown as { voices?: Record<string, unknown>[] };

  const raw = res.voices ?? [];
  return raw.map((v): VoiceOption => {
    const get = (a: string, b: string) => (v[a] ?? v[b]) as string | undefined;
    return {
      voice_id: (get("voice_id", "voiceId") ?? "") as string,
      name: (v.name as string) ?? "Unnamed",
      category: (v.category as string) ?? null,
      labels: ((v.labels as Record<string, string>) ?? {}) as Record<string, string>,
      preview_url: (get("preview_url", "previewUrl") ?? null) as string | null,
      description: (v.description as string) ?? null,
    };
  });
}

/** Synthesize speech and return MP3 bytes (mp3_44100_128 — ideal for HeyGen). */
export async function synthesizeSpeech(opts: {
  voiceId: string;
  text: string;
  modelId?: string;
}): Promise<{ buffer: Buffer; contentType: string }> {
  const stream = await client().textToSpeech.convert(opts.voiceId, {
    text: opts.text,
    modelId: opts.modelId ?? TTS_MODEL,
    outputFormat: "mp3_44100_128",
  });
  const buffer = await collectStream(stream);
  return { buffer, contentType: "audio/mpeg" };
}
