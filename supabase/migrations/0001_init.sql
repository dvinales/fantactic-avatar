-- AI Video Avatar Platform — initial schema + storage buckets.
-- Apply via: Supabase SQL editor, the Supabase MCP `apply_migration`, or
--   `supabase db push` (after `supabase link`).

create extension if not exists "pgcrypto";

-- --- Characters: reusable AI characters (image + bound voice) ---
create table if not exists public.characters (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text not null default '',           -- the image-generation prompt
  image_path     text not null,                       -- path in the `characters` storage bucket
  image_model_id text,
  voice_id       text,                                -- bound ElevenLabs voice (optional)
  voice_name     text,
  voice_settings jsonb,
  created_at     timestamptz not null default now()
);

-- --- Videos: a render request; doubles as the async job record ---
create table if not exists public.videos (
  id              uuid primary key default gen_random_uuid(),
  character_id    uuid not null references public.characters(id) on delete cascade,
  title           text,
  script          text not null default '',
  voice_id        text,
  provider        text not null default 'heygen',
  provider_job_id text,                               -- e.g. HeyGen video_id
  status          text not null default 'pending'
                    check (status in ('pending','processing','completed','failed')),
  audio_path      text,                               -- path in `audio` bucket (TTS mp3)
  video_path      text,                               -- path in `videos` bucket (final mp4)
  error           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists videos_character_id_idx on public.videos(character_id);
create index if not exists videos_status_idx on public.videos(status);

-- RLS on, with NO policies. The app talks to Postgres only via the service-role
-- key (which bypasses RLS); anon/public clients therefore get zero table access.
alter table public.characters enable row level security;
alter table public.videos enable row level security;

-- --- Storage buckets ---
-- characters + videos are public-read (HeyGen fetches the character image by URL;
-- the browser streams the finished video). audio stays private (signed URLs only).
insert into storage.buckets (id, name, public)
values
  ('characters', 'characters', true),
  ('audio',      'audio',      false),
  ('videos',     'videos',     true)
on conflict (id) do nothing;
