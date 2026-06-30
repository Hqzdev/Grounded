import { proxyPrivate } from "@/lib/server-gateway";

export async function GET() {
  return proxyPrivate({
    method: "GET",
    path: "/api/auth/me"
  });
}
