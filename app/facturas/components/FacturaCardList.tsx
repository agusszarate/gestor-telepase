import type { Factura } from "@/types";
import { PagadaCheckbox } from "@/app/components/ui/PagadaCheckbox";

export function FacturaCardList({
  facturas,
  onTogglePagada,
  onDownload,
  onVerPasadas,
}: {
  facturas: Factura[];
  onTogglePagada: (f: Factura) => void;
  onDownload: (url: string, filename: string) => void;
  onVerPasadas: (f: Factura) => void;
}) {
  return (
    <div className="md:hidden space-y-4">
      {facturas.map((f, i) => (
        <div
          key={i}
          className={`bg-bg-surface rounded-xl shadow-md p-5 ${f.pagada ? "opacity-60" : ""}`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <PagadaCheckbox
                checked={!!f.pagada}
                onChange={() => onTogglePagada(f)}
              />
              <div>
                <p className="font-semibold text-text-primary">{f.periodo}</p>
                <p className="text-sm text-text-muted">{f.concesionario}</p>
              </div>
            </div>
            <p className={`text-lg font-bold text-right whitespace-pre-line ${f.pagada ? "text-text-faint line-through" : "text-text-primary"}`}>
              {f.monto}
            </p>
          </div>
          <div className="text-sm text-text-muted space-y-1 mb-4">
            <p>
              <span className="font-medium text-text-secondary">Comprobante:</span>{" "}
              <span className="font-mono">{f.comprobante}</span>
            </p>
            <p>
              <span className="font-medium text-text-secondary">Vencimiento:</span>{" "}
              <span className="whitespace-pre-line">{f.vencimiento}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {f.url_factura && (
              <button
                onClick={() => onDownload(f.url_factura!, `factura-${f.comprobante}.pdf`)}
                className="flex-1 text-center px-3 py-2 text-sm font-medium bg-bg-accent-blue text-text-accent-blue rounded-lg hover:bg-bg-accent-blue/80 transition cursor-pointer"
              >
                Factura PDF
              </button>
            )}
            {f.url_pasadas && (
              <button
                onClick={() => onVerPasadas(f)}
                className="flex-1 text-center px-3 py-2 text-sm font-medium bg-bg-accent-purple text-text-accent-purple rounded-lg hover:bg-bg-accent-purple/80 transition cursor-pointer"
              >
                Ver Pasadas
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
