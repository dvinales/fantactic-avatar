/**
 * Pluggable video-provider abstraction.
 *
 * Every engine shares the same lifecycle: submit a job -> poll status -> fetch a
 * finished MP4 URL (which we then copy into our own storage, since provider URLs
 * expire). HeyGen (Avatar IV) implements this for talking avatars today; Seedance
 * is a phase-2 cinematic engine stub. Capability flags let the orchestrator route
 * a job to a provider that actually supports what it needs.
 */

export interface VideoCapabilities {
  /** Lip-sync driven by OUR audio/script (vs. model-invented speech). */
  supportsScriptDrivenLipSync: boolean;
  /** Keeps a persistent avatar identity (talking head). */
  supportsAvatarIdentity: boolean;
  maxDurationSec: number;
  resolutions: string[];
}

export interface VideoSubmitInput {
  /** Visual source: a publicly fetchable image URL, or a provider asset id. */
  imageUrl?: string;
  imageAssetId?: string;
  /** Voice source: pre-rendered audio (preferred for the ElevenLabs path)... */
  audioUrl?: string;
  audioAssetId?: string;
  /** ...or let the provider TTS it (not used in the ElevenLabs flow). */
  script?: string;
  voiceId?: string;
  dimension?: { width: number; height: number };
  callbackUrl?: string;
}

export interface VideoStatusResult {
  status: "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export interface VideoProvider {
  readonly name: string;
  readonly capabilities: VideoCapabilities;
  /** Upload media bytes to the provider; returns an asset id. Optional per provider. */
  uploadAsset?(bytes: Buffer, filename: string, contentType: string): Promise<string>;
  submit(input: VideoSubmitInput): Promise<{ providerJobId: string }>;
  getStatus(providerJobId: string): Promise<VideoStatusResult>;
}
