import { ApiError, parseResponse, resolveErrorMessage } from "@/lib/http";

export { ApiError };

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  role: string;
};

export type UserSummary = {
  id: string;
  email: string;
  name: string;
  email_verified: boolean;
};

export type AuthSessionResponse = {
  token_type: string;
  expires_in: number;
  user: UserSummary;
  tenant: TenantSummary | null;
};

export type RegisterResponse = {
  user: UserSummary;
  tenant: TenantSummary;
  email_verification_required: boolean;
  dev_verification_token: string | null;
};

export type RegisterRequest = {
  email: string;
  password: string;
  name: string;
  tenant_name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_label?: string;
};

export type QuestionRequest = {
  question: string;
};

export type DocumentRequest = {
  filename: string;
  title?: string;
  content_type: string;
  content: string;
};

export type MeResponse = {
  user: UserSummary;
  tenants: TenantSummary[];
  current_tenant: TenantSummary | null;
};

export type DocumentSummary = {
  id: string;
  tenant_id: string;
  title: string;
  filename: string;
  content_type: string;
  status: string;
  current_version: number;
  created_at: string;
  updated_at: string;
};

export type CitationResponse = {
  document_id: string;
  document_title: string;
  chunk_id: string;
  snippet: string;
  score: number;
  source_start: number | null;
  source_end: number | null;
};

export type AnswerResponse = {
  session_id: string;
  user_message_id: string;
  assistant_message_id: string;
  answer: string;
  citations: CitationResponse[];
  created_at: string;
};

export async function register(payload: RegisterRequest) {
  return request<RegisterResponse>("/api/web/auth/register", {
    method: "POST",
    body: payload
  });
}

export async function login(payload: LoginRequest) {
  return request<AuthSessionResponse>("/api/web/auth/login", {
    method: "POST",
    body: payload
  });
}

export async function verifyEmail(token: string) {
  return request("/api/web/auth/email/verify", {
    method: "POST",
    body: { token }
  });
}

export async function logout() {
  return request("/api/web/auth/logout", {
    method: "POST"
  });
}

export async function getMe() {
  return request<MeResponse>("/api/web/auth/me", {
    method: "GET"
  });
}

export async function listDocuments() {
  return request<DocumentSummary[]>("/api/web/documents", {
    method: "GET"
  });
}

export async function askQuestion(payload: QuestionRequest) {
  return request<AnswerResponse>("/api/web/questions", {
    method: "POST",
    body: payload
  });
}

export async function queueDocument(payload: DocumentRequest) {
  return request("/api/web/documents", {
    method: "POST",
    body: payload
  });
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(path, {
    method: options.method,
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    credentials: "same-origin"
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, resolveErrorMessage(payload, response.status));
  }

  return payload as T;
}

type RequestOptions = {
  method: "GET" | "POST" | "DELETE";
  body?: unknown;
};
