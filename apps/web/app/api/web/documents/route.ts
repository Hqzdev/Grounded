import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

export async function GET(request: NextRequest) {
  return proxyPrivate({
    method: "GET",
    path: "/api/documents",
    request
  });
}

export async function POST(request: NextRequest) {
  return proxyPrivate({
    method: "POST",
    path: "/api/documents",
    request,
    body: await request.json()
  });
}
