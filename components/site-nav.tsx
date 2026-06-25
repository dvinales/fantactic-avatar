"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Studio" },
  { href: "/characters", label: "Talent" },
  { href: "/create", label: "New shoot" },
  { href: "/videos", label: "Takes" },
];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-danger shadow-[0_0_12px_2px_rgba(255,107,107,0.7)]" />
          <span className="font-display text-lg font-bold tracking-tight">Soundstage</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition",
                  active ? "bg-panel-hi text-fg" : "text-muted hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={signOut}
          className="ml-auto rounded-lg px-3 py-1.5 text-sm text-faint transition hover:text-fg"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
