"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import OAuthConnectionsPanel from "@/components/integrations/OAuthConnectionsPanel";
import OrgIdPrompt from "@/components/analytics/OrgIdPrompt";
import {
  listNotificationConfigs,
  sendTestNotification,
  upsertNotificationConfig,
  type NotificationConfig,
  type NotificationProvider,
} from "@/lib/backendApi";
import { getOrgId } from "@/lib/orgState";

type FormState = {
  slackEnabled: boolean;
  slackWebhookUrl: string;

  emailEnabled: boolean;
  emailAddress: string;
};

function pickConfig(configs: NotificationConfig[], provider: NotificationProvider, orgId: string): NotificationConfig | null {
  // Backend allows both org_id and user_id scopes; in Settings we focus on org-scoped configs.
  return (
    configs.find((c) => c.provider === provider && c.org_id === orgId) ??
    configs.find((c) => c.provider === provider && c.org_id === orgId && c.user_id === null) ??
    null
  );
}

export default function SettingsPage() {
  const [orgId, setOrgId] = useState(() => getOrgId());

  const [form, setForm] = useState<FormState>({
    slackEnabled: true,
    slackWebhookUrl: "",
    emailEnabled: true,
    emailAddress: "",
  });

  const [configs, setConfigs] = useState<NotificationConfig[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const canLoad = Boolean(orgId);

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    setStatus("");

    try {
      const rows = await listNotificationConfigs({ org_id: orgId });
      setConfigs(rows);

      const slack = pickConfig(rows, "slack", orgId);
      const email = pickConfig(rows, "email", orgId);

      setForm((prev) => ({
        ...prev,
        slackEnabled: slack ? Boolean(slack.enabled) : prev.slackEnabled,
        slackWebhookUrl: slack?.slack_webhook_url ?? "",
        emailEnabled: email ? Boolean(email.enabled) : prev.emailEnabled,
        emailAddress: email?.email_address ?? "",
      }));

      setStatus(`Loaded ${rows.length} config(s) for org.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notification settings.");
    } finally {
      setBusy(false);
    }
  }, [orgId]);

  useEffect(() => {
    // Auto-load when orgId is present.
    if (!orgId) {
      setConfigs(null);
      return;
    }
    void load();
  }, [load, orgId]);

  const slackSummary = useMemo(() => {
    if (!configs || !orgId) return null;
    return pickConfig(configs, "slack", orgId);
  }, [configs, orgId]);

  const emailSummary = useMemo(() => {
    if (!configs || !orgId) return null;
    return pickConfig(configs, "email", orgId);
  }, [configs, orgId]);

  const saveSlack = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    setStatus("");

    try {
      await upsertNotificationConfig({
        provider: "slack",
        enabled: form.slackEnabled,
        org_id: orgId,
        slack_webhook_url: form.slackWebhookUrl.trim() ? form.slackWebhookUrl.trim() : null,
      });
      setStatus("Saved Slack notification settings.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save Slack settings.");
    } finally {
      setBusy(false);
    }
  }, [form.slackEnabled, form.slackWebhookUrl, load, orgId]);

  const saveEmail = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    setStatus("");

    try {
      await upsertNotificationConfig({
        provider: "email",
        enabled: form.emailEnabled,
        org_id: orgId,
        email_address: form.emailAddress.trim(),
      });
      setStatus("Saved email notification settings.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save email settings.");
    } finally {
      setBusy(false);
    }
  }, [form.emailAddress, form.emailEnabled, load, orgId]);

  const sendTest = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    setStatus("");

    try {
      const resp = await sendTestNotification({
        org_id: orgId,
        message: `Test notification from Settings @ ${new Date().toLocaleString()}`,
      });
      if (!resp.results.length) {
        setStatus("No configs matched this org scope. Create a config, then retry.");
      } else {
        const ok = resp.results.filter((r) => r.dispatched).length;
        setStatus(`Test complete: ${ok}/${resp.results.length} dispatched successfully.`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send test notification.");
    } finally {
      setBusy(false);
    }
  }, [load, orgId]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">Manage integrations and notification preferences.</p>
      </header>

      <OrgIdPrompt
        onOrgIdChange={(value) => {
          setOrgId(value);
        }}
      />

      <OAuthConnectionsPanel />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-600">
              Configure Slack + email notifications (org scoped). Backed by{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5">/notifications/configs</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canLoad || busy}
              onClick={() => void load()}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Loading…" : "Reload"}
            </button>

            <button
              type="button"
              disabled={!canLoad || busy}
              onClick={() => void sendTest()}
              className={[
                "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white shadow-sm",
                "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {busy ? "Working…" : "Send test"}
            </button>
          </div>
        </div>

        {!orgId ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            Set an <code className="rounded bg-white px-1 py-0.5">org_id</code> above to manage notification settings.
          </div>
        ) : null}

        {error ? <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div> : null}
        {status ? <div className="mt-3 text-sm text-slate-700">{status}</div> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Slack */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Slack</div>
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
                  slackSummary?.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {slackSummary ? (slackSummary.enabled ? "Enabled" : "Disabled") : "Not configured"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                id="slackEnabled"
                type="checkbox"
                checked={form.slackEnabled}
                onChange={(e) => setForm((s) => ({ ...s, slackEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="slackEnabled" className="text-sm text-slate-700">
                Enable Slack notifications
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600" htmlFor="slackWebhook">
                Slack webhook URL (optional)
              </label>
              <input
                id="slackWebhook"
                value={form.slackWebhookUrl}
                onChange={(e) => setForm((s) => ({ ...s, slackWebhookUrl: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="mt-2 text-[11px] text-slate-600">
                If omitted, the backend may fall back to <code className="rounded bg-white px-1 py-0.5">SLACK_WEBHOOK_DEFAULT</code>.
              </div>
            </div>

            {slackSummary?.last_error ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                Last error: {slackSummary.last_error}
              </div>
            ) : null}

            <div className="mt-3">
              <button
                type="button"
                disabled={!orgId || busy}
                onClick={() => void saveSlack()}
                className={[
                  "inline-flex h-9 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold text-white shadow-sm",
                  "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                Save Slack settings
              </button>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">Email</div>
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
                  emailSummary?.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {emailSummary ? (emailSummary.enabled ? "Enabled" : "Disabled") : "Not configured"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                id="emailEnabled"
                type="checkbox"
                checked={form.emailEnabled}
                onChange={(e) => setForm((s) => ({ ...s, emailEnabled: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="emailEnabled" className="text-sm text-slate-700">
                Enable email notifications
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600" htmlFor="emailAddress">
                Destination email address
              </label>
              <input
                id="emailAddress"
                value={form.emailAddress}
                onChange={(e) => setForm((s) => ({ ...s, emailAddress: e.target.value }))}
                placeholder="alerts@example.com"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="mt-2 text-[11px] text-slate-600">
                Backend requires SMTP env vars to actually send (otherwise it returns a stubbed result and sets last_error).
              </div>
            </div>

            {emailSummary?.last_error ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                Last error: {emailSummary.last_error}
              </div>
            ) : null}

            <div className="mt-3">
              <button
                type="button"
                disabled={!orgId || busy || !form.emailAddress.trim()}
                onClick={() => void saveEmail()}
                className={[
                  "inline-flex h-9 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold text-white shadow-sm",
                  "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
                ].join(" ")}
              >
                Save Email settings
              </button>

              {!form.emailAddress.trim() ? <div className="mt-2 text-[11px] text-slate-600">Email address is required to save email config.</div> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Provider connection status is tracked locally after OAuth callback (until a backend “connection status” endpoint is added).
      </section>
    </div>
  );
}
