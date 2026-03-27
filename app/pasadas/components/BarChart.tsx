export function BarChart({
  title,
  data,
  barColor,
  fmt,
}: {
  title: string;
  data: [string, { count: number; total: number }][];
  barColor: string;
  fmt: (n: number) => string;
}) {
  const maxTotal = Math.max(...data.map(([, v]) => v.total));

  return (
    <div className="bg-bg-surface rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold text-text-primary mb-4">{title}</h2>
      <div className="space-y-3">
        {data.map(([label, d]) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary font-medium">{label}</span>
              <span className="text-text-muted">
                {d.count} pasada{d.count > 1 && "s"} &middot; {fmt(d.total)}
              </span>
            </div>
            <div className="w-full bg-bar-bg rounded-full h-3">
              <div
                className={`${barColor} h-3 rounded-full transition-all`}
                style={{ width: `${(d.total / maxTotal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
