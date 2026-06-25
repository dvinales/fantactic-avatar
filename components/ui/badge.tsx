import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "key" | "synth" | "ready" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-panel-hi text-muted",
  key: "border-key/30 bg-key/10 text-key",
  synth: "border-synth/30 bg-synth/10 text-synth",
  ready: "border-ready/30 bg-ready/10 text-ready",
  danger: "border-danger/30 bg-danger/10 text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
