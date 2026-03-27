import type { Factura } from "@/types";

export function FacturaActions({
  factura,
  onDownload,
  onVerPasadas,
}: {
  factura: Factura;
  onDownload: (url: string, filename: string) => void;
  onVerPasadas: (f: Factura) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {factura.url_factura && (
        <button
          onClick={() =>
            onDownload(factura.url_factura!, `factura-${factura.comprobante}.pdf`)
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-bg-accent-blue text-text-accent-blue rounded-lg hover:bg-bg-accent-blue/80 transition cursor-pointer"
          title="Descargar factura PDF"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          PDF
        </button>
      )}
      {factura.url_pasadas && (
        <button
          onClick={() => onVerPasadas(factura)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-bg-accent-purple text-text-accent-purple rounded-lg hover:bg-bg-accent-purple/80 transition cursor-pointer"
          title="Ver detalle de pasadas"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Pasadas
        </button>
      )}
    </div>
  );
}
