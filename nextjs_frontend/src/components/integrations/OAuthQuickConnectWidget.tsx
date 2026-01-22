"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { OAUTH_PROVIDERS, type OAuthProvider } from "@/lib/oauthProviders";
import { getBackendBaseUrl, startOAuthLogin } from "@/lib/backendApi";
import { readProviderConnection } from "@/lib/oauthConnectionState";

type ProviderState = { connected: boolean; busy: boolean };

function Dot({ connected }: { connected: boolean }) {
  return (
    <span
      className={[
        "inline-block h-2 w-2 rounded-full",
        connected ? "bg-emerald-500" : "bg-slate-300",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}

function getReturnTo(provider: OAuthProvider): string {
  return `${window.location.origin}/auth/${provider}/callback`;
}

// PUBLIC_INTERFACE
export default function OAuthQuickConnectWidget() {
  /** Compact dashboard widget for quickly connecting Git providers via OAuth. */
  const backendBase = useMemo(() => getBackendBaseUrl(), []);
  const [state, setState] = useState<Record<OAuthProvider, ProviderState>>({
    github: { connected: false, busy: false },
    gitlab: { connected: false, busy: false },
    bitbucket: { connected: false, busy: false },
  });

  const refresh = useCallback(() => {
    setState((prev) => {
      const next = { ...prev };
      (["github", "gitlab", "bitbucket"] as OAuthProvider[]).forEach((p) => {
        const stored = readProviderConnection(p);
        next[p] = { ...next[p], connected: Boolean(stored.connected), busy: false };
      });
      return next;
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(
    async (provider: OAuthProvider) => {
      setState((s) => ({ ...s, [provider]: { ...s[provider], busy: true } }));
      try {
        const authUrl = await startOAuthLogin(provider, getReturnTo(provider));
        window.location.assign(authUrl);
      } catch {
        // If env keys are missing or backend is down, UX should still work: show not connected.
        setState((s) => ({ ...s, [provider]: { connected: false, busy: false } }));
      }
    },
    []
  );

  const connectedCount = Object.values(state).filter((s) => s.connected).length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Connect Git Providers</h2>
          <p className="mt-1 text-xs text-slate-600">
            {backendBase
              ? `${connectedCount}/3 connected`
              : "Backend URL not configured (set NEXT_PUBLIC_API_BASE_URL, or legacy NEXT_PUBLIC_API_BASE / NEXT_PUBLIC_BACKEND_URL)."}
          </p>
        </div>

        <a
          href="/settings"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Manage
        </a>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {OAUTH_PROVIDERS.map((p) => {
          const s = state[p.id];
          return (
            <button
              key={p.id}
              type="button"
              disabled={!backendBase || s.busy}
              onClick={() => connect(p.id)}
              className={[
                "flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left",
                "hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <Dot connected={s.connected} />
                <span className="text-sm font-medium text-slate-900">{p.label}</span>
              </div>
              <span className="text-xs text-slate-600">{s.busy ? "…" : s.connected ? "Connected" : "Connect"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
