"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { VoiceOption } from "@/lib/types";

export function VoicePicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null;
  onSelect: (v: VoiceOption) => void;
}) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function fetchVoices(q?: string): Promise<VoiceOption[]> {
    const res = await fetch(`/api/voices${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Failed to load voices.");
    return j as VoiceOption[];
  }

  async function load(q?: string) {
    setLoading(true);
    setError(null);
    try {
      setVoices(await fetchVoices(q));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Initial load: setState only fires after the async boundary (not synchronously
  // in the effect body), so it can't cascade renders.
  useEffect(() => {
    let active = true;
    fetchVoices()
      .then((v) => active && setVoices(v))
      .catch((e) => active && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => active && setLoading(false));
    const audio = audioRef;
    return () => {
      active = false;
      audio.current?.pause();
    };
  }, []);

  function preview(v: VoiceOption) {
    if (!v.preview_url) return;
    if (playing === v.voice_id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = v.preview_url;
    audioRef.current.onended = () => setPlaying(null);
    void audioRef.current.play();
    setPlaying(v.voice_id);
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search voices — try “narration”, “british”, “warm”…"
        />
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-muted">
            <Spinner /> <span className="text-sm">Loading voices…</span>
          </div>
        ) : voices.length === 0 ? (
          <p className="py-6 text-sm text-faint">No voices found.</p>
        ) : (
          voices.map((v) => {
            const selected = selectedId === v.voice_id;
            return (
              <button
                key={v.voice_id}
                type="button"
                onClick={() => onSelect(v)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  selected ? "border-synth/60 bg-synth/10" : "border-line hover:border-faint",
                )}
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    preview(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      preview(v);
                    }
                  }}
                  aria-label={playing === v.voice_id ? "Pause preview" : "Play preview"}
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition",
                    v.preview_url
                      ? "border-line text-fg hover:border-synth hover:text-synth"
                      : "border-line text-faint",
                  )}
                >
                  {playing === v.voice_id ? "⏸" : "▶"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{v.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(v.labels)
                      .slice(0, 3)
                      .map(([k, val]) => (
                        <Badge key={k} tone="neutral">
                          {val}
                        </Badge>
                      ))}
                  </span>
                </span>
                {selected && <span className="font-mono text-xs text-synth">selected</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
