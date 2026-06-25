import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listCharacters, listVideos } from "@/lib/repo";

export const dynamic = "force-dynamic";

const PIPELINE = [
  { n: "01", title: "Cast the face", body: "Describe a character and Nano Banana Pro renders a consistent headshot.", tag: "Nano Banana Pro" },
  { n: "02", title: "Write the lines", body: "Draft and tighten the script with Claude until it sounds spoken, not typed.", tag: "Claude" },
  { n: "03", title: "Find the voice", body: "Audition ElevenLabs voices and bind one to your character.", tag: "ElevenLabs" },
  { n: "04", title: "Roll camera", body: "HeyGen Avatar IV turns the photo + voice into a talking take.", tag: "HeyGen · Avatar IV" },
];

async function counts() {
  try {
    const [chars, vids] = await Promise.all([listCharacters(), listVideos()]);
    return { talent: chars.length, takes: vids.length, ok: true as const };
  } catch {
    return { talent: 0, takes: 0, ok: false as const };
  }
}

export default async function StudioPage() {
  const { talent, takes, ok } = await counts();

  return (
    <div className="space-y-14">
      <section className="rise space-y-7 pt-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-key">AI Avatar Studio</p>
        <h1 className="max-w-3xl font-display text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
          Cast synthetic talent.
          <br />
          <span className="text-muted">Then direct it on camera.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Generate a character, give it a voice, and shoot a talking-avatar video — the whole
          production line, one take at a time.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/create">
            <Button size="lg">Start a new shoot</Button>
          </Link>
          <Link href="/characters">
            <Button size="lg" variant="secondary">
              Browse talent
            </Button>
          </Link>
        </div>
        <div className="flex gap-8 pt-2 font-mono text-sm text-muted">
          <span>
            <span className="text-2xl font-semibold text-fg">{talent}</span> talent
          </span>
          <span>
            <span className="text-2xl font-semibold text-fg">{takes}</span> takes
          </span>
        </div>
        {!ok && (
          <p className="text-sm text-faint">
            Stats are blank until Supabase is connected — see the README to finish setup.
          </p>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-faint">The production line</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step) => (
            <Card key={step.n} className="rise">
              <CardBody className="flex h-full flex-col gap-3">
                <span className="font-mono text-2xl text-key/70">{step.n}</span>
                <h3 className="font-display text-lg">{step.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-muted">{step.body}</p>
                <Badge tone="synth" className="self-start">
                  {step.tag}
                </Badge>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
