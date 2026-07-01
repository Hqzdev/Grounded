import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { documentId } = await context.params;

  return proxyPrivate({
    method: "POST",
    path: `/api/documents/${documentId}/reindex`,
    request
  });
}
