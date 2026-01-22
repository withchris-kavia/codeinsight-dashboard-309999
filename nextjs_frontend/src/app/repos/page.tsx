"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import OrgIdPrompt from "@/components/analytics/OrgIdPrompt";
import MetricCard from "@/components/analytics/MetricCard";
import RecentActivityFeed from "@/components/analytics/RecentActivityFeed";
import { getDashboardMetrics, type DashboardMetricsResponse } from "@/lib/analyticsApi";
import { usePollingQuery } from "@/lib/polling";
import { getOrgId } from "@/lib/orgState";

type RepoRow = { repoId: string; fullName: string; mergedPrs: number };

export default function RepositoriesPage() {
  const [orgId, setOrgId] = useState(() => getOrgId());

  const fetcher = useCallback(async (): Promise<DashboardMetricsResponse> => {
    if (!orgId) throw new Error("Set an org_id to load repositories.");
    return getDashboardMetrics({
      org_id: orgId,
      top_repos_limit: "50",
      recent_limit: "25",
    });
  }, [orgId]);

  const { state, refresh } = usePollingQuery(fetcher, { intervalMs: 20_000, enabled: Boolean(orgId), immediate: true });

  const data = state.status === "success" || state.status === "loading" || state.status === "error" ? state.data : undefined;

  const repos: RepoRow[] = useMemo(() => {
    if (!data) return [];
    // The backend currently doesn't expose repo list endpoints, so we derive a list from analytics:
    // - prs_merged_per_repo gives (repo_id, full_name, merged count)
    // - recent_activity can include repos with 0 merges (fallback)
    const fromMerged = data.prs_merged_per_repo.map((r) => ({
      repoId: r.repo_id,
      fullName: r.repo_full_name,
      mergedPrs: r.count,
    }));

    const seen = new Set(fromMerged.map((r) => r.repoId));
    const fromRecent = data.recent_activity
      .filter((a) => !seen.has(a.repo_id))
      .map((a) => ({ repoId: a.repo_id, fullName: a.repo_full_name, mergedPrs: 0 }));

    return [...fromMerged, ...fromRecent].sort((a, b) => b.mergedPrs - a.mergedPrs || a.fullName.localeCompare(b.fullName));
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
        <p className="text-sm text-slate-600">
          Repo list derived from analytics endpoints (until a dedicated repos API is added).
        </p>
      </header>

      <OrgIdPrompt
        onOrgIdChange={(value) => {
          setOrgId(value);
          void refresh();
        }}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Repos discovered" value={repos.length ? String(repos.length) : "—"} hint="derived from analytics" />
        <MetricCard
          label="Recent activity items"
          value={data ? String(data.recent_activity.length) : "—"}
          hint="from /analytics/dashboard"
        />
        <MetricCard
          label="Active contributors (range)"
          value={data ? String(data.active_contributors) : "—"}
          hint="from /analytics/dashboard"
        />
      </section>

      {state.status === "error" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{state.error.message}</div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Repository list</h2>
          <span className="text-xs text-slate-500">{repos.length ? `${repos.length} repos` : "—"}</span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Repository</th>
                <th className="px-3 py-2 font-medium">Merged PRs (range)</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repos.length ? (
                repos.map((r) => (
                  <tr key={r.repoId}>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{r.fullName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        <code className="rounded bg-slate-100 px-1 py-0.5">{r.repoId}</code>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-900">{r.mergedPrs}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/repos/view?repoId=${encodeURIComponent(r.repoId)}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-slate-600" colSpan={3}>
                    {orgId ? "No repos found yet. Ingest webhooks or compute analytics." : "Set an org_id to load repos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <RecentActivityFeed title="Recent activity (org)" items={data?.recent_activity ?? []} />
    </div>
  );
}
