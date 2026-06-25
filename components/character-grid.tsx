"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Character } from "@/lib/types";

export type CharacterWithImage = Character & { image_url: string };

export function CharacterGrid({ characters }: { characters: CharacterWithImage[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this character? Their takes will be removed too.")) return;
    setDeleting(id);
    await fetch(`/api/characters/${id}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  if (characters.length === 0) {
    return (
      <Card className="rise">
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="font-display text-xl">No talent on the roster yet</p>
          <p className="max-w-sm text-sm text-muted">
            Generate your first AI character — a face you can reuse across every shoot.
          </p>
          <Link href="/characters/new">
            <Button>Create a character</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {characters.map((c) => (
        <Card key={c.id} className="group rise overflow-hidden">
          <div className="relative aspect-[3/4] overflow-hidden bg-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.image_url}
              alt={c.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <button
              onClick={() => remove(c.id)}
              disabled={deleting === c.id}
              aria-label="Delete character"
              className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-muted opacity-0 backdrop-blur transition hover:text-danger group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="truncate font-display text-base">{c.name}</p>
              {c.voice_name ? (
                <Badge tone="synth" className="mt-1.5">
                  {c.voice_name}
                </Badge>
              ) : (
                <Badge tone="neutral" className="mt-1.5">
                  No voice yet
                </Badge>
              )}
            </div>
            <Link href={`/create?character=${c.id}`}>
              <Button size="sm" variant="secondary">
                Shoot
              </Button>
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
