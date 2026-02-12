import { NextRequest, NextResponse } from "next/server";

const exactPublicPaths = new Set(["/", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"]);
const prefixPublicPaths = ["/api/auth"];

function isPublicPath(pathname: string): boolean {
  if (exactPublicPaths.has(pathname)) return true;
  return prefixPublicPaths.some((prefix) => pathname.startsWith(prefix + "/") || pathname === prefix);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
