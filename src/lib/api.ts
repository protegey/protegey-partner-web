import "server-only";
import { getAccessToken } from "./session";
import { getLang } from "./i18n/lang";
import { t } from "./i18n/strings";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * PermissionsGuard on the backend throws the same generic "Insufficient permissions" message for
 * every role/permission check across the whole API — replaced here, in one place, with a clear,
 * translated, actionable message so every action file gets it automatically. A 403 thrown for a
 * different reason (e.g. "This account is not associated with a partner organization") already
 * carries its own specific message and is left untouched.
 */
async function resolveErrorMessage(status: number, backendMessage: string): Promise<string> {
  if (status === 403 && backendMessage === "Insufficient permissions") {
    const lang = await getLang();
    return t(lang, "commonForbiddenError");
  }
  return backendMessage;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
    const rawMessage = (data && (data.message as string)) || response.statusText;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage;
    throw new ApiError(response.status, await resolveErrorMessage(response.status, message));
  }

  return data as T;
}

/**
 * A 401 means the access token expired mid-request (middleware's silent refresh already
 * failed too, or this is a Server Action it couldn't redirect around). Actions that are
 * called directly from a client component (not via useActionState/<form action>) should use
 * this instead of apiFetch and return its result up to the caller: Next.js strips a thrown
 * error's custom properties (like ApiError.status) when it crosses the server->client
 * boundary in production, so catching `error.status === 401` client-side would silently
 * never work — this catches it server-side, where `.status` is still real, and hands back a
 * plain serializable marker the client can safely check with `"authExpired" in result`.
 */
export type AuthExpired = { authExpired: true };

export async function apiFetchGuarded<T>(path: string, options?: RequestOptions): Promise<T | AuthExpired> {
  try {
    return await apiFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    throw error;
  }
}

export async function apiUploadGuarded<T>(
  path: string,
  formData: FormData,
  options?: { unauthenticated?: boolean },
): Promise<T | AuthExpired> {
  try {
    return await apiUpload<T>(path, formData, options);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    throw error;
  }
}

/** For multipart/form-data uploads — the caller builds the FormData (e.g. with a File). */
export async function apiUpload<T>(path: string, formData: FormData, options: { unauthenticated?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (!options.unauthenticated) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage = (data && (data.message as string)) || response.statusText;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage;
    throw new ApiError(response.status, await resolveErrorMessage(response.status, message));
  }

  return data as T;
}
