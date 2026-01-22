"use client";

import { useCallback, useMemo, useState } from "react";
import OrgIdPrompt from "@/components/analytics/OrgIdPrompt";
import BarList from "@/components/analytics/BarList";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import { computeAnalytics, getDashboardMetrics, type DashboardMetricsResponse } from "@/lib/analyticsApi";
import { usePollingQuery } from "@/lib/polling";
import { getOrgId } from "@/lib/orgState";

type ContributorRow = {
  key: string;
  label: string;
  total: number;
  commits: number;
  prs: number;
  merges: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function formatContributorLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Unknown";
  return trimmed;
}

function contributorKey(actorUsername: string | null, actorEmail: string | null): string {
  // Use stable key preference: username -> email -> unknown
  return actorUsername?.trim() || actorEmail?.trim() || "unknown";
}

function contributorLabel(actorUsername: string | null, actorEmail: string | null): string {
  if (actorUsername?.trim()) return actorUsername.trim();
  if (actorEmail?.trim()) return actorEmail.trim();
  return "Unknown";
}

export default function LeaderboardPage() {
  const [orgId, setOrgId] = useState(() => getOrgId());
  const [daysBack, setDaysBack] = useState(30);
  const [busyCompute, setBusyCompute] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);

  const fetcher = useCallback(async (): Promise<DashboardMetricsResponse> => {
    if (!orgId) throw new Error("Set an org_id to load the leaderboard.");

    // We use the dashboard bundle (single round-trip). For contributor ranking, we derive from recent_activity
    // because the backend does not currently expose per-dev aggregates as a public endpoint.
    return getDashboardMetrics({
      org_id: orgId,
      recent_limit: "200",
      top_repos_limit: "25",
      // start_date/end_date are optional; backend defaults to last 30 days.
      // We keep it simple and rely on defaults, but allow the user to trigger compute on the same window.
    });
  }, [orgId]);

  const { state, refresh } = usePollingQuery(fetcher, {
    intervalMs: 20_000,
    enabled: Boolean(orgId),
    immediate: true,
  });

  const data = state.status === "success" || state.status === "loading" || state.status === "error" ? state.data : undefined;

  const contributors: ContributorRow[] = useMemo(() => {
    if (!data) return [];

    const map = new Map<string, ContributorRow>();

    for (const ev of data.recent_activity) {
      const key = contributorKey(ev.actor_username, ev.actor_email);
      const label = contributorLabel(ev.actor_username, ev.actor_email);

      const row =
        map.get(key) ??
        ({
          key,
          label,
          total: 0,
          commits: 0,
          prs: 0,
          merges: 0,
        } satisfies ContributorRow);

      row.total += 1;
      if (ev.event_type === "commit") row.commits += 1;
      else if (ev.event_type === "pull_request") row.prs += 1;
      else if (ev.event_type === "merge") row.merges += 1;

      map.set(key, row);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }, [data]);

  const leaderboardItems = useMemo(() => {
    // BarList expects label/value. We keep details below in a table.
    return contributors.slice(0, 15).map((c) => ({
      label: formatContributorLabel(c.label),
      value: c.total,
    }));
  }, [contributors]);

  const onCompute = useCallback(async () => {
    if (!orgId) return;
    setBusyCompute(true);
    setComputeError(null);
    try {
      // Trigger compute to keep analytics tables warm. Leaderboard derived from recent_activity,
      // but compute also helps dashboard charts and future per-dev endpoints.
      const safeDays = clamp(daysBack, 1, 90);
      const start = new Date();
      start.setUTCDate(start.getUTCDate() - safeDays);
      const startDate = start.toISOString().slice(0, 10);

      await computeAnalytics({
        org_id: orgId,
        start_date: startDate,
      });
      await refresh();
    } catch (e) {
      setComputeError(e instanceof Error ? e.message : "Failed to compute analytics.");
    } finally {
      setBusyCompute(false);
    }
  }, [daysBack, orgId, refresh]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Leaderboard</h1>
        <p className="text-sm text-slate-600">
          Contributors ranked by recent activity. (Derived from <code className="rounded bg-slate-100 px-1 py-0.5">/analytics/dashboard</code>{" "}
          recent activity feed.)
        </p>
      </header>

      <OrgIdPrompt
        onOrgIdChange={(value) => {
          setOrgId(value);
          void refresh();
        }}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Refresh data</h2>
            <p className="text-xs text-slate-600">
              Optional: run analytics compute to keep aggregates warm (useful for dashboard charts + future per-dev endpoints).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => void onCompute()}
              disabled={!orgId || busyCompute}
              className={[
                "inline-flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-white shadow-sm",
                "bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
            >
              {busyCompute ? "Computing…" : "Compute & refresh"}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={!orgId}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        {computeError ? (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{computeError}</div>
        ) : null}

        {state.status === "error" ? (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{state.error.message}</div>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <BarList title="Top contributors (by event count)" items={leaderboardItems} emptyText={orgId ? "No activity yet." : "Set an org_id to load the leaderboard."} />

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Breakdown (top 25)</h2>
            <span className="text-xs text-slate-500">{contributors.length ? `${contributors.length} contributors` : "—"}</span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Contributor</th>
                  <th className="px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2 font-medium">Commits</th>
                  <th className="px-3 py-2 font-medium">PRs</th>
                  <th className="px-3 py-2 font-medium">Merges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contributors.length ? (
                  contributors.slice(0, 25).map((c, idx) => (
                    <tr key={c.key}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-900">{formatContributorLabel(c.label)}</div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              <code className="rounded bg-slate-100 px-1 py-0.5">{c.key}</code>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{c.total}</td>
                      <td className="px-3 py-3 text-slate-700">{c.commits}</td>
                      <td className="px-3 py-3 text-slate-700">{c.prs}</td>
                      <td className="px-3 py-3 text-slate-700">{c.merges}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-slate-600" colSpan={5}>
                      {orgId ? "No activity yet. Ingest webhooks or run analytics compute." : "Set an org_id to load contributor rankings."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-slate-600">
            Note: This leaderboard is derived from the recent activity feed (event stream). A dedicated per-contributor analytics endpoint can replace this later without changing the UI layout.
          </div>
        </section>
      </section>

      <RecentActivityFeed title="Recent activity (used to build leaderboard)" items={data?.recent_activity ?? []} />
    </div>
  );
}
