import { NextRequest } from "next/server";
import { proxyPublic } from "@/lib/server-gateway";

export async function POST(request: NextRequest) {
  return proxyPublic({
    method: "POST",
    path: "/api/auth/email/verify",
    body: await request.json()
  });
}
