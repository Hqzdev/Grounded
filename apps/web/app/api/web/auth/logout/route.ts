import { NextRequest } from "next/server";
import { logoutThroughGateway } from "@/lib/server-gateway";

export async function POST(request: NextRequest) {
  return logoutThroughGateway(request);
}
