"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { StepRail } from "@/components/step-rail";
import { VoicePicker } from "@/components/voice-picker";
import { cn } from "@/lib/utils";
import type { CharacterWithImage } from "@/components/character-grid";
import type { VoiceOption } from "@/lib/types";

const TONES = ["Friendly", "Professional", "Energetic", "Calm", "Playful"];
const DURATIONS = [
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
];

type Voice = { id: string; name: string };

export function NewShoot({
  characters,
  initialCharacterId,
  loadError,
}: {
  characters: CharacterWithImage[];
  initialCharacterId: string | null;
  loadError: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [characterId, setCharacterId] = useState<string | null>(
    initialCharacterId && characters.some((c) => c.id === initialCharacterId)
      ? initialCharacterId
      : null,
  );
  const character = useMemo(
    () => characters.find((c) => c.id === characterId) ?? null,
    [characters, characterId],
  );

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [duration, setDuration] = useState(30);
  const [script, setScript] = useState("");
  const [reviseText, setReviseText] = useState("");
  const [scriptBusy, setScriptBusy] = useState<"draft" | "revise" | null>(null);

  const [voice, setVoice] = useState<Voice | null>(
    character?.voice_id ? { id: character.voice_id, name: character.voice_name ?? "Voice" } : null,
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the bound voice in sync when the chosen character changes.
  function chooseCharacter(c: CharacterWithImage) {
    setCharacterId(c.id);
    setVoice(c.voice_id ? { id: c.voice_id, name: c.voice_name ?? "Voice" } : null);
  }

  async function draftScript() {
    if (!brief.trim()) return;
    setScriptBusy("draft");
    setError(null);
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          brief,
          tone,
          durationSeconds: duration,
          characterDescription: character?.description,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not draft the script.");
      setScript(j.script);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setScriptBusy(null);
    }
  }

  async function revise() {
    if (!reviseText.trim() || !script.trim()) return;
    setScriptBusy("revise");
    setError(null);
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "revise", script, instruction: reviseText }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not revise the script.");
      setScript(j.script);
      setReviseText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setScriptBusy(null);
    }
  }

  async function roll() {
    if (!character || !voice || !script.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Remember the voice on the character for next time.
      await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_id: voice.id, voice_name: voice.name }),
      });
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_id: character.id,
          title: title.trim() || null,
          script,
          voice_id: voice.id,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not start the render.");
      router.push(`/videos/${j.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  }

  const canNext =
    (step === 0 && !!character) ||
    (step === 1 && script.trim().length > 0) ||
    (step === 2 && !!voice);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-key">New shoot</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Direct a take</h1>
        <StepRail active={step} />
      </header>

      <Card className="rise">
        <CardBody className="space-y-6">
          {/* STEP 0 — Character */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg">Choose your talent</h2>
              {loadError ? (
                <p className="text-sm text-danger">{loadError}</p>
              ) : characters.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-xl border border-line p-5">
                  <p className="text-sm text-muted">No characters yet. Create one to start a shoot.</p>
                  <Link href="/characters/new">
                    <Button>Create a character</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {characters.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => chooseCharacter(c)}
                      className={cn(
                        "overflow-hidden rounded-xl border text-left transition",
                        characterId === c.id
                          ? "border-key/70 ring-2 ring-key/30"
                          : "border-line hover:border-faint",
                      )}
                    >
                      <span className="block aspect-[3/4] bg-ink">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                      </span>
                      <span className="block truncate px-2.5 py-2 text-sm">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — Script */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg">Write the script</h2>
              <Field label="Working title" hint="optional">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Launch teaser" />
              </Field>
              <Field label="Brief" hint="what should they say?">
                <Textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Announce our new feature: instant AI video avatars. Excited, concise, end with a call to try it."
                />
              </Field>
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">Tone</span>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition",
                          tone === t ? "border-key/60 bg-key/10 text-key" : "border-line text-muted hover:text-fg",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">Length</span>
                  <div className="flex gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition",
                          duration === d.value
                            ? "border-key/60 bg-key/10 text-key"
                            : "border-line text-muted hover:text-fg",
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={draftScript} variant="secondary" disabled={scriptBusy !== null || !brief.trim()}>
                {scriptBusy === "draft" ? <Spinner /> : "✦ Draft with Claude"}
              </Button>

              <Field label="Script" hint="the words spoken on camera">
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Write or generate the lines your avatar will speak."
                  className="min-h-44"
                />
              </Field>

              {script.trim() && (
                <div className="flex gap-2">
                  <Input
                    value={reviseText}
                    onChange={(e) => setReviseText(e.target.value)}
                    placeholder="Tweak it — “shorter”, “warmer”, “add a hook”…"
                  />
                  <Button onClick={revise} variant="secondary" disabled={scriptBusy !== null || !reviseText.trim()}>
                    {scriptBusy === "revise" ? <Spinner /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Voice */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg">Audition voices</h2>
                {voice && <Badge tone="synth">{voice.name}</Badge>}
              </div>
              <VoicePicker
                selectedId={voice?.id}
                onSelect={(v: VoiceOption) => setVoice({ id: v.voice_id, name: v.name })}
              />
            </div>
          )}

          {/* STEP 3 — Record */}
          {step === 3 && character && (
            <div className="space-y-5">
              <h2 className="font-display text-lg">Final check</h2>
              <div className="flex gap-4">
                <span className="block h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={character.image_url} alt={character.name} className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="font-display text-lg">{character.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="synth">{voice?.name ?? "no voice"}</Badge>
                    {title && <Badge tone="neutral">{title}</Badge>}
                  </div>
                </div>
              </div>
              <Field label="Script">
                <div className="max-h-44 overflow-y-auto rounded-xl border border-line bg-ink/60 p-3.5 text-sm leading-relaxed text-muted">
                  {script}
                </div>
              </Field>
              <p className="font-mono text-xs text-faint">
                Rolling starts a HeyGen Avatar IV render (billed per minute). It runs in the
                background — you can watch progress on the next screen.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          {/* Footer nav */}
          <div className="flex items-center justify-between border-t border-line pt-5">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || submitting}
            >
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Continue
              </Button>
            ) : (
              <Button onClick={roll} disabled={submitting || !voice}>
                {submitting ? <Spinner /> : "● Roll camera"}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
