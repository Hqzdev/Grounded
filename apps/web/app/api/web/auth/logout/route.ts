import { logoutThroughGateway } from "@/lib/server-gateway";

export async function POST() {
  return logoutThroughGateway();
}
