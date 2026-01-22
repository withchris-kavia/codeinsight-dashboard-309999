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

function pickAuthorizationUrl(payload: JsonRecord | null): string | null {
  if (!payload) return null;
  const candidates = [
    payload.authorization_url,
    payload.authorizationUrl,
    payload.auth_url,
    payload.authUrl,
    payload.url,
  ];
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
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error(
      "Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL."
    );
  }

  const url = new URL(`${base}/auth/${provider}/login`);
  if (returnTo) url.searchParams.set("return_to", returnTo);

  const res = await fetch(url.toString(), { method: "GET" });
  const payload = await safeReadJson(res);

  if (!res.ok) {
    const detail =
      (payload?.detail as string | undefined) ||
      (payload?.message as string | undefined) ||
      `Backend returned ${res.status}`;
    throw new Error(detail);
  }

  const authUrl = pickAuthorizationUrl(payload);
  if (!authUrl) {
    throw new Error("Backend did not return an authorization URL.");
  }
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
    throw new Error(
      "Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL."
    );
  }

  const url = new URL(`${base}/auth/${provider}/callback`);
  if (params.code) url.searchParams.set("code", params.code);
  if (params.state) url.searchParams.set("state", params.state);
  if (params.error) url.searchParams.set("error", params.error);
  if (params.error_description) url.searchParams.set("error_description", params.error_description);

  const res = await fetch(url.toString(), { method: "GET" });
  const payload = await safeReadJson(res);

  if (!res.ok) {
    const detail =
      (payload?.detail as string | undefined) ||
      (payload?.message as string | undefined) ||
      `Backend returned ${res.status}`;
    throw new Error(detail);
  }

  return payload ?? {};
}
