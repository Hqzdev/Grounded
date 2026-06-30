import { AuthResponse, TenantSummary, UserSummary } from "@/lib/api";

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserSummary;
  tenant: TenantSummary | null;
};

const authStorageKey = "grounded.auth";

export function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(authStorageKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as StoredAuthSession;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeSession(session: AuthResponse) {
  const value: StoredAuthSession = {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    user: session.user,
    tenant: session.tenant
  };

  localStorage.setItem(authStorageKey, JSON.stringify(value));
  return value;
}

export function clearStoredSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(authStorageKey);
  }
}
