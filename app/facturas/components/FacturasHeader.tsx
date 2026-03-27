export function FacturasHeader({
  pendientes,
  pagadas,
  loadingTodas,
  onFetchTodas,
  onLogout,
}: {
  pendientes: number;
  pagadas: number;
  loadingTodas: boolean;
  onFetchTodas: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Mis Facturas</h1>
        <p className="text-text-muted mt-1">
          {pendientes} pendiente{pendientes !== 1 && "s"}
          {pagadas > 0 && (
            <span>
              {" "}&middot; {pagadas} pagada
              {pagadas !== 1 && "s"}
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onFetchTodas}
          disabled={loadingTodas}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bg-accent-amber text-text-accent-amber rounded-lg hover:bg-bg-accent-amber/80 transition cursor-pointer disabled:opacity-50"
        >
          {loadingTodas ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              Buscando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Obtener historial completo
            </>
          )}
        </button>
        <button
          onClick={onLogout}
          className="text-sm text-text-muted hover:text-text-secondary cursor-pointer"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
