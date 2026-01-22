"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import type { OAuthProvider } from "@/lib/oauthProviders";
import { completeOAuthCallback } from "@/lib/backendApi";
import { markProviderConnected, markProviderError } from "@/lib/oauthConnectionState";

type ViewState =
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function isProvider(value: string): value is OAuthProvider {
  return value === "github" || value === "gitlab" || value === "bitbucket";
}

// PUBLIC_INTERFACE
export default function OAuthCallbackClient() {
  /** Client-side handler for redirects back from /auth/{provider}/callback and proxying to backend callback endpoint. */
  const params = useParams<{ provider: string }>();
  const search = useSearchParams();
  const provider = useMemo(() => params?.provider ?? "", [params]);

  const [state, setState] = useState<ViewState>({ status: "loading" });

  useEffect(() => {
    if (!isProvider(provider)) {
      setState({ status: "error", message: "Unknown provider." });
      return;
    }

    const code = search.get("code");
    const oauthState = search.get("state");
    const error = search.get("error");
    const errorDescription = search.get("error_description");

    if (error) {
      const message = `${error}${errorDescription ? `: ${errorDescription}` : ""}`;
      markProviderError(provider, message);
      setState({ status: "error", message });
      return;
    }

    if (!code) {
      const message =
        "Missing OAuth code. Your OAuth app redirect URI might be pointing to the backend callback instead of this frontend route.";
      markProviderError(provider, message);
      setState({ status: "error", message });
      return;
    }

    (async () => {
      try {
        await completeOAuthCallback(provider, {
          code,
          state: oauthState,
          error,
          error_description: errorDescription,
        });
        markProviderConnected(provider);
        setState({
          status: "success",
          message: `Connected ${provider}. You can now return to Settings to manage repositories.`,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to complete OAuth callback.";
        markProviderError(provider, message);
        setState({ status: "error", message });
      }
    })();
  }, [provider, search]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">OAuth Callback</h1>
        <p className="text-sm text-slate-600">
          Finalizing provider connection{isProvider(provider) ? `: ${provider}` : ""}.
        </p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {state.status === "loading" ? (
          <div className="text-sm text-slate-600">Completing OAuth handshake…</div>
        ) : state.status === "success" ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-emerald-700">Success</div>
            <div className="text-sm text-slate-700">{state.message}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-rose-700">Connection failed</div>
            <div className="text-sm text-slate-700">{state.message}</div>
            <div className="text-xs text-slate-600">
              Tip: If your provider redirect URI is configured to the backend (e.g.{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">/auth/&lt;provider&gt;/callback</code> on the API),
              you may see JSON directly from the backend instead of this page.
            </div>
          </div>
        )}
      </section>

      <div className="flex gap-2">
        <Link
          href="/settings"
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Back to Settings
        </Link>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
