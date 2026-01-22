type Item = { label: string; value: number; href?: string };

type BarListProps = {
  title: string;
  items: Item[];
  emptyText?: string;
};

// PUBLIC_INTERFACE
export default function BarList({ title, items, emptyText = "No data yet." }: BarListProps) {
  /** Ranked list with progress bars (used for top repos). */
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-[color:var(--accent-weak)] px-2 py-1 text-xs font-medium text-blue-700">
          top {items.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((it) => {
            const pct = Math.max(0, Math.min(100, Math.round((it.value / max) * 100)));
            const Wrapper = it.href ? "a" : "div";

            return (
              <Wrapper
                key={`${it.label}-${it.value}`}
                {...(it.href ? { href: it.href } : {})}
                className={[
                  "block rounded-lg border border-slate-200 bg-white p-3",
                  it.href ? "hover:bg-slate-50" : "",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{it.label}</div>
                  </div>
                  <div className="shrink-0 text-sm font-semibold text-slate-900">{it.value}</div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                </div>
              </Wrapper>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}
