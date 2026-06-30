import { NextResponse } from "next/server";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "@/lib/server-auth";
import { parseResponse, resolveErrorMessage } from "@/lib/http";

const gatewayUrl = process.env.GROUNDED_GATEWAY_URL ?? process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";

type ProxyOptions = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
};

export async function proxyPublic(options: ProxyOptions) {
  const response = await callGateway(options);
  const payload = await parseResponse(response);
  return NextResponse.json(payload, { status: response.status });
}

export async function proxyPrivate(options: ProxyOptions) {
  let accessToken = await getAccessToken();
  let refreshedSession = null;

  if (!accessToken) {
    refreshedSession = await refreshSession();

    if (!refreshedSession) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    accessToken = refreshedSession.access_token;
  }

  let response = await callGateway(options, accessToken);

  if (response.status === 401) {
    refreshedSession = await refreshSession();

    if (!refreshedSession) {
      const unauthorized = NextResponse.json({ message: "Authentication expired." }, { status: 401 });
      clearAuthCookies(unauthorized);
      return unauthorized;
    }

    response = await callGateway(options, refreshedSession.access_token);
  }

  const payload = await parseResponse(response);
  const nextResponse = NextResponse.json(payload, { status: response.status });

  if (refreshedSession) {
    setAuthCookies(nextResponse, refreshedSession);
  }

  return nextResponse;
}

export async function loginThroughGateway(body: unknown) {
  const response = await callGateway({ method: "POST", path: "/api/auth/login", body });
  const payload = await parseResponse(response);
  const nextResponse = NextResponse.json(sanitizeAuthPayload(payload), { status: response.status });

  if (response.ok && isAuthPayload(payload)) {
    setAuthCookies(nextResponse, payload);
  }

  return nextResponse;
}

export async function logoutThroughGateway() {
  const accessToken = await getAccessToken();

  if (accessToken) {
    await callGateway({ method: "POST", path: "/api/auth/logout" }, accessToken);
  }

  const response = NextResponse.json({ message: "Logged out." });
  clearAuthCookies(response);
  return response;
}

async function refreshSession() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await callGateway({
    method: "POST",
    path: "/api/auth/refresh",
    body: { refresh_token: refreshToken }
  });
  const payload = await parseResponse(response);

  if (!response.ok || !isAuthPayload(payload)) {
    return null;
  }

  return payload;
}

async function callGateway(options: ProxyOptions, accessToken?: string) {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${gatewayUrl}${options.path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });
}

function sanitizeAuthPayload(payload: unknown) {
  if (!isAuthPayload(payload)) {
    return payload;
  }

  const { access_token, refresh_token, ...safePayload } = payload;
  return safePayload;
}

function isAuthPayload(payload: unknown): payload is {
  access_token: string;
  refresh_token: string;
  [key: string]: unknown;
} {
  return typeof payload === "object"
    && payload !== null
    && "access_token" in payload
    && "refresh_token" in payload
    && typeof (payload as { access_token?: unknown }).access_token === "string"
    && typeof (payload as { refresh_token?: unknown }).refresh_token === "string";
}

export function gatewayError(status: number, payload: unknown) {
  return NextResponse.json({ message: resolveErrorMessage(payload, status) }, { status });
}
