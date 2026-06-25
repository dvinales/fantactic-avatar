"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setError(j.error ?? "Could not sign in.");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <Card className="w-full max-w-sm rise">
        <CardBody className="space-y-6 p-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full bg-danger shadow-[0_0_12px_2px_rgba(255,107,107,0.7)]"
            />
            <span className="font-display text-xl font-bold tracking-tight">Soundstage</span>
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-lg">Restricted set</h1>
            <p className="text-sm text-muted">
              This studio runs on metered API keys. Enter the stage pass to continue.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Stage pass">
              <Input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? <Spinner /> : "Enter the studio"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
