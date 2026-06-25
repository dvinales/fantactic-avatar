# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Soundstage** — a single-user AI talking-avatar studio. One production line turns a
generated face + a written script + a chosen voice into a talking-head MP4:

```
Character image (Nano Banana Pro / Gemini 3 Pro Image) ─┐
Script (Claude) ────────────────────────────────────────┤
Voice → MP3 (ElevenLabs) ────────────────────────────────┴─→ HeyGen Avatar IV ─→ poll ─→ store MP4 (Supabase)
```

Next.js 16 (App Router) + React 19 + Tailwind v4 + Supabase (Postgres + Storage), deploys on Vercel.

## Commands

Package manager is **bun** (`bun@1.3.10`) — there is a `bun.lock`, no `package-lock.json`.

```bash
bun install        # deps
bun run dev        # dev server → http://localhost:3000
bun run build      # production build
bun run start      # serve the production build
bun run lint       # eslint (eslint-config-next core-web-vitals + typescript)
```

There is **no test framework** in this repo (no test script, no test runner). Verification
is manual via the provider smoke routes (see below) and the full UI flow.

## Next.js 16 — read the docs first

Per `AGENTS.md`: **this is not the Next.js in your training data.** APIs, conventions, and
file layout differ. Before writing any Next.js code, read the relevant guide in
`node_modules/next/dist/docs/`. Two breaking changes already in use here:

- **`proxy.ts`** (repo root) replaces `middleware.ts` — Next 16's "proxy" convention. It runs the access gate.
- **Route params are async**: handlers receive `{ params: Promise<{ id: string }> }` and must `await params` (see `app/api/videos/[id]/route.ts`).

## Architecture

Strict layering — UI/routes never touch external SDKs or the DB directly; everything funnels through `lib/`.

| Layer | Path | Role |
|-------|------|------|
| Server env | `lib/env.ts` | Reads all secrets + model config. `requireEnv` throws **at call time**, not import time. |
| DB client | `lib/supabase.ts` | Lazy singleton service-role client `db()` + storage helpers + `BUCKETS`. |
| Repo | `lib/repo.ts` | All Postgres CRUD for `characters` / `videos`. |
| AI services | `lib/services/{image,voice,script}.ts` | Wrap Gemini, ElevenLabs, Claude (via AI SDK). |
| Video providers | `lib/providers/video/*` | Pluggable `VideoProvider` registry: `heygen` (live), `seedance` (phase-2 stub). |
| Orchestration | `lib/video-pipeline.ts` | `startRender` (TTS → upload asset → submit) and `refreshRender` (poll → download → store). |
| Views | `lib/views.ts` | Augments DB rows with public asset URLs for JSON responses (`serializeVideo`). |
| Routes | `app/api/*` | Thin handlers; delegate to repo/services/pipeline. |
| UI | `app/(app)/*`, `components/*` | Studio pages (server components) + client components. |

### The async render model (most important pattern)

Renders are long (minutes) and there are **no webhooks in v1 — the client polls**:

1. `POST /api/videos` creates a `videos` row, then runs `startRender` **inline** (TTS + asset upload + provider submit), then returns. The `videos` row doubles as the async job record (`status`, `provider_job_id`).
2. The take page client component (`components/take-viewer.tsx`) polls `GET /api/videos/[id]` every 4s while status is `pending`/`processing`.
3. `refreshRender` checks the provider; on completion it **downloads the provider MP4 and copies it into Supabase Storage** (provider URLs expire), then flips the row to `completed`.

When extending the pipeline, preserve these invariants:
- **Persist external assets immediately.** Gemini/HeyGen URLs are short-lived — always `uploadBytes`/`downloadAndStore` into a bucket and serve the Supabase URL.
- **Record failures on the row, don't throw to the client.** `startRender` failures are caught in the route and written as `status: "failed"` + `error` so the UI can display them.
- Polling must work identically locally and on Vercel — don't introduce in-memory job state.

### Provider abstraction

Add a video engine by implementing `VideoProvider` (`lib/providers/video/types.ts`) and registering it in `lib/providers/video/index.ts`. Capability flags (`supportsScriptDrivenLipSync`, etc.) let the orchestrator route work. Provider response parsing is **deliberately defensive** (multiple fallback field names) because vendor docs are version-sensitive — keep new providers the same way.

## Conventions

- **`import "server-only";`** tops every module that reads secrets or hits the DB (`env`, `supabase`, `repo`-callers, `services/*`, `providers/*`, `video-pipeline`). Never import these into a client component — keys must stay server-side.
- **Route handlers**: `export const runtime = "nodejs"` + `export const dynamic = "force-dynamic"`; submit routes also set `maxDuration` (inline TTS+submit). Wrap bodies in `try/catch` and return via `ok()` / `fail()` from `lib/api.ts`.
- **Repo functions** throw `new Error(error.message)` on Supabase errors; callers handle.
- **Path alias** `@/*` → repo root.
- **Lazy secrets**: `db()` and provider key reads happen at call time, so a missing env var breaks only the one route that needs it — not the whole build.
- **Model IDs are env-overridable** with defaults in `lib/env.ts` (`IMAGE_MODEL`, `ELEVENLABS_TTS_MODEL`, `SCRIPT_MODEL`, `HEYGEN_ENGINE`).

## Data & storage

- DB: `supabase/migrations/0001_init.sql` (apply via SQL editor, Supabase MCP `apply_migration`, or `supabase db push`).
- **RLS is enabled with NO policies** — the app reaches Postgres only through the service-role key (which bypasses RLS); anon/public clients get zero access.
- Buckets: `characters` + `videos` are **public-read** (HeyGen fetches the image by URL; browser streams the MP4); `audio` is **private** (signed URLs only).

## Security (single-user gate)

The URL fronts metered, platform-funded API keys, so it's gated by a shared secret (`proxy.ts` + `lib/gate.ts`):
- Cookie stores a **SHA-256-derived token**, never the raw secret; comparisons are constant-time.
- **Fails closed in production** if `APP_ACCESS_SECRET` is unset; in dev, unset = gate disabled for convenience.
- This is a gate, **not auth** — no rate-limiting, no accounts. Use a real auth provider before going multi-user.

## Verify before paid runs

These were synthesised from version-sensitive docs — confirm against live docs / one real call:
- **HeyGen `/v3/videos` body** for photo-input + external-audio (`lib/providers/video/heygen.ts`); v2 `/v2/video/generate` is the documented fallback.
- **Nano Banana Pro model id** (`gemini-3-pro-image-preview`) and the `@google/genai` v2 image-generation shape (`lib/services/image.ts`).

Smoke-test each provider with real keys (logged in) before the full flow: `GET /api/_smoke?check=<supabase|voices|image|tts|video|video-status>`. **`app/api/_smoke/` is throwaway — delete it before launch.** HeyGen Avatar IV is ~$4/min, so test with a 1–2 sentence script.
