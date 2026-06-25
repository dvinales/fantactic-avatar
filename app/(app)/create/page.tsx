import { listCharacters } from "@/lib/repo";
import { characterImageUrl } from "@/lib/views";
import { NewShoot } from "@/components/new-shoot";
import type { CharacterWithImage } from "@/components/character-grid";

export const dynamic = "force-dynamic";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ character?: string }>;
}) {
  const { character } = await searchParams;
  let characters: CharacterWithImage[] = [];
  let error: string | null = null;
  try {
    characters = (await listCharacters()).map((c) => ({ ...c, image_url: characterImageUrl(c) }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <NewShoot characters={characters} initialCharacterId={character ?? null} loadError={error} />
  );
}
