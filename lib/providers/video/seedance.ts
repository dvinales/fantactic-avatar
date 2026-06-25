import "server-only";
import type { VideoCapabilities, VideoProvider, VideoStatusResult } from "./types";

/**
 * Seedance — PHASE-2 STUB (not wired up).
 *
 * Seedance is a cinematic image/text-to-video engine, NOT a script-driven
 * talking-head model (its speech is model-generated, not lip-synced to your
 * audio). Its capability flags below intentionally report `false` for the
 * talking-avatar features so the orchestrator never routes a talking-avatar job
 * here. When Seedance 2.5 reaches a non-China API route (fal.ai / Replicate /
 * BytePlus), implement `submit`/`getStatus` against the same submit->poll->fetch
 * lifecycle as HeyGen and surface it for "cinematic B-roll" use cases.
 */
export class SeedanceProvider implements VideoProvider {
  readonly name = "seedance";
  readonly capabilities: VideoCapabilities = {
    supportsScriptDrivenLipSync: false,
    supportsAvatarIdentity: false,
    maxDurationSec: 15,
    resolutions: ["480p", "720p"],
  };

  // Params intentionally omitted — implementing the interface as a stub. TS
  // permits fewer parameters than the interface signature.
  async submit(): Promise<{ providerJobId: string }> {
    throw new Error("Seedance provider is not implemented yet (phase-2 cinematic engine).");
  }

  async getStatus(): Promise<VideoStatusResult> {
    throw new Error("Seedance provider is not implemented yet (phase-2 cinematic engine).");
  }
}
