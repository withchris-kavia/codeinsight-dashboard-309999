import type { RecentActivityItem } from "@/lib/analyticsApi";

function formatWhen(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString();
}

function Badge({ kind }: { kind: string }) {
  const cls =
    kind === "commit"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : kind === "pull_request"
        ? "bg-cyan-50 text-cyan-700 border-cyan-200"
        : kind === "merge"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {kind}
    </span>
  );
}

// PUBLIC_INTERFACE
export default function RecentActivityFeed({
  title,
  items,
  emptyText = "No recent activity yet.",
}: {
  /** Activity feed list for the dashboard and repo detail page. */
  title: string;
  items: RecentActivityItem[];
  emptyText?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-500">{items.length ? `${items.length} events` : "—"}</span>
      </div>

      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((it) => (
            <div key={it.git_event_id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge kind={it.event_type} />
                    <div className="truncate text-sm font-semibold text-slate-900">{it.repo_full_name}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {it.actor_username || it.actor_email || "Unknown actor"} · {formatWhen(it.event_timestamp)}
                  </div>

                  {it.pr_number ? (
                    <div className="mt-1 text-xs text-slate-600">
                      PR #{it.pr_number}
                      {it.pr_state ? ` · ${it.pr_state}` : ""}
                    </div>
                  ) : null}

                  {it.commit_sha ? (
                    <div className="mt-1 text-[11px] text-slate-500">
                      commit <code className="rounded bg-slate-100 px-1 py-0.5">{it.commit_sha.slice(0, 8)}</code>
                    </div>
                  ) : null}

                  {it.merge_commit_sha ? (
                    <div className="mt-1 text-[11px] text-slate-500">
                      merge <code className="rounded bg-slate-100 px-1 py-0.5">{it.merge_commit_sha.slice(0, 8)}</code>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 text-[11px] text-slate-500">{it.provider}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}
