import "server-only";
import { getAccessToken } from "./session";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Skip attaching the session's access token (e.g. for /auth/login itself). */
  unauthenticated?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (!options.unauthenticated) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data && (data.message as string)) || response.statusText;
    throw new ApiError(response.status, Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}
