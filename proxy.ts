import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight access gate (NOT full auth — v1 is single-user).
 * Next 16 "proxy" convention (formerly middleware); runs on the Node runtime.
 *
 * The app uses platform-funded API keys behind a public URL, so an open URL =
 * an open wallet. This gate requires a shared-secret cookie before any page or
 * API route is reachable. Pair it with Vercel deployment password protection
 * for defence in depth.
 *
 * - No APP_ACCESS_SECRET set + dev  -> gate disabled (local convenience).
 * - No APP_ACCESS_SECRET set + prod -> fail CLOSED (forces you to set it).
 */
const PUBLIC_PATHS = ["/login", "/api/auth"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const secret = process.env.APP_ACCESS_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return denied(req); // fail closed in production
  }

  const cookie = req.cookies.get("app_access")?.value;
  if (cookie && cookie === secret) return NextResponse.next();

  return denied(req);
}

function denied(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
