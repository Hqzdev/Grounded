import { NextRequest } from "next/server";
import { loginThroughGateway } from "@/lib/server-gateway";

export async function POST(request: NextRequest) {
  return loginThroughGateway(request, await request.json());
}
