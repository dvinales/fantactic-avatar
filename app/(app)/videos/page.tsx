import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { listCharacters, listVideos } from "@/lib/repo";
import { characterImageUrl } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  let videos: Awaited<ReturnType<typeof listVideos>> = [];
  let charMap = new Map<string, { name: string; image_url: string }>();
  let error: string | null = null;
  try {
    const [v, chars] = await Promise.all([listVideos(), listCharacters()]);
    videos = v;
    charMap = new Map(chars.map((c) => [c.id, { name: c.name, image_url: characterImageUrl(c) }]));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-key">Dailies</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Takes</h1>
        </div>
        <Link href="/create">
          <Button>New shoot</Button>
        </Link>
      </header>

      {error ? (
        <Card>
          <CardBody>
            <p className="font-medium text-danger">Couldn&apos;t load takes.</p>
            <p className="text-sm text-muted">{error}</p>
          </CardBody>
        </Card>
      ) : videos.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="font-display text-xl">No takes yet</p>
            <p className="max-w-sm text-sm text-muted">Direct your first shoot to see it here.</p>
            <Link href="/create">
              <Button>Start a shoot</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {videos.map((v) => {
            const c = charMap.get(v.character_id);
            return (
              <Link key={v.id} href={`/videos/${v.id}`}>
                <Card className="rise transition hover:border-faint">
                  <div className="flex items-center gap-4 p-3.5">
                    <span className="block h-14 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
                      {c && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{v.title || "Untitled take"}</p>
                      <p className="truncate text-sm text-muted">{c?.name ?? "Unknown talent"}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
