import type { Factura } from "@/types";
import { PagadaCheckbox } from "@/app/components/ui/PagadaCheckbox";
import { FacturaActions } from "./FacturaActions";

export function FacturaTable({
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
    <div className="hidden md:block bg-bg-surface rounded-2xl shadow-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-bg-muted border-b border-border">
            <th className="text-center px-4 py-4 text-sm font-semibold text-text-muted">Estado</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-text-muted">Periodo</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-text-muted">Concesionario</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-text-muted">Comprobante</th>
            <th className="text-left px-6 py-4 text-sm font-semibold text-text-muted">Vencimiento</th>
            <th className="text-right px-6 py-4 text-sm font-semibold text-text-muted">Monto</th>
            <th className="text-center px-6 py-4 text-sm font-semibold text-text-muted">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {facturas.map((f, i) => (
            <tr
              key={i}
              className={`border-b border-border-subtle hover:bg-bg-surface-hover transition ${f.pagada ? "opacity-60" : ""}`}
            >
              <td className="px-4 py-4 text-center">
                <PagadaCheckbox
                  checked={!!f.pagada}
                  onChange={() => onTogglePagada(f)}
                  title={f.pagada ? "Marcar como pendiente" : "Marcar como pagada"}
                />
              </td>
              <td className="px-6 py-4 text-sm text-text-primary">{f.periodo}</td>
              <td className="px-6 py-4 text-sm text-text-secondary">{f.concesionario}</td>
              <td className="px-6 py-4 text-sm text-text-secondary font-mono">{f.comprobante}</td>
              <td className="px-6 py-4 text-sm text-text-secondary whitespace-pre-line">{f.vencimiento}</td>
              <td className="px-6 py-4 text-sm text-text-primary font-semibold text-right whitespace-pre-line">
                {f.pagada ? (
                  <span className="line-through text-text-faint">{f.monto}</span>
                ) : (
                  f.monto
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <FacturaActions
                  factura={f}
                  onDownload={onDownload}
                  onVerPasadas={onVerPasadas}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
