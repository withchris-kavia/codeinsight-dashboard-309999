import { Suspense } from "react";
import OAuthCallbackClient from "./OAuthCallbackClient";
import type { OAuthProvider } from "@/lib/oauthProviders";

// PUBLIC_INTERFACE
export function generateStaticParams(): Array<{ provider: OAuthProvider }> {
  /** Required for `output: "export"`: pre-generates the static routes for each OAuth provider callback page. */
  return [{ provider: "github" }, { provider: "gitlab" }, { provider: "bitbucket" }];
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">OAuth Callback</h1>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-600">
            Loading…
          </div>
        </div>
      }
    >
      <OAuthCallbackClient />
    </Suspense>
  );
}
