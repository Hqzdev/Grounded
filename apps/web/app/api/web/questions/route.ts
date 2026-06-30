import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

export async function POST(request: NextRequest) {
  return proxyPrivate({
    method: "POST",
    path: "/api/questions",
    request,
    body: await request.json()
  });
}
