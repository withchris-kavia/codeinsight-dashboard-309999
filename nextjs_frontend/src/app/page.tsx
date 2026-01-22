export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-600">
          Overview of activity, AI summaries, and trends (placeholder).
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Commits (7d)", value: "—" },
          { label: "Pull Requests (7d)", value: "—" },
          { label: "Merges (7d)", value: "—" },
          { label: "Active Devs (7d)", value: "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs font-medium text-slate-500">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">AI Weekly Summary</h2>
            <span className="rounded-full bg-[color:var(--accent-weak)] px-2 py-1 text-xs font-medium text-blue-700">
              placeholder
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            This area will display an AI-generated narrative summary of repository activity,
            notable PRs, risks, and momentum.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Activity Chart</h2>
          <div className="mt-3 grid h-44 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </div>
      </section>
    </div>
  );
}
