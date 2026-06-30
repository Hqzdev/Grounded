import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

export async function GET() {
  return proxyPrivate({
    method: "GET",
    path: "/api/documents"
  });
}

export async function POST(request: NextRequest) {
  return proxyPrivate({
    method: "POST",
    path: "/api/documents",
    body: await request.json()
  });
}
