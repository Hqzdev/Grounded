export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function parseResponse(response: Response) {
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

export function resolveErrorMessage(payload: unknown, status: number) {
  if (isErrorPayload(payload)) {
    if (typeof payload.detail === "string") {
      return payload.detail;
    }

    if (isMessagePayload(payload.detail)) {
      return payload.detail.message;
    }

    if (Array.isArray(payload.detail)) {
      const message = payload.detail
        .map((item) => resolveValidationMessage(item))
        .filter(Boolean)
        .join(" ");

      if (message) {
        return message;
      }
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

function isMessagePayload(payload: unknown): payload is { message: string } {
  return typeof payload === "object"
    && payload !== null
    && "message" in payload
    && typeof (payload as { message?: unknown }).message === "string";
}

function resolveValidationMessage(item: unknown) {
  if (typeof item !== "object" || item === null || !("msg" in item)) {
    return "";
  }

  const message = (item as { msg?: unknown }).msg;
  return typeof message === "string" ? message : "";
}
