# Soundstage — AI Avatar Studio

Cast synthetic talent, then direct it on camera. Soundstage is a single production
line for AI talking-avatar videos:

1. **Cast the face** — generate a reusable character headshot with **Nano Banana Pro** (Gemini 3 Pro Image).
2. **Write the lines** — draft and tighten a spoken script with **Claude**.
3. **Find the voice** — audition and bind an **ElevenLabs** voice to the character.
4. **Roll camera** — **HeyGen Avatar IV** turns the photo + voice into a talking-avatar video.

Built with Next.js 16 (App Router) + Supabase (Postgres + Storage), deployable on Vercel.

> **Single-user v1.** No accounts; the app is gated by a shared secret because it
> spends platform-funded, metered API keys. See [Security](#security).

---

## How it works

```
Character image (Nano Banana Pro) ─┐
Script (Claude) ───────────────────┤
Voice → MP3 (ElevenLabs) ──────────┴─→ HeyGen Avatar IV ─→ poll ─→ store MP4 (Supabase)
```

- **Providers are wrapped** in `lib/services/*` (image, voice, script) and a pluggable
  `VideoProvider` registry in `lib/providers/video/*`. HeyGen is implemented today;
  Seedance is a documented phase-2 cinematic stub.
- **Renders are async.** Submitting a video creates a `videos` row, runs TTS, uploads
  the audio + submits the HeyGen job, then returns. The client **polls**
  `GET /api/videos/[id]`, which checks HeyGen and, on completion, copies the MP4 into
  Supabase Storage (provider URLs expire). Polling works identically locally and on Vercel.
- **Assets are persisted immediately** to Supabase Storage — Gemini/HeyGen URLs are short-lived.

---

## Setup

### 1. Install

```bash
bun install
```

### 2. Supabase

Create a project at [supabase.com](https://supabase.com), then apply the schema +
storage buckets in `supabase/migrations/0001_init.sql` using **any** of:

- the SQL editor (paste the file), or
- the Supabase MCP `apply_migration`, or
- `supabase link` + `supabase db push`.

From **Project Settings → API**, copy the **Project URL** and the **service_role** key.

### 3. API keys

| Key | Where |
|-----|-------|
| `GEMINI_API_KEY` | Google AI Studio (Gemini API) — image generation |
| `ELEVENLABS_API_KEY` | ElevenLabs → Profile → API key |
| `HEYGEN_API_KEY` | HeyGen → Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com — script writing |

### 4. Environment

```bash
cp .env.example .env.local
# fill in the keys, the Supabase URL + service role key,
# and a long random APP_ACCESS_SECRET
```

### 5. Run

```bash
bun run dev   # http://localhost:3000
```

In local dev, leaving `APP_ACCESS_SECRET` empty disables the gate. Set it to test login.

---

## Verify

### Provider smoke tests (do this first)

Before relying on the full flow, validate each external call with your real keys.
Visit (logged in):

| URL | Cost | Checks |
|-----|------|--------|
| `/api/_smoke?check=supabase` | free | Storage upload + public URL |
| `/api/_smoke?check=voices` | free | ElevenLabs voice list |
| `/api/_smoke?check=image` | ~$0.13 | Nano Banana Pro → stored image URL |
| `/api/_smoke?check=tts&voiceId=<id>` | a few credits | ElevenLabs TTS → stored MP3 |
| `/api/_smoke?check=video&imageUrl=<url>&voiceId=<id>` | **~$4/min** | HeyGen submit |
| `/api/_smoke?check=video-status&jobId=<id>` | free | HeyGen poll |

The `_smoke` route is throwaway — delete `app/api/_smoke/` before launch.

### Full flow

`bun run dev` → create a character (image generates + saves) → draft/edit a script →
audition + pick a voice → **Roll camera** → watch the take move `Rolling → Ready`, then
play and download the stored MP4.

> **Cost:** HeyGen Avatar IV is billed per minute (~$4/min). Test with a 1–2 sentence script.

### ⚠️ Verify against live docs before the first paid run

These were synthesised from current docs but flagged as version-sensitive:

- **HeyGen `/v3/videos` request body** for the *photo + external-audio* combination
  (`lib/providers/video/heygen.ts`). HeyGen's docs render as SPA shells, so the exact
  field names (`engine`, `image_url`, nested `voice` audio source) may differ. Responses
  are parsed defensively, so a rename is a one-file fix. v2 (`/v2/video/generate`) is the
  documented fallback if needed.
- **Nano Banana Pro model ID** — pinned to `gemini-3-pro-image-preview` via `IMAGE_MODEL`.
  If Google promotes the GA `gemini-3-pro-image` alias, switch the env var.
- **`interactions.create` image shape** (`lib/services/image.ts`) uses the documented
  @google/genai v2 path; cast to a structural type, so verify the first real call.

---

## Security

Single-user + platform-funded keys + a public URL = an exposed wallet. Defences:

- **Access gate** (`proxy.ts`): requires the `APP_ACCESS_SECRET` cookie for every page/API.
  Fails **closed** in production if the secret isn't set. The cookie stores a SHA-256-derived
  token (never the raw secret), comparisons are constant-time (`lib/gate.ts`), and the cookie
  is `httpOnly` + `sameSite=lax` (+ `secure` in prod).
  *Known v1 limitation:* no login rate-limiting (stateless serverless) — rely on a long random
  secret and Vercel password protection. Use a real auth provider if this becomes multi-user.
- **Recommended:** also enable **Vercel deployment password protection** for defence in depth.
- All API keys are server-side only (`lib/env.ts`); never imported into client components.
- Storage: `characters` + `videos` buckets are public-read (HeyGen fetches the image by URL;
  the browser streams the video); `audio` is private. Asset paths are UUIDs.

---

## Deploy (Vercel)

1. Push to a repo and import into Vercel.
2. Add all env vars from `.env.example` (set a strong `APP_ACCESS_SECRET`).
3. Routes that call SDKs run on the **Node runtime** (already configured); image/video
   submit routes set `maxDuration` for the inline TTS + submit step.
4. Optionally enable deployment password protection.

---

## Roadmap (out of scope for v1)

- **Seedance** video engine (cinematic B-roll) — stub in `lib/providers/video/seedance.ts`.
- **HeyGen webhooks** instead of polling (faster completion; needs a public callback URL).
- **Multi-user accounts**, billing/credits, voice cloning.

---

## Project structure

```
app/
  (app)/            studio UI (home, characters, create, videos) — behind the nav
  login/            access gate
  api/              characters, voices, script, videos, auth, _smoke (throwaway)
components/         UI primitives + feature components (voice-picker, new-shoot, …)
lib/
  services/         image (Nano Banana Pro), voice (ElevenLabs), script (Claude)
  providers/video/  VideoProvider abstraction + HeyGen + Seedance stub
  video-pipeline.ts orchestration (TTS → submit → poll → store)
  repo.ts / supabase.ts / views.ts / env.ts
proxy.ts            access gate (Next 16 proxy convention)
supabase/migrations/0001_init.sql
```
