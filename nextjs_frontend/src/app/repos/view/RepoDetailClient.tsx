"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import OrgIdPrompt from "@/components/analytics/OrgIdPrompt";
import MetricCard from "@/components/analytics/MetricCard";
import LineChart from "@/components/analytics/LineChart";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import { getDashboardMetrics, type DashboardMetricsResponse } from "@/lib/analyticsApi";
import { usePollingQuery } from "@/lib/polling";
import { getOrgId } from "@/lib/orgState";

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

// PUBLIC_INTERFACE
export default function RepoDetailClient() {
  /** Repo detail view driven by repoId query param: /repos/view?repoId=<uuid> */
  const search = useSearchParams();
  const repoId = search.get("repoId") ?? "";

  const [orgId, setOrgId] = useState(() => getOrgId());

  const fetcher = useCallback(async (): Promise<DashboardMetricsResponse> => {
    if (!orgId) throw new Error("Set an org_id to load repo analytics.");
    if (!repoId) throw new Error("Missing repoId in URL. Use /repos/view?repoId=<uuid>.");
    return getDashboardMetrics({
      org_id: orgId,
      repo_id: repoId,
      top_repos_limit: "10",
      recent_limit: "25",
    });
  }, [orgId, repoId]);

  const { state, refresh } = usePollingQuery(fetcher, {
    intervalMs: 15_000,
    enabled: Boolean(orgId && repoId),
    immediate: true,
  });

  const data =
    state.status === "success" || state.status === "loading" || state.status === "error"
      ? state.data
      : undefined;

  const repoName = useMemo(() => {
    if (!data) return "";
    return data.prs_merged_per_repo.at(0)?.repo_full_name ?? "";
  }, [data]);

  const commitsTotal = useMemo(() => (data ? sum(data.commits_per_day.map((p) => p.count)) : 0), [data]);
  const prsOpenedTotal = useMemo(() => (data ? sum(data.prs_per_day.map((p) => p.opened)) : 0), [data]);
  const mergesTotal = useMemo(() => (data ? sum(data.prs_per_day.map((p) => p.merged)) : 0), [data]);

  const commitsSeries = useMemo(
    () => (data ? data.commits_per_day.map((p) => ({ xLabel: p.day, y: p.count })) : []),
    [data]
  );
  const mergedSeries = useMemo(
    () => (data ? data.prs_per_day.map((p) => ({ xLabel: p.day, y: p.merged })) : []),
    [data]
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Repository</h1>
            <p className="text-sm text-slate-600">
              {repoName ? (
                <>
                  <span className="font-medium text-slate-900">{repoName}</span> ·{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5">{repoId || "—"}</code>
                </>
              ) : repoId ? (
                <code className="rounded bg-slate-100 px-1 py-0.5">{repoId}</code>
              ) : (
                "Select a repo from the list."
              )}
            </p>
          </div>

          <Link
            href="/repos"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to repos
          </Link>
        </div>
      </header>

      <OrgIdPrompt
        onOrgIdChange={(value) => {
          setOrgId(value);
          void refresh();
        }}
      />

      {!repoId ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Missing <code className="rounded bg-white px-1 py-0.5">repoId</code>. Open this page from the{" "}
          <Link href="/repos" className="font-medium text-blue-700 hover:underline">
            repositories list
          </Link>
          .
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {state.error.message}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Commits (range)" value={data ? String(commitsTotal) : "—"} hint="sum of commits_per_day" />
        <MetricCard
          label="PRs opened (range)"
          value={data ? String(prsOpenedTotal) : "—"}
          hint="sum of prs_per_day.opened"
        />
        <MetricCard label="Merges (range)" value={data ? String(mergesTotal) : "—"} hint="sum of prs_per_day.merged" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <LineChart title="Commits per day (repo)" series={commitsSeries} accent="blue" />
        <LineChart title="Merges per day (repo)" series={mergedSeries} accent="cyan" />
      </section>

      <RecentActivityFeed title="Recent activity (repo)" items={data?.recent_activity ?? []} />
    </div>
  );
}
