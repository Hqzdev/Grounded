import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, refreshCookieName } from "@/lib/auth-cookies";

const accessTokenMaxAge = 15 * 60;
const refreshTokenMaxAge = 14 * 24 * 60 * 60;

export type GatewayAuthResponse = {
  access_token: string;
  refresh_token: string;
};

export async function getAccessToken() {
  return (await cookies()).get(accessCookieName)?.value ?? null;
}

export async function getRefreshToken() {
  return (await cookies()).get(refreshCookieName)?.value ?? null;
}

export function setAuthCookies(response: NextResponse, session: GatewayAuthResponse) {
  response.cookies.set(accessCookieName, session.access_token, cookieOptions(accessTokenMaxAge));
  response.cookies.set(refreshCookieName, session.refresh_token, cookieOptions(refreshTokenMaxAge));
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(accessCookieName, "", expiredCookieOptions());
  response.cookies.set(refreshCookieName, "", expiredCookieOptions());
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge
  };
}

function expiredCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };
}
