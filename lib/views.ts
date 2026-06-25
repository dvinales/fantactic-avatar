import { BUCKETS, publicUrl } from "./supabase";
import type { Character, Video } from "./types";

/** Public URL for a character's headshot. */
export function characterImageUrl(c: Pick<Character, "image_path">): string {
  return publicUrl(BUCKETS.characters, c.image_path);
}

/** Public URL for a finished take's MP4 (null until completed). */
export function videoFileUrl(v: Pick<Video, "video_path">): string | null {
  return v.video_path ? publicUrl(BUCKETS.videos, v.video_path) : null;
}

/** Video row augmented with a playable URL, for JSON responses. */
export function serializeVideo(v: Video): Video & { video_url: string | null } {
  return { ...v, video_url: videoFileUrl(v) };
}
