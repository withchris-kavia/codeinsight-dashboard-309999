import type { OAuthProvider } from "@/lib/oauthProviders";

type StoredConnection = {
  connected: boolean;
  connectedAt?: string;
  lastError?: string;
};

const keyFor = (provider: OAuthProvider) => `codeinsight.oauth.${provider}`;

// PUBLIC_INTERFACE
export function readProviderConnection(provider: OAuthProvider): StoredConnection {
  /**
   * Reads local connection status for a provider.
   *
   * This app currently has no backend "status" endpoint in the OpenAPI spec.
   * We persist connection info client-side on successful callback so the UI can show status.
   */
  if (typeof window === "undefined") return { connected: false };
  try {
    const raw = window.localStorage.getItem(keyFor(provider));
    if (!raw) return { connected: false };
    const parsed = JSON.parse(raw) as StoredConnection;
    return {
      connected: Boolean(parsed.connected),
      connectedAt: typeof parsed.connectedAt === "string" ? parsed.connectedAt : undefined,
      lastError: typeof parsed.lastError === "string" ? parsed.lastError : undefined,
    };
  } catch {
    return { connected: false };
  }
}

// PUBLIC_INTERFACE
export function markProviderConnected(provider: OAuthProvider): void {
  /** Persists provider connected status locally for UI rendering. */
  if (typeof window === "undefined") return;
  const payload: StoredConnection = { connected: true, connectedAt: new Date().toISOString() };
  window.localStorage.setItem(keyFor(provider), JSON.stringify(payload));
}

// PUBLIC_INTERFACE
export function markProviderError(provider: OAuthProvider, message: string): void {
  /** Persists a provider error locally to help the user understand why it isn't connected. */
  if (typeof window === "undefined") return;
  const payload: StoredConnection = {
    connected: false,
    connectedAt: undefined,
    lastError: message,
  };
  window.localStorage.setItem(keyFor(provider), JSON.stringify(payload));
}

// PUBLIC_INTERFACE
export function clearProviderConnection(provider: OAuthProvider): void {
  /** Clears stored provider connection state (useful for manual reset/testing). */
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(provider));
}
