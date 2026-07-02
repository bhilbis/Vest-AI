import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Prefix publik (semua sub-path ikut publik)
const PUBLIC_PREFIXES = ["/login", "/register", "/kebijakan-privasi", "/syarat-ketentuan"];
// Path publik exact-match (landing & file metadata)
const PUBLIC_EXACT = ["/", "/sitemap.xml", "/manifest.webmanifest", "/robots.txt"];

// Cookie penanda guest mode (di-set oleh guest-store; datanya sendiri di localStorage)
const GUEST_COOKIE = "vest-ai-guest";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPublic) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // Guest mode boleh mengakses halaman app (bukan /admin); datanya lokal di browser
    const isGuest = req.cookies.get(GUEST_COOKIE)?.value === "1";
    if (isGuest && !pathname.startsWith("/admin")) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Block deactivated/blocked users
  if (token.isActive === false || (token as { isBlocked?: boolean }).isBlocked === true) {
    return NextResponse.redirect(new URL("/login?error=AccountDisabled", req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/financial-overview", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // /api dikecualikan: route API menangani auth-nya sendiri (session/CRON_SECRET)
  // dan redirect HTML ke /login merusak cron, push, dan konsumen JSON.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|vest.png|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)",
  ],
};
