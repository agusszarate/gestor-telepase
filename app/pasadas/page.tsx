"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Pasada {
  fecha: string;
  hora: string;
  estacion: string;
  estacionNombre: string;
  horaPico: boolean;
  via: string;
  dispositivo: string;
  patente: string;
  categoria: string;
  tarifa: number;
  bonificacion: number;
}

function PasadasDashboard() {
  const [pasadas, setPasadas] = useState<Pasada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const comprobante = searchParams.get("comprobante") || "";
  const periodo = searchParams.get("periodo") || "";
  const urlFactura = searchParams.get("url_factura") || "";

  useEffect(() => {
    if (!url) {
      setError("URL de pasadas no proporcionada");
      setLoading(false);
      return;
    }
    async function fetchPasadas() {
      try {
        const params = new URLSearchParams({ url: url! });
        if (comprobante) params.set("comprobante", comprobante);
        const res = await fetch(`/api/pasadas?${params.toString()}`);
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al cargar pasadas");
          return;
        }
        const data: Pasada[] = await res.json();
        data.sort((a, b) => {
          const cmp = b.fecha.localeCompare(a.fecha);
          return cmp !== 0 ? cmp : b.hora.localeCompare(a.hora);
        });
        setPasadas(data);
      } catch {
        setError("Error de conexion");
      } finally {
        setLoading(false);
      }
    }
    fetchPasadas();
  }, [url, router]);

  const stats = useMemo(() => {
    if (pasadas.length === 0) return null;

    const totalTarifa = pasadas.reduce((sum, p) => sum + p.tarifa, 0);
    const totalBonificacion = pasadas.reduce(
      (sum, p) => sum + p.bonificacion,
      0
    );

    // Group by estacion nombre
    const porEstacion = new Map<string, { count: number; total: number }>();
    pasadas.forEach((p) => {
      const key = p.estacionNombre;
      const existing = porEstacion.get(key) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.tarifa;
      porEstacion.set(key, existing);
    });

    // Group by fecha
    const porFecha = new Map<string, { count: number; total: number }>();
    pasadas.forEach((p) => {
      const existing = porFecha.get(p.fecha) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.tarifa;
      porFecha.set(p.fecha, existing);
    });

    // Sort by date
    const fechasSorted = Array.from(porFecha.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    // Max tarifa single pass
    const maxTarifa = Math.max(...pasadas.map((p) => p.tarifa));
    const avgTarifa = totalTarifa / pasadas.length;

    // Hora pico stats
    const pasadasHoraPico = pasadas.filter((p) => p.horaPico);
    const totalHoraPico = pasadasHoraPico.reduce(
      (sum, p) => sum + p.tarifa,
      0
    );
    const pasadasNormal = pasadas.filter((p) => !p.horaPico);
    const totalNormal = pasadasNormal.reduce((sum, p) => sum + p.tarifa, 0);

    // Estaciones sorted by total
    const estacionesSorted = Array.from(porEstacion.entries()).sort(
      ([, a], [, b]) => b.total - a.total
    );

    // Max bar value for estaciones chart
    const maxEstacionTotal = Math.max(
      ...estacionesSorted.map(([, v]) => v.total)
    );

    return {
      totalTarifa,
      totalBonificacion,
      maxTarifa,
      avgTarifa,
      pasadasHoraPico: pasadasHoraPico.length,
      totalHoraPico,
      pasadasNormal: pasadasNormal.length,
      totalNormal,
      estacionesSorted,
      maxEstacionTotal,
      fechasSorted,
    };
  }, [pasadas]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-text-secondary">Cargando pasadas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-bg-error text-text-error px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => router.push("/facturas")}
            className="mt-4 text-sm text-text-error underline cursor-pointer"
          >
            Volver a facturas
          </button>
        </div>
      </div>
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.push("/facturas")}
              className="text-sm text-text-accent-blue hover:text-text-accent-blue/80 cursor-pointer mb-2 inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver a facturas
            </button>
            <h1 className="text-3xl font-bold text-text-primary">
              Detalle de Pasadas
            </h1>
            {(periodo || comprobante) && (
              <p className="text-text-muted mt-1">
                {periodo && <span>{periodo}</span>}
                {periodo && comprobante && <span> &middot; </span>}
                {comprobante && (
                  <span className="font-mono">#{comprobante}</span>
                )}
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

        {stats && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-surface rounded-xl shadow-md p-5">
                <p className="text-sm text-text-muted">Total pasadas</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {pasadas.length}
                </p>
              </div>
              <div className="bg-bg-surface rounded-xl shadow-md p-5">
                <p className="text-sm text-text-muted">Total tarifas</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {fmt(stats.totalTarifa)}
                </p>
              </div>
              <div className="bg-bg-surface rounded-xl shadow-md p-5">
                <p className="text-sm text-text-muted">Promedio por pasada</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {fmt(stats.avgTarifa)}
                </p>
              </div>
            </div>

            {/* Hora pico breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-bg-warning border border-border-warning rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <p className="text-sm font-medium text-text-warning">
                    Hora pico
                  </p>
                  <span className="text-xs text-text-warning/70 ml-auto">
                    L-V 7-11h / 16-20h
                  </span>
                </div>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {fmt(stats.totalHoraPico)}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  {stats.pasadasHoraPico} pasada
                  {stats.pasadasHoraPico !== 1 && "s"}
                </p>
              </div>
              <div className="bg-bg-info border border-border-info rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <p className="text-sm font-medium text-text-info">
                    Fuera de hora pico
                  </p>
                </div>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {fmt(stats.totalNormal)}
                </p>
                <p className="text-sm text-text-muted mt-1">
                  {stats.pasadasNormal} pasada
                  {stats.pasadasNormal !== 1 && "s"}
                </p>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* By estacion */}
              <div className="bg-bg-surface rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Por estacion
                </h2>
                <div className="space-y-3">
                  {stats.estacionesSorted.map(([estacion, data]) => (
                    <div key={estacion}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary font-medium">
                          {estacion}
                        </span>
                        <span className="text-text-muted">
                          {data.count} pasada{data.count > 1 && "s"} &middot;{" "}
                          {fmt(data.total)}
                        </span>
                      </div>
                      <div className="w-full bg-bar-bg rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${(data.total / stats.maxEstacionTotal) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By date */}
              <div className="bg-bg-surface rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">
                  Por fecha
                </h2>
                <div className="space-y-3">
                  {stats.fechasSorted.map(([fecha, data]) => {
                    const maxFechaTotal = Math.max(
                      ...stats.fechasSorted.map(([, v]) => v.total)
                    );
                    return (
                      <div key={fecha}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-secondary font-medium">
                            {fecha}
                          </span>
                          <span className="text-text-muted">
                            {data.count} pasada{data.count > 1 && "s"} &middot;{" "}
                            {fmt(data.total)}
                          </span>
                        </div>
                        <div className="w-full bg-bar-bg rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full transition-all"
                            style={{
                              width: `${(data.total / maxFechaTotal) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Table */}
        <div className="bg-bg-surface rounded-xl shadow-md overflow-hidden">
          <h2 className="text-lg font-semibold text-text-primary px-6 pt-5 pb-3">
            Todas las pasadas
          </h2>

          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-muted border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Fecha
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Hora
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Estacion
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Via
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Patente
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Cat.
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Tarifa
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase">
                    Bonif.
                  </th>
                </tr>
              </thead>
              <tbody>
                {pasadas.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-border-subtle hover:bg-bg-surface-hover transition"
                  >
                    <td className="px-6 py-3 text-sm text-text-primary">
                      {p.fecha}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary font-mono">
                      {p.hora}
                      {p.horaPico && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-bg-warning text-text-warning">
                          H.PICO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary">
                      {p.estacionNombre}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary">
                      {p.via}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary font-mono">
                      {p.patente}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-secondary">
                      {p.categoria}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-primary font-semibold text-right">
                      {fmt(p.tarifa)}
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted text-right">
                      {fmt(p.bonificacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-border-subtle">
            {pasadas.map((p, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {p.fecha}{" "}
                      <span className="font-mono text-text-muted">
                        {p.hora}
                      </span>
                      {p.horaPico && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-bg-warning text-text-warning">
                          H.PICO
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {p.estacionNombre} &middot; Via {p.via} &middot;{" "}
                      {p.patente}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-text-primary">
                    {fmt(p.tarifa)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {pasadas.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            No se encontraron pasadas
          </div>
        )}
      </div>
    </div>
  );
}

export default function PasadasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-text-secondary">Cargando...</p>
          </div>
        </div>
      }
    >
      <PasadasDashboard />
    </Suspense>
  );
}
