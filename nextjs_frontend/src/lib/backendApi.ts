import type { OAuthProvider } from "@/lib/oauthProviders";

type JsonRecord = Record<string, unknown>;

function normalizeBaseUrl(value: string | undefined | null): string {
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export function getBackendBaseUrl(): string {
  /**
   * Returns the backend base URL from environment variables.
   *
   * IMPORTANT: Do not hardcode secrets here. This only reads NEXT_PUBLIC_* variables,
   * as required.
   *
   * Preference order:
   * - NEXT_PUBLIC_API_BASE
   * - NEXT_PUBLIC_BACKEND_URL
   */
  const apiBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE);
  const backendUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
  return apiBase || backendUrl || "";
}

async function safeReadJson(res: Response): Promise<JsonRecord | null> {
  try {
    return (await res.json()) as JsonRecord;
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: JsonRecord | null, res: Response): string {
  // FastAPI may return: { detail: string | object }, or { message: string }
  const detail = payload?.detail;
  if (typeof detail === "string" && detail.length > 0) return detail;
  if (typeof payload?.message === "string" && payload.message.length > 0) return payload.message;

  // Sometimes detail is an object like { error: ..., message: ... }
  if (detail && typeof detail === "object") {
    const maybe = (detail as JsonRecord).message;
    if (typeof maybe === "string" && maybe.length > 0) return maybe;
  }

  return `Backend returned ${res.status}`;
}

async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL.");
  }

  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === "string" && v.length > 0) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), { method: "GET" });
  const payload = await safeReadJson(res);

  if (!res.ok) throw new Error(extractErrorMessage(payload, res));
  return (payload ?? (await res.json())) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL.");
  }

  const url = new URL(`${base}${path}`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await safeReadJson(res);
  if (!res.ok) throw new Error(extractErrorMessage(payload, res));
  return (payload ?? (await res.json())) as T;
}

function pickAuthorizationUrl(payload: JsonRecord | null): string | null {
  if (!payload) return null;
  const candidates = [payload.authorization_url, payload.authorizationUrl, payload.auth_url, payload.authUrl, payload.url];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return null;
}

// PUBLIC_INTERFACE
export async function startOAuthLogin(provider: OAuthProvider, returnTo?: string): Promise<string> {
  /**
   * Calls backend GET /auth/{provider}/login to obtain the provider authorization URL.
   *
   * Returns the authorization URL (string) that the browser should be redirected to.
   *
   * If the backend is unavailable or provider env keys are missing, this will throw with a
   * user-presentable message. The UI uses this to show "not connected" and surface errors.
   */
  const url = `/auth/${provider}/login`;
  const payload = await apiGet<JsonRecord>(url, returnTo ? { return_to: returnTo } : undefined);
  const authUrl = pickAuthorizationUrl(payload);
  if (!authUrl) throw new Error("Backend did not return an authorization URL.");
  return authUrl;
}

// PUBLIC_INTERFACE
export async function completeOAuthCallback(
  provider: OAuthProvider,
  params: { code?: string | null; state?: string | null; error?: string | null; error_description?: string | null }
): Promise<JsonRecord> {
  /**
   * Completes OAuth callback by calling backend GET /auth/{provider}/callback with the given query params.
   *
   * Note: Depending on how providers are configured, the OAuth redirect URI might be the backend callback.
   * This route enables a frontend callback page as well, which can proxy the callback to the backend.
   */
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL.");
  }

  const url = new URL(`${base}/auth/${provider}/callback`);
  if (params.code) url.searchParams.set("code", params.code);
  if (params.state) url.searchParams.set("state", params.state);
  if (params.error) url.searchParams.set("error", params.error);
  if (params.error_description) url.searchParams.set("error_description", params.error_description);

  const res = await fetch(url.toString(), { method: "GET" });
  const payload = await safeReadJson(res);

  if (!res.ok) throw new Error(extractErrorMessage(payload, res));
  return payload ?? {};
}

export type NotificationProvider = "slack" | "email";

export type NotificationConfig = {
  id: string;
  provider: NotificationProvider;
  enabled: boolean;
  org_id: string | null;
  user_id: string | null;
  slack_webhook_url: string | null;
  email_address: string | null;
  last_dispatch_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationDispatchResult = {
  config_id: string;
  provider: NotificationProvider;
  dispatched: boolean;
  reason?: string | null;
  error?: string | null;
};

export type NotificationDispatchResponse = {
  dispatched_any: boolean;
  results: NotificationDispatchResult[];
};

// PUBLIC_INTERFACE
export async function listNotificationConfigs(params: {
  org_id?: string;
  user_id?: string;
}): Promise<NotificationConfig[]> {
  /** Calls GET /notifications/configs to list notification configurations for an org_id and/or user_id scope. */
  return apiGet<NotificationConfig[]>("/notifications/configs", params);
}

// PUBLIC_INTERFACE
export async function upsertNotificationConfig(body: {
  provider: NotificationProvider;
  enabled: boolean;
  org_id?: string;
  user_id?: string;
  slack_webhook_url?: string | null;
  email_address?: string | null;
}): Promise<NotificationConfig> {
  /** Calls POST /notifications/configs to create or update a notification configuration row. */
  return apiPost<NotificationConfig>("/notifications/configs", body);
}

// PUBLIC_INTERFACE
export async function sendTestNotification(body: {
  org_id?: string;
  user_id?: string;
  message?: string;
}): Promise<NotificationDispatchResponse> {
  /** Calls POST /notifications/test to dispatch a test message to enabled configs for the given scope. */
  return apiPost<NotificationDispatchResponse>("/notifications/test", body);
}

// PUBLIC_INTERFACE
export async function dispatchNotification(body: {
  org_id?: string;
  user_id?: string;
  message: string;
  subject?: string;
  metadata?: Record<string, unknown>;
}): Promise<NotificationDispatchResponse> {
  /** Calls POST /notifications/dispatch to dispatch a message to enabled configs for the given scope. */
  return apiPost<NotificationDispatchResponse>("/notifications/dispatch", body);
}
