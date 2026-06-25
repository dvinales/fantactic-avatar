import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/** Exchange the shared-secret password for the access cookie used by middleware. */
export async function POST(req: NextRequest) {
  const secret = process.env.APP_ACCESS_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Access gate not configured. Set APP_ACCESS_SECRET." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { password?: string };
  if (body.password !== secret) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("app_access", secret, {
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
