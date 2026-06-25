import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-line bg-ink/60 px-3.5 py-2.5 text-fg placeholder:text-faint " +
  "transition focus:outline-none focus:border-key/60 focus:ring-2 focus:ring-key/25";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-28 resize-y leading-relaxed", className)} {...props} />;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">{label}</span>
        {hint ? <span className="text-xs text-faint">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
