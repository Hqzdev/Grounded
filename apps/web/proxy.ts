import { NextRequest, NextResponse } from "next/server";
import { accessCookieName, refreshCookieName } from "@/lib/auth-cookies";

export function proxy(request: NextRequest) {
  const hasAccessToken = request.cookies.has(accessCookieName);
  const hasRefreshToken = request.cookies.has(refreshCookieName);

  if (!hasAccessToken && !hasRefreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"]
};
