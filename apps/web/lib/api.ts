const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";

export type QuestionRequest = {
  tenant_id: string;
  question: string;
};

export type DocumentRequest = {
  tenant_id: string;
  filename: string;
  content_type: string;
};

export async function getGatewayHealth() {
  const response = await fetch(`${gatewayUrl}/health`, { cache: "no-store" });
  return response.json();
}

export async function askQuestion(payload: QuestionRequest) {
  const response = await fetch(`${gatewayUrl}/api/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}

export async function queueDocument(payload: DocumentRequest) {
  const response = await fetch(`${gatewayUrl}/api/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return response.json();
}
