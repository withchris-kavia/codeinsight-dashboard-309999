"use client";

import { useCallback, useMemo, useState } from "react";
import OrgIdPrompt from "@/components/analytics/OrgIdPrompt";
import { computeAnalytics } from "@/lib/analyticsApi";
import { getBackendBaseUrl, listNotificationConfigs, sendTestNotification, type NotificationDispatchResponse } from "@/lib/backendApi";
import { getOrgId } from "@/lib/orgState";

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatResultSummary(resp: NotificationDispatchResponse): string {
  if (!resp.results.length) return "No configs matched this scope.";
  const ok = resp.results.filter((r) => r.dispatched).length;
  const total = resp.results.length;
  return `${ok}/${total} dispatched successfully`;
}

export default function AdminPage() {
  const backendBase = useMemo(() => getBackendBaseUrl(), []);
  const [orgId, setOrgId] = useState(() => getOrgId());
  const [userId, setUserId] = useState("");
  const [daysBack, setDaysBack] = useState(30);

  const [busyCompute, setBusyCompute] = useState(false);
  const [busyNotif, setBusyNotif] = useState(false);

  const [configsJson, setConfigsJson] = useState<string>("");
  const [notifResult, setNotifResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const scopeParams = useMemo(() => {
    const params: { org_id?: string; user_id?: string } = {};
    if (orgId) params.org_id = orgId;
    if (userId.trim() && isUuidLike(userId.trim())) params.user_id = userId.trim();
    return params;
  }, [orgId, userId]);

  const onCompute = useCallback(async () => {
    if (!orgId) return;
    setBusyCompute(true);
    setError(null);

    try {
      const start = new Date();
      start.setUTCDate(start.getUTCDate() - Math.max(1, Math.min(90, daysBack)));
      await computeAnalytics({ org_id: orgId, start_date: start.toISOString().slice(0, 10) });
      setNotifResult("Analytics compute completed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute analytics.");
    } finally {
      setBusyCompute(false);
    }
  }, [daysBack, orgId]);

  const onLoadConfigs = useCallback(async () => {
    setBusyNotif(true);
    setError(null);
    setNotifResult("");
    try {
      const configs = await listNotificationConfigs(scopeParams);
      setConfigsJson(JSON.stringify(configs, null, 2));
      setNotifResult(`Loaded ${configs.length} configs.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notification configs.");
    } finally {
      setBusyNotif(false);
    }
  }, [scopeParams]);

  const onSendTest = useCallback(async () => {
    setBusyNotif(true);
    setError(null);
    setNotifResult("");
    try {
      const resp = await sendTestNotification({
        ...scopeParams,
        message: `Test notification from Admin panel @ ${new Date().toLocaleString()}`,
      });
      setNotifResult(formatResultSummary(resp));
      setConfigsJson(JSON.stringify(resp, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test notification.");
    } finally {
      setBusyNotif(false);
    }
  }, [scopeParams]);

  const scopeHint = useMemo(() => {
    if (scopeParams.org_id && scopeParams.user_id) return "Scoped to org_id OR user_id (backend uses OR filter).";
    if (scopeParams.org_id) return "Scoped to org_id.";
    if (scopeParams.user_id) return "Scoped to user_id.";
    return "Set org_id and/or user_id to scope admin actions.";
  }, [scopeParams.org_id, scopeParams.user_id]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-600">Operational controls and visibility for analytics + notifications.</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-slate-900">Backend status</div>
          <span
            className={[
              "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
              backendBase ? "border-slate-200 bg-white text-slate-700" : "border-rose-200 bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            {backendBase ? `Configured: ${backendBase}` : "Backend URL missing (set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL)"}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-600">{scopeHint}</div>
      </section>

      <OrgIdPrompt
        onOrgIdChange={(value) => {
          setOrgId(value);
        }}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Scope (optional)</h2>
            <p className="text-xs text-slate-600">Notifications endpoints accept org_id and/or user_id. This app has no auth yet.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-medium text-slate-600" htmlFor="userId">
              user_id (UUID)
            </label>
            <input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value.trim())}
              placeholder="optional user UUID"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:w-80"
            />
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Analytics compute</h2>
            <span className="text-xs text-slate-500">POST /analytics/compute</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-xs font-medium text-slate-600" htmlFor="daysBack">
              days back
            </label>
            <input
              id="daysBack"
              type="number"
              min={1}
              max={90}
              value={daysBack}
              onChange={(e) => setDaysBack(Number(e.target.value || 30))}
              className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button
              type="button"
              disabled={!orgId || busyCompute}
              onClick={() => void onCompute()}
              className={[
                "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white shadow-sm",
                "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {busyCompute ? "Computing…" : "Run compute"}
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-600">
            Tip: Use this after ingesting webhooks to ensure dashboards and leaderboards show up-to-date aggregates.
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <span className="text-xs text-slate-500">/notifications/*</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busyNotif || (!scopeParams.org_id && !scopeParams.user_id)}
              onClick={() => void onLoadConfigs()}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyNotif ? "Loading…" : "List configs"}
            </button>

            <button
              type="button"
              disabled={busyNotif || (!scopeParams.org_id && !scopeParams.user_id)}
              onClick={() => void onSendTest()}
              className={[
                "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white shadow-sm",
                "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {busyNotif ? "Sending…" : "Send test"}
            </button>
          </div>

          {notifResult ? <div className="mt-3 text-sm text-slate-700">{notifResult}</div> : null}

          <div className="mt-3 text-xs text-slate-600">
            If Slack/email provider env vars are missing on the backend, the API will return stubbed results and persist{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">last_error</code>.
          </div>
        </section>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Output</h2>
          <span className="text-xs text-slate-500">debug</span>
        </div>

        <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-800">
{configsJson || "No output yet. Use the buttons above to query backend routes."}
        </pre>
      </section>
    </div>
  );
}
