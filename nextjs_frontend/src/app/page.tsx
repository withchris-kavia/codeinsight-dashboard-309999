"use client";

import { useCallback, useMemo, useState } from "react";
import OAuthQuickConnectWidget from "@/components/integrations/OAuthQuickConnectWidget";
import MetricCard from "@/components/analytics/MetricCard";
import LineChart from "@/components/analytics/LineChart";
import BarList from "@/components/analytics/BarList";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import OrgIdPrompt from "@/components/analytics/OrgIdPrompt";
import { getDashboardMetrics, type DashboardMetricsResponse } from "@/lib/analyticsApi";
import { usePollingQuery } from "@/lib/polling";
import { getOrgId } from "@/lib/orgState";

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function lastNDaysSeries<T extends { day: string }>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return items.slice(items.length - n);
}

export default function DashboardPage() {
  const [orgId, setOrgId] = useState(() => getOrgId());

  const fetcher = useCallback(async (): Promise<DashboardMetricsResponse> => {
    if (!orgId) {
      throw new Error("Set an org_id to load dashboard metrics.");
    }
    return getDashboardMetrics({
      org_id: orgId,
      top_repos_limit: "10",
      recent_limit: "25",
    });
  }, [orgId]);

  const { state, refresh } = usePollingQuery(fetcher, {
    intervalMs: 15_000,
    enabled: Boolean(orgId),
    immediate: true,
  });

  const data = state.status === "success" || state.status === "loading" || state.status === "error" ? state.data : undefined;

  const commits7d = useMemo(() => {
    if (!data) return 0;
    return sum(lastNDaysSeries(data.commits_per_day, 7).map((p) => p.count));
  }, [data]);

  const prsOpened7d = useMemo(() => {
    if (!data) return 0;
    return sum(lastNDaysSeries(data.prs_per_day, 7).map((p) => p.opened));
  }, [data]);

  const merges7d = useMemo(() => {
    if (!data) return 0;
    return sum(lastNDaysSeries(data.prs_per_day, 7).map((p) => p.merged));
  }, [data]);

  const commitsSeries = useMemo(
    () => (data ? data.commits_per_day.map((p) => ({ xLabel: p.day, y: p.count })) : []),
    [data]
  );

  const prsSeries = useMemo(
    () => (data ? data.prs_per_day.map((p) => ({ xLabel: p.day, y: p.opened })) : []),
    [data]
  );

  const topRepos = useMemo(() => {
    if (!data) return [];
    return data.prs_merged_per_repo.slice(0, 10).map((r) => ({
      label: r.repo_full_name,
      value: r.count,
      // Static export doesn't support unknown dynamic routes; use a querystring-driven detail view.
      href: `/repos/view?repoId=${encodeURIComponent(r.repo_id)}`,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">Overview of activity, summaries, and trends (live from analytics APIs).</p>
      </header>

      <OrgIdPrompt
        onOrgIdChange={(value) => {
          setOrgId(value);
          void refresh();
        }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Commits (7d)" value={data ? String(commits7d) : "—"} hint={orgId ? "from /analytics/dashboard" : "set org_id"} />
            <MetricCard label="PRs Opened (7d)" value={data ? String(prsOpened7d) : "—"} hint="opened PR events" />
            <MetricCard label="Merges (7d)" value={data ? String(merges7d) : "—"} hint="derived from merge events" />
            <MetricCard
              label="Active Devs (range)"
              value={data ? String(data.active_contributors) : "—"}
              hint={data ? `${new Date(data.start_ts).toLocaleDateString()} → ${new Date(data.end_ts).toLocaleDateString()}` : ""}
            />
          </div>

          {state.status === "error" ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {state.error.message}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-1">
          <OAuthQuickConnectWidget />
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Polling every 15s for now. The data-fetching is centralized so upgrading to SSE/WebSocket later is easy.
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LineChart title="Commits per day" series={commitsSeries} accent="blue" />
        <LineChart title="PRs opened per day" series={prsSeries} accent="cyan" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <BarList title="Top repos by merged PRs" items={topRepos} emptyText="No repos found yet. Ingest webhooks or run analytics compute." />
        <RecentActivityFeed title="Recent activity" items={data?.recent_activity ?? []} />
      </section>
    </div>
  );
}
