const STORAGE_KEY = "codeinsight.org_id";

// PUBLIC_INTERFACE
export function getOrgId(): string {
  /** Returns the currently selected org_id (UUID) from localStorage (client-side only). */
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

// PUBLIC_INTERFACE
export function setOrgId(orgId: string): void {
  /** Persists org_id (UUID) in localStorage for reuse across dashboard + repo views. */
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, orgId);
}

// PUBLIC_INTERFACE
export function clearOrgId(): void {
  /** Clears stored org_id (useful for troubleshooting / switching orgs). */
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
