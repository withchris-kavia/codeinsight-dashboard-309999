type Point = { xLabel: string; y: number };

type LineChartProps = {
  title: string;
  series: Point[];
  height?: number;
  accent?: "blue" | "cyan";
};

// PUBLIC_INTERFACE
export default function LineChart({ title, series, height = 176, accent = "blue" }: LineChartProps) {
  /** Minimal SVG line chart (no external chart deps) for time-series analytics. */
  const w = 640;
  const h = height;

  const max = Math.max(1, ...series.map((p) => p.y));
  const min = Math.min(0, ...series.map((p) => p.y));
  const range = Math.max(1, max - min);

  const paddingX = 20;
  const paddingY = 18;

  const innerW = w - paddingX * 2;
  const innerH = h - paddingY * 2;

  const toX = (idx: number) => (series.length <= 1 ? paddingX : paddingX + (idx / (series.length - 1)) * innerW);
  const toY = (y: number) => paddingY + innerH - ((y - min) / range) * innerH;

  const path = series
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${toX(idx).toFixed(2)} ${toY(p.y).toFixed(2)}`)
    .join(" ");

  const stroke = accent === "cyan" ? "#06b6d4" : "#3b82f6";
  const fill = accent === "cyan" ? "rgba(6, 182, 212, 0.12)" : "rgba(59, 130, 246, 0.12)";
  const areaPath = `${path} L ${toX(series.length - 1).toFixed(2)} ${(paddingY + innerH).toFixed(
    2
  )} L ${toX(0).toFixed(2)} ${(paddingY + innerH).toFixed(2)} Z`;

  const last = series.at(-1);
  const first = series.at(0);
  const labelLeft = first?.xLabel ?? "";
  const labelRight = last?.xLabel ?? "";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <div className="text-xs text-slate-500">{series.length ? `${labelLeft} → ${labelRight}` : "No data"}</div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} className="min-w-[560px]" role="img" aria-label={title}>
          <rect x="0" y="0" width={w} height={h} rx="12" fill="#f8fafc" />
          {/* baseline grid */}
          <line x1={paddingX} y1={paddingY + innerH} x2={paddingX + innerW} y2={paddingY + innerH} stroke="#e2e8f0" />
          <line x1={paddingX} y1={paddingY} x2={paddingX} y2={paddingY + innerH} stroke="#e2e8f0" />

          {series.length ? (
            <>
              <path d={areaPath} fill={fill} />
              <path d={path} fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {/* last point */}
              <circle
                cx={toX(series.length - 1)}
                cy={toY(series[series.length - 1].y)}
                r="4.5"
                fill={stroke}
              />
            </>
          ) : null}
        </svg>
      </div>
    </section>
  );
}
