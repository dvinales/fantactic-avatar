/**
 * Server-side environment access.
 *
 * All paid-API keys are read here and ONLY used in server code (Route Handlers /
 * Server Actions). Never import this from a Client Component.
 *
 * `requireEnv` throws at call time (not import time) so a missing key produces a
 * clear runtime error in the one route that needs it, instead of breaking the
 * whole build / every page.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

// --- Model / provider configuration (overridable, with sensible defaults) ---

/** Nano Banana Pro = Gemini 3 Pro Image. Pin the id; the -preview suffix is the verified-working one. */
export const IMAGE_MODEL = optionalEnv("IMAGE_MODEL", "gemini-3-pro-image-preview");

/** ElevenLabs TTS model. eleven_v3 = most expressive (70+ langs, ~5k char/request). */
export const TTS_MODEL = optionalEnv("ELEVENLABS_TTS_MODEL", "eleven_v3");

/** Claude model used for script assistance. */
export const SCRIPT_MODEL = optionalEnv("SCRIPT_MODEL", "claude-sonnet-4-6");

/** HeyGen avatar engine. Avatar IV = photo -> talking video (our pipeline). */
export const HEYGEN_ENGINE = optionalEnv("HEYGEN_ENGINE", "avatar_iv");
