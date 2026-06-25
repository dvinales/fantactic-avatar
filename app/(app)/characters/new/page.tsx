"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { StepRail } from "@/components/step-rail";
import { cn } from "@/lib/utils";

const RATIOS = [
  { label: "Portrait", value: "3:4" },
  { label: "Vertical", value: "9:16" },
  { label: "Square", value: "1:1" },
];

type Generated = { base64: string; mimeType: string; modelId: string };

export default function NewCharacterPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("3:4");
  const [name, setName] = useState("");
  const [image, setImage] = useState<Generated | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/characters/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: ratio }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Generation failed.");
      setImage({ base64: j.imageBase64, mimeType: j.mimeType, modelId: j.modelId });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!image || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: prompt,
          imageBase64: image.base64,
          mimeType: image.mimeType,
          imageModelId: image.modelId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Save failed.");
      router.push(`/create?character=${j.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-key">Casting</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Create a character</h1>
        <StepRail active={0} />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Direction */}
        <Card className="rise">
          <CardBody className="space-y-5">
            <Field label="Casting brief" hint="Describe the face">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A warm, mid-30s news anchor with short curly hair, navy blazer, soft studio key light, neutral grey backdrop, looking straight at camera."
                className="min-h-36"
              />
            </Field>

            <Field label="Framing">
              <div className="flex gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRatio(r.value)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-sm transition",
                      ratio === r.value
                        ? "border-key/60 bg-key/10 text-key"
                        : "border-line text-muted hover:text-fg",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>

            <Button onClick={generate} disabled={generating || !prompt.trim()} className="w-full">
              {generating ? <Spinner /> : image ? "Regenerate" : "Generate headshot"}
            </Button>

            {image && (
              <div className="space-y-4 border-t border-line pt-5">
                <Field label="Character name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mara Voss" />
                </Field>
                <Button onClick={save} disabled={saving || !name.trim()} variant="primary" className="w-full">
                  {saving ? <Spinner /> : "Save & continue to shoot"}
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
          </CardBody>
        </Card>

        {/* Headshot frame */}
        <div className="rise">
          <div className="overflow-hidden rounded-2xl border border-line bg-ink">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-faint">
              <span>HEADSHOT</span>
              <span>{image ? image.modelId : "awaiting render"}</span>
            </div>
            <div className="grid aspect-[3/4] place-items-center bg-[repeating-linear-gradient(45deg,transparent,transparent_12px,rgba(255,255,255,0.02)_12px,rgba(255,255,255,0.02)_24px)]">
              {generating ? (
                <div className="flex flex-col items-center gap-3 text-muted">
                  <Spinner className="h-6 w-6 text-key" />
                  <span className="font-mono text-xs">developing…</span>
                </div>
              ) : image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:${image.mimeType};base64,${image.base64}`}
                  alt="Generated character"
                  className="h-full w-full object-cover"
                />
              ) : (
                <p className="px-6 text-center font-mono text-xs text-faint">
                  Your character appears here once you generate.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
