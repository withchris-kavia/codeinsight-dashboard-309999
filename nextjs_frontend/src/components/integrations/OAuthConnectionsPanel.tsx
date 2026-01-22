"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/oauthProviders";
import {
  getBackendBaseUrl,
  getProviderBackendCallbackUrl,
  getProviderFrontendCallbackUrl,
  startOAuthLogin,
} from "@/lib/backendApi";
import { readProviderConnection } from "@/lib/oauthConnectionState";

type ProviderUiState = {
  connected: boolean;
  connectedAt?: string;
  lastError?: string;
  busy: boolean;
};

function Pill({ color, children }: { color: "green" | "slate" | "red"; children: React.ReactNode }) {
  const cls =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : color === "red"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  const common = "h-4 w-4";
  switch (provider) {
    case "github":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden="true">
          <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.5-1.4-1.9-1.4-1.9-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.9 3 1.3 3.7 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.2 11.2 0 0 1 6 0C17.4 5.2 18.4 5.5 18.4 5.5c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
        </svg>
      );
    case "gitlab":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden="true">
          <path d="M22.2 13.2 12 23 1.8 13.2a1.1 1.1 0 0 1-.3-1.1l1.3-4.1 2.6-8a.8.8 0 0 1 1.5 0l2.6 8h5l2.6-8a.8.8 0 0 1 1.5 0l2.6 8 1.3 4.1c.1.4 0 .8-.3 1.1Z" />
        </svg>
      );
    case "bitbucket":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden="true">
          <path d="M2.2 3.2A1 1 0 0 1 3 2h18a1 1 0 0 1 1 .9l-2.5 18a1 1 0 0 1-1 .9H5.5a1 1 0 0 1-1-.9l-2.3-18ZM9.4 16.5h5.3l1.3-9H8.2l1.2 9Z" />
        </svg>
      );
  }
}

function getReturnTo(provider: OAuthProvider): string {
  // We intentionally use window.location origin (no secrets). Backend stores this in signed state.
  // This makes the UX work for dev/preview/prod without hardcoding deployment URLs.
  return `${window.location.origin}/auth/${provider}/callback`;
}

// PUBLIC_INTERFACE
export default function OAuthConnectionsPanel() {
  /** Settings panel that lets users connect Git providers via backend OAuth endpoints. */
  const backendBase = useMemo(() => getBackendBaseUrl(), []);

  const [providerState, setProviderState] = useState<Record<OAuthProvider, ProviderUiState>>({
    github: { connected: false, busy: false },
    gitlab: { connected: false, busy: false },
    bitbucket: { connected: false, busy: false },
  });

  const refreshFromStorage = useCallback(() => {
    setProviderState((prev) => {
      const next = { ...prev };
      (["github", "gitlab", "bitbucket"] as OAuthProvider[]).forEach((p) => {
        const stored = readProviderConnection(p);
        next[p] = { ...next[p], ...stored, busy: false };
      });
      return next;
    });
  }, []);

  useEffect(() => {
    refreshFromStorage();

    // Keep in sync when callback page writes localStorage and user returns here.
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("codeinsight.oauth.")) refreshFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshFromStorage]);

  const onConnect = useCallback(async (provider: OAuthProvider) => {
    setProviderState((s) => ({ ...s, [provider]: { ...s[provider], busy: true, lastError: undefined } }));

    try {
      const authUrl = await startOAuthLogin(provider, getReturnTo(provider));
      // Navigate to provider authorization page.
      window.location.assign(authUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start OAuth login.";
      setProviderState((s) => ({
        ...s,
        [provider]: { ...s[provider], busy: false, connected: false, lastError: message },
      }));
    }
  }, []);

  return (
    <section className="space-y-3">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-slate-900">Git Provider Connections</h2>
          <p className="text-xs text-slate-600">
            Connect GitHub, GitLab, or Bitbucket to enable repo import, analytics, and AI summaries.
          </p>
        </div>

        <Pill color={backendBase ? "slate" : "red"}>
          {backendBase ? "Backend configured" : "Backend URL missing"}
        </Pill>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {OAUTH_PROVIDERS.map((p) => {
          const s = providerState[p.id];
          const statusPill =
            s.connected ? (
              <Pill color="green">Connected</Pill>
            ) : s.lastError ? (
              <Pill color="red">Not connected</Pill>
            ) : (
              <Pill color="slate">Not connected</Pill>
            );

          return (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                      <ProviderIcon provider={p.id} />
                    </span>
                    <div className="text-sm font-semibold text-slate-900">{p.label}</div>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{p.description}</p>

                  <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                    <div>
                      Frontend callback:{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5">{getProviderFrontendCallbackUrl(p.id)}</code>
                    </div>
                    <div>
                      Backend callback:{" "}
                      <code className="rounded bg-slate-100 px-1 py-0.5">{getProviderBackendCallbackUrl(p.id)}</code>
                    </div>
                  </div>

                  {s.connectedAt ? (
                    <div className="mt-2 text-[11px] text-slate-500">
                      Connected at {new Date(s.connectedAt).toLocaleString()}
                    </div>
                  ) : null}

                  {s.lastError ? (
                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800">
                      {s.lastError}
                      <div className="mt-1 text-rose-700/80">
                        If this persists, your backend may be missing OAuth env keys for this provider.
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0">{statusPill}</div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onConnect(p.id)}
                  disabled={s.busy || !backendBase}
                  className={[
                    "inline-flex h-9 flex-1 items-center justify-center rounded-lg",
                    "bg-gradient-to-r from-blue-500 to-cyan-500 px-3 text-sm font-semibold text-white shadow-sm",
                    "hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
                  ].join(" ")}
                >
                  {s.busy ? "Connecting…" : s.connected ? "Reconnect" : "Connect"}
                </button>

                <a
                  href="/repos"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Repos
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Note: Connection status is shown from the browser session. If your backend is restarted or you switch browsers,
        you may need to reconnect.
      </div>
    </section>
  );
}
