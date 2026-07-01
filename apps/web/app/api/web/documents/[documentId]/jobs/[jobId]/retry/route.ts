import { NextRequest } from "next/server";
import { proxyPrivate } from "@/lib/server-gateway";

type RouteContext = {
  params: Promise<{
    documentId: string;
    jobId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { documentId, jobId } = await context.params;

  return proxyPrivate({
    method: "POST",
    path: `/api/documents/${documentId}/jobs/${jobId}/retry`,
    request
  });
}
