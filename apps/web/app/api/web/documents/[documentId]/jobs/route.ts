import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;

  return proxyPrivate({
    method: "GET",
    path: `/api/documents/${documentId}/jobs`,
    request
  });
}
