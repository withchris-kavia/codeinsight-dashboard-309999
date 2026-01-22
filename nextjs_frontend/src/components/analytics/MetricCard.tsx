type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

// PUBLIC_INTERFACE
export default function MetricCard({ label, value, hint }: MetricCardProps) {
  /** Small metric card used on dashboard + repo detail pages. */
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className="h-1.5 w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
