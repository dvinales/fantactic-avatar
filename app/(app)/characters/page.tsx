import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { CharacterGrid, type CharacterWithImage } from "@/components/character-grid";
import { listCharacters } from "@/lib/repo";
import { characterImageUrl } from "@/lib/views";

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  let characters: CharacterWithImage[] = [];
  let error: string | null = null;
  try {
    characters = (await listCharacters()).map((c) => ({ ...c, image_url: characterImageUrl(c) }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-key">Roster</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Talent</h1>
        </div>
        <Link href="/characters/new">
          <Button>New character</Button>
        </Link>
      </header>

      {error ? (
        <Card>
          <CardBody className="space-y-1">
            <p className="font-medium text-danger">Couldn&apos;t load talent.</p>
            <p className="text-sm text-muted">{error}</p>
          </CardBody>
        </Card>
      ) : (
        <CharacterGrid characters={characters} />
      )}
    </div>
  );
}
