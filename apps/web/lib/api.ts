const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080";

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

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
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
  tenant_id: string;
  question: string;
};

export type DocumentRequest = {
  tenant_id: string;
  filename: string;
  content_type: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getGatewayHealth() {
  return request("/api/health", { method: "GET" });
}

export async function register(payload: RegisterRequest) {
  return request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: payload
  });
}

export async function login(payload: LoginRequest) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: payload
  });
}

export async function verifyEmail(token: string) {
  return request("/api/auth/email/verify", {
    method: "POST",
    body: { token }
  });
}

export async function refresh(refreshToken: string) {
  return request<AuthResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken }
  });
}

export async function logout(accessToken: string) {
  return request("/api/auth/logout", {
    method: "POST",
    accessToken
  });
}

export async function askQuestion(payload: QuestionRequest, accessToken?: string) {
  return request("/api/questions", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export async function queueDocument(payload: DocumentRequest, accessToken?: string) {
  return request("/api/documents", {
    method: "POST",
    body: payload,
    accessToken
  });
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const headers = new Headers();

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  const response = await fetch(`${gatewayUrl}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, resolveErrorMessage(payload, response.status));
  }

  return payload as T;
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function resolveErrorMessage(payload: unknown, status: number) {
  if (isErrorPayload(payload)) {
    if (typeof payload.detail === "string") {
      return payload.detail;
    }

    if (Array.isArray(payload.detail)) {
      return payload.detail
        .map((item) => resolveValidationMessage(item))
        .filter(Boolean)
        .join(" ");
    }

    if (typeof payload.message === "string") {
      return payload.message;
    }
  }

  return `Request failed with status ${status}`;
}

function isErrorPayload(payload: unknown): payload is { detail?: unknown; message?: unknown } {
  return typeof payload === "object" && payload !== null;
}

function resolveValidationMessage(item: unknown) {
  if (typeof item !== "object" || item === null || !("msg" in item)) {
    return "";
  }

  const message = (item as { msg?: unknown }).msg;
  return typeof message === "string" ? message : "";
}

type RequestOptions = {
  method: "GET" | "POST" | "DELETE";
  body?: unknown;
  accessToken?: string;
};
