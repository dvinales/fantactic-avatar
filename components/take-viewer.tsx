"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import type { Video } from "@/lib/types";

type SerializedVideo = Video & { video_url: string | null };
type Char = { name: string; image_url: string } | null;

export function TakeViewer({ initial, character }: { initial: SerializedVideo; character: Char }) {
  const [video, setVideo] = useState<SerializedVideo>(initial);
  const live = video.status === "processing" || video.status === "pending";

  useEffect(() => {
    if (!live) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${video.id}`);
        if (!res.ok) return;
        const j = (await res.json()) as SerializedVideo;
        setVideo(j);
      } catch {
        /* transient — keep polling */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [video.id, live]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-key">Take</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {video.title || "Untitled take"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {character && <Badge tone="synth">{character.name}</Badge>}
          <StatusBadge status={video.status} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Stage / player */}
        <Card className="rise overflow-hidden">
          <div className="grid aspect-[9/16] max-h-[70vh] place-items-center bg-ink sm:aspect-video">
            {video.status === "completed" && video.video_url ? (
              <video
                controls
                playsInline
                poster={character?.image_url}
                src={video.video_url}
                className="h-full w-full bg-black object-contain"
              />
            ) : video.status === "failed" ? (
              <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
                <span className="text-2xl">⚠</span>
                <p className="font-display text-lg text-danger">Render failed</p>
                <p className="text-sm text-muted">{video.error ?? "Something went wrong."}</p>
                <Link href="/create">
                  <Button variant="secondary">Try another take</Button>
                </Link>
              </div>
            ) : (
              <div className="relative h-full w-full">
                {character && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={character.image_url}
                    alt={character.name}
                    className="h-full w-full object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="flex items-center gap-2 rounded-full border border-key/40 bg-ink/70 px-4 py-1.5 backdrop-blur">
                    <span aria-hidden className="tally h-2 w-2 rounded-full bg-danger" />
                    <span className="font-mono text-xs uppercase tracking-widest text-key">Rolling</span>
                  </span>
                  <p className="text-sm text-muted">Rendering with HeyGen — usually a few minutes.</p>
                  <Spinner className="text-key" />
                </div>
              </div>
            )}
          </div>
          {video.status === "completed" && video.video_url && (
            <div className="flex items-center justify-between gap-3 border-t border-line p-4">
              <span className="font-mono text-xs text-faint">MP4 · stored in your library</span>
              <a href={video.video_url} target="_blank" rel="noreferrer">
                <Button size="sm">Open / download</Button>
              </a>
            </div>
          )}
        </Card>

        {/* Script */}
        <Card className="rise">
          <CardBody className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-muted">Script</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg/90">{video.script}</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
