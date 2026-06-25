import { db } from "./supabase";
import type { Character, Video, VideoStatus, VoiceSettings } from "./types";

// --- Characters ---

export async function listCharacters(): Promise<Character[]> {
  const { data, error } = await db()
    .from("characters")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCharacter(id: string): Promise<Character | null> {
  const { data, error } = await db().from("characters").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCharacter(input: {
  name: string;
  description: string;
  image_path: string;
  image_model_id: string;
}): Promise<Character> {
  const { data, error } = await db().from("characters").insert(input).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function setCharacterVoice(
  id: string,
  voice: { voice_id: string; voice_name: string | null; voice_settings: VoiceSettings | null },
): Promise<Character> {
  const { data, error } = await db().from("characters").update(voice).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await db().from("characters").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// --- Videos ---

export async function listVideos(): Promise<Video[]> {
  const { data, error } = await db()
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getVideo(id: string): Promise<Video | null> {
  const { data, error } = await db().from("videos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createVideo(input: {
  character_id: string;
  title: string | null;
  script: string;
  voice_id: string | null;
  provider: string;
}): Promise<Video> {
  const { data, error } = await db()
    .from("videos")
    .insert({ ...input, status: "pending" as VideoStatus })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateVideo(
  id: string,
  patch: Partial<
    Pick<Video, "status" | "provider_job_id" | "audio_path" | "video_path" | "error">
  >,
): Promise<Video> {
  const { data, error } = await db()
    .from("videos")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
