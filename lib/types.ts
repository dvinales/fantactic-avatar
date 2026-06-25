/** Domain + DB row types. Single-user v1: no user_id scoping. */

export type VideoStatus = "pending" | "processing" | "completed" | "failed";

/** ElevenLabs voice settings persisted on a character so the voice is reproducible. */
export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

/** A reusable AI character. The image lives in Supabase Storage (`image_path`). */
export interface Character {
  id: string;
  name: string;
  /** The prompt used to generate the image — kept so the look can be regenerated. */
  description: string;
  image_path: string;
  image_model_id: string | null;
  /** Bound ElevenLabs voice (optional until the user picks one). */
  voice_id: string | null;
  voice_name: string | null;
  voice_settings: VoiceSettings | null;
  created_at: string;
}

/** A video render. Doubles as the async job record. */
export interface Video {
  id: string;
  character_id: string;
  title: string | null;
  script: string;
  voice_id: string | null;
  provider: string; // 'heygen' (Seedance later)
  provider_job_id: string | null;
  status: VideoStatus;
  audio_path: string | null;
  video_path: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/** Voice as surfaced to the picker UI (subset of the ElevenLabs voice object). */
export interface VoiceOption {
  voice_id: string;
  name: string;
  category: string | null;
  labels: Record<string, string>;
  preview_url: string | null;
  description: string | null;
}
