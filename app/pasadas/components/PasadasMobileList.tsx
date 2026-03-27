import type { Pasada } from "@/types";

export function PasadasMobileList({
  pasadas,
  fmt,
}: {
  pasadas: Pasada[];
  fmt: (n: number) => string;
}) {
  return (
    <div className="md:hidden divide-y divide-border-subtle">
      {pasadas.map((p, i) => (
        <div key={i} className="px-5 py-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {p.fecha}{" "}
                <span className="font-mono text-text-muted">{p.hora}</span>
                {p.horaPico && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-bg-warning text-text-warning">
                    H.PICO
                  </span>
                )}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {p.estacionNombre} &middot; Via {p.via} &middot; {p.patente}
              </p>
            </div>
            <p className="text-sm font-bold text-text-primary">{fmt(p.tarifa)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
