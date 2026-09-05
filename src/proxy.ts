import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/invitations/accept"];
// Routes a partner can still reach while their KYB verification is pending or rejected —
// they must be able to submit/see their documents, but nothing else in the app. API routes
// are always allowed through — they're not pages to redirect, and enforce their own auth.
const ALLOWED_WHILE_UNVERIFIED = ["/documents", "/api"];

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

async function isPartnerActive(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/partners/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return true; // fail open — real auth is still enforced by the API itself
    const partner = await response.json();
    return partner?.status === "active";
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("protegey_partner_access_token")?.value;
  const hasSession = Boolean(accessToken);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAllowedWhileUnverified = ALLOWED_WHILE_UNVERIFIED.some((path) => pathname.startsWith(path));
  if (hasSession && !isPublicPath && !isAllowedWhileUnverified) {
    const active = await isPartnerActive(accessToken!);
    if (!active) {
      return NextResponse.redirect(new URL("/documents", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
