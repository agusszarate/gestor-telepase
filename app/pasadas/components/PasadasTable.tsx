import type { Pasada } from "@/types";

export function PasadasTable({
  pasadas,
  fmt,
}: {
  pasadas: Pasada[];
  fmt: (n: number) => string;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-bg-muted border-b border-border">
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Fecha</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Hora</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Estacion</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Via</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Patente</th>
            <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Cat.</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase">Tarifa</th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase">Bonif.</th>
          </tr>
        </thead>
        <tbody>
          {pasadas.map((p, i) => (
            <tr key={i} className="border-b border-border-subtle hover:bg-bg-surface-hover transition">
              <td className="px-6 py-3 text-sm text-text-primary">{p.fecha}</td>
              <td className="px-6 py-3 text-sm text-text-secondary font-mono">
                {p.hora}
                {p.horaPico && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-bg-warning text-text-warning">
                    H.PICO
                  </span>
                )}
              </td>
              <td className="px-6 py-3 text-sm text-text-secondary">{p.estacionNombre}</td>
              <td className="px-6 py-3 text-sm text-text-secondary">{p.via}</td>
              <td className="px-6 py-3 text-sm text-text-secondary font-mono">{p.patente}</td>
              <td className="px-6 py-3 text-sm text-text-secondary">{p.categoria}</td>
              <td className="px-6 py-3 text-sm text-text-primary font-semibold text-right">{fmt(p.tarifa)}</td>
              <td className="px-6 py-3 text-sm text-text-muted text-right">{fmt(p.bonificacion)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
