import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

export async function GET(request: NextRequest) {
  return proxyPrivate({
    method: "GET",
    path: "/api/providers/status",
    request
  });
}
