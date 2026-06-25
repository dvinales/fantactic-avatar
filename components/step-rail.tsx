import { cn } from "@/lib/utils";

export const PIPELINE_STEPS = ["Character", "Script", "Voice", "Record"] as const;

/**
 * The signature element: a tally-light production rail. The active stage glows
 * amber (key light); completed stages read in mint; upcoming stages stay faint.
 */
export function StepRail({ active, className }: { active: number; className?: string }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-y-2", className)}>
      {PIPELINE_STEPS.map((label, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <li key={label} className="flex items-center">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition",
                current && "border-key/60 bg-key/10 text-key shadow-[0_0_22px_-6px_rgba(255,178,62,0.7)]",
                done && "border-ready/30 bg-ready/5 text-ready",
                !done && !current && "border-line text-faint",
              )}
            >
              <span aria-hidden className={cn(current && "tally")}>
                {done ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
              <span className="tracking-wide">{label}</span>
            </span>
            {i < PIPELINE_STEPS.length - 1 && (
              <span aria-hidden className={cn("mx-1.5 h-px w-5", done ? "bg-ready/40" : "bg-line")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
