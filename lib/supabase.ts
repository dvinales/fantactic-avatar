import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

export const BUCKETS = {
  characters: "characters", // public read (HeyGen fetches the image by URL)
  audio: "audio", // private archival copy of TTS output
  videos: "videos", // public read (browser <video> playback)
} as const;

let _client: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key. Single-user v1 has no
 * end-user auth, so the server is fully trusted and bypasses RLS. NEVER expose
 * this client (or the service role key) to the browser.
 */
export function db(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _client;
}

type Bucket = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Upload raw bytes to a bucket. Returns the stored path. */
export async function uploadBytes(
  bucket: Bucket,
  path: string,
  data: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  const { error } = await db()
    .storage.from(bucket)
    .upload(path, data, { contentType, upsert: true });
  if (error) throw new Error(`Storage upload failed (${bucket}/${path}): ${error.message}`);
  return path;
}

/** Fetch a (possibly expiring) provider URL and persist a durable copy in storage. */
export async function downloadAndStore(
  bucket: Bucket,
  path: string,
  sourceUrl: string,
  contentType: string,
): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to download ${sourceUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return uploadBytes(bucket, path, buf, contentType);
}

/** Public URL for an asset in a public bucket. */
export function publicUrl(bucket: Bucket, path: string): string {
  return db().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Time-limited signed URL for a private bucket (e.g. audio). */
export async function signedUrl(
  bucket: Bucket,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await db()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) throw new Error(`Signed URL failed (${bucket}/${path}): ${error?.message}`);
  return data.signedUrl;
}
