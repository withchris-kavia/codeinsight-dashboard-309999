import { getBackendBaseUrl } from "@/lib/backendApi";

export type DayCountPoint = {
  day: string; // YYYY-MM-DD
  count: number;
};

export type PullRequestsDayPoint = {
  day: string; // YYYY-MM-DD
  opened: number;
  merged: number;
};

export type RepoCountPoint = {
  repo_id: string; // UUID
  repo_full_name: string; // owner/name
  count: number;
};

export type RecentActivityItem = {
  git_event_id: string;
  repo_id: string;
  repo_full_name: string;
  provider: string;
  event_type: string;
  actor_username: string | null;
  actor_email: string | null;
  event_timestamp: string; // ISO
  pr_number: number | null;
  pr_state: string | null;
  commit_sha: string | null;
  merge_commit_sha: string | null;
};

export type DashboardMetricsResponse = {
  org_id: string;
  repo_id: string | null;
  start_ts: string;
  end_ts: string;
  commits_per_day: DayCountPoint[];
  prs_per_day: PullRequestsDayPoint[];
  prs_merged_per_repo: RepoCountPoint[];
  active_contributors: number;
  recent_activity: RecentActivityItem[];
};

export type AnalyticsComputeRequest = {
  org_id: string;
  repo_id?: string | null;
  start_date?: string | null; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
};

export type AnalyticsComputeResponse = {
  org_id: string;
  repo_id: string | null;
  start_ts: string;
  end_ts: string;
  repo_daily_upserts: number;
  dev_daily_upserts: number;
};

type JsonRecord = Record<string, unknown>;

async function safeReadJson(res: Response): Promise<JsonRecord | null> {
  try {
    return (await res.json()) as JsonRecord;
  } catch {
    return null;
  }
}

async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL.");
  }

  const url = new URL(`${base}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (typeof v === "string" && v.length > 0) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), { method: "GET" });
  const payload = await safeReadJson(res);

  if (!res.ok) {
    const detail =
      (payload?.detail as string | undefined) ||
      (payload?.message as string | undefined) ||
      `Backend returned ${res.status}`;
    throw new Error(detail);
  }

  return (payload ?? (await res.json())) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("Backend URL is not configured. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL.");
  }

  const url = new URL(`${base}${path}`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await safeReadJson(res);
  if (!res.ok) {
    const detail =
      (payload?.detail as string | undefined) ||
      (payload?.message as string | undefined) ||
      `Backend returned ${res.status}`;
    throw new Error(detail);
  }

  return (payload ?? (await res.json())) as T;
}

// PUBLIC_INTERFACE
export async function computeAnalytics(req: AnalyticsComputeRequest): Promise<AnalyticsComputeResponse> {
  /** Calls POST /analytics/compute to (re)compute daily aggregates. */
  return apiPost<AnalyticsComputeResponse>("/analytics/compute", req);
}

// PUBLIC_INTERFACE
export async function getDashboardMetrics(params: {
  org_id: string;
  repo_id?: string;
  start_date?: string;
  end_date?: string;
  recent_limit?: string;
  top_repos_limit?: string;
}): Promise<DashboardMetricsResponse> {
  /** Calls GET /analytics/dashboard for a dashboard-ready bundle of metrics. */
  return apiGet<DashboardMetricsResponse>("/analytics/dashboard", params);
}

// PUBLIC_INTERFACE
export async function getRecentActivity(params: {
  org_id: string;
  repo_id?: string;
  limit?: string;
}): Promise<RecentActivityItem[]> {
  /** Calls GET /analytics/recent-activity for a feed suitable for dashboards and repo pages. */
  return apiGet<RecentActivityItem[]>("/analytics/recent-activity", params);
}
