import type { PasadasStats } from "@/types";

export function StatsCards({
  total,
  stats,
  fmt,
}: {
  total: number;
  stats: PasadasStats;
  fmt: (n: number) => string;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-bg-surface rounded-xl shadow-md p-5">
        <p className="text-sm text-text-muted">Total pasadas</p>
        <p className="text-2xl font-bold text-text-primary mt-1">{total}</p>
      </div>
      <div className="bg-bg-surface rounded-xl shadow-md p-5">
        <p className="text-sm text-text-muted">Total tarifas</p>
        <p className="text-2xl font-bold text-text-primary mt-1">{fmt(stats.totalTarifa)}</p>
      </div>
      <div className="bg-bg-surface rounded-xl shadow-md p-5">
        <p className="text-sm text-text-muted">Promedio por pasada</p>
        <p className="text-2xl font-bold text-text-primary mt-1">{fmt(stats.avgTarifa)}</p>
      </div>
    </div>
  );
}
