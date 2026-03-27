import type { PasadasStats } from "@/types";

export function HoraPicoBreakdown({
  stats,
  fmt,
}: {
  stats: PasadasStats;
  fmt: (n: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-bg-warning border border-border-warning rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
          <p className="text-sm font-medium text-text-warning">Hora pico</p>
          <span className="text-xs text-text-warning/70 ml-auto">L-V 7-11h / 16-20h</span>
        </div>
        <p className="text-2xl font-bold text-text-primary mt-1">{fmt(stats.totalHoraPico)}</p>
        <p className="text-sm text-text-muted mt-1">
          {stats.pasadasHoraPico} pasada{stats.pasadasHoraPico !== 1 && "s"}
        </p>
      </div>
      <div className="bg-bg-info border border-border-info rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500" />
          <p className="text-sm font-medium text-text-info">Fuera de hora pico</p>
        </div>
        <p className="text-2xl font-bold text-text-primary mt-1">{fmt(stats.totalNormal)}</p>
        <p className="text-sm text-text-muted mt-1">
          {stats.pasadasNormal} pasada{stats.pasadasNormal !== 1 && "s"}
        </p>
      </div>
    </div>
  );
}
