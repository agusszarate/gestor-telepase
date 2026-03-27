export function PasadasHeader({
  periodo,
  comprobante,
  urlFactura,
  url,
  onBack,
}: {
  periodo: string;
  comprobante: string;
  urlFactura: string;
  url: string | null;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <button
          onClick={onBack}
          className="text-sm text-text-accent-blue hover:text-text-accent-blue/80 cursor-pointer mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a facturas
        </button>
        <h1 className="text-3xl font-bold text-text-primary">Detalle de Pasadas</h1>
        {(periodo || comprobante) && (
          <p className="text-text-muted mt-1">
            {periodo && <span>{periodo}</span>}
            {periodo && comprobante && <span> &middot; </span>}
            {comprobante && <span className="font-mono">#{comprobante}</span>}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {urlFactura && (
          <a
            href={`/api/descargar?url=${encodeURIComponent(urlFactura)}`}
            download={`factura-${comprobante || "export"}.pdf`}
            className="text-sm px-4 py-2 bg-bg-accent-blue text-text-accent-blue rounded-lg hover:bg-bg-accent-blue/80 transition cursor-pointer font-medium"
          >
            Factura PDF
          </a>
        )}
        {url && (
          <a
            href={`/api/descargar?url=${encodeURIComponent(url)}`}
            download={`pasadas-${comprobante || "export"}.csv`}
            className="text-sm px-4 py-2 bg-bg-accent-green text-text-accent-green rounded-lg hover:bg-bg-accent-green/80 transition cursor-pointer font-medium"
          >
            Descargar CSV
          </a>
        )}
      </div>
    </div>
  );
}
