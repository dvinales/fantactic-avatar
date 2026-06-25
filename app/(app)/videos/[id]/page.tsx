import { notFound } from "next/navigation";
import { getCharacter, getVideo } from "@/lib/repo";
import { characterImageUrl, serializeVideo } from "@/lib/views";
import { TakeViewer } from "@/components/take-viewer";

export const dynamic = "force-dynamic";

export default async function TakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const character = await getCharacter(video.character_id);
  const charView = character
    ? { name: character.name, image_url: characterImageUrl(character) }
    : null;

  return <TakeViewer initial={serializeVideo(video)} character={charView} />;
}
