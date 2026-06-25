import { NextResponse, type NextRequest } from "next/server";
import { accessToken, safeEqual } from "@/lib/gate";

export const runtime = "nodejs";

/** Exchange the shared-secret password for the access cookie used by the proxy gate. */
export async function POST(req: NextRequest) {
  const secret = process.env.APP_ACCESS_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Access gate not configured. Set APP_ACCESS_SECRET." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (!safeEqual(body.password ?? "", secret)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  // Cookie holds a derived token, never the raw secret.
  const res = NextResponse.json({ ok: true });
  res.cookies.set("app_access", accessToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

/** Sign out: clear the cookie. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("app_access", "", { path: "/", maxAge: 0 });
  return res;
}
