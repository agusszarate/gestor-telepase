"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Factura {
  periodo: string;
  concesionario: string;
  comprobante: string;
  vencimiento: string;
  monto: string;
  url_factura?: string;
  url_pasadas?: string;
  pagada?: boolean;
  pagadaAt?: string;
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTodas, setLoadingTodas] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchFacturas() {
      try {
        const res = await fetch("/api/facturas");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al cargar facturas");
          return;
        }
        const data = await res.json();
        setFacturas(data);
      } catch {
        setError("Error de conexion");
      } finally {
        setLoading(false);
      }
    }
    fetchFacturas();
  }, [router]);

  function handleDownload(url: string, filename: string) {
    const downloadUrl = `/api/descargar?url=${encodeURIComponent(url)}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    a.click();
  }

  function handleVerPasadas(f: Factura) {
    if (!f.url_pasadas) return;
    const params = new URLSearchParams({
      url: f.url_pasadas,
      comprobante: f.comprobante,
      periodo: f.periodo,
    });
    if (f.url_factura) params.set("url_factura", f.url_factura);
    router.push(`/pasadas?${params.toString()}`);
  }

  async function togglePagada(f: Factura) {
    const newState = !f.pagada;
    try {
      const res = await fetch("/api/facturas/pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprobante: f.comprobante, pagada: newState }),
      });
      if (res.ok) {
        setFacturas((prev) =>
          prev.map((fac) =>
            fac.comprobante === f.comprobante
              ? { ...fac, pagada: newState, pagadaAt: newState ? new Date().toISOString() : undefined }
              : fac
          )
        );
      }
    } catch {
      // silently fail
    }
  }

  async function fetchTodas() {
    setLoadingTodas(true);
    try {
      const res = await fetch("/api/facturas/todas");
      if (res.status === 401) {
        router.push("/");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFacturas(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingTodas(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl max-w-md text-center">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-red-500 underline cursor-pointer"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  const pagadas = facturas.filter((f) => f.pagada);
  const pendientes = facturas.filter((f) => !f.pagada);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Facturas</h1>
            <p className="text-gray-500 mt-1">
              {pendientes.length} pendiente{pendientes.length !== 1 && "s"}
              {pagadas.length > 0 && (
                <span>
                  {" "}&middot; {pagadas.length} pagada
                  {pagadas.length !== 1 && "s"}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTodas}
              disabled={loadingTodas}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition cursor-pointer disabled:opacity-50"
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
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cerrar sesion
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-center px-4 py-4 text-sm font-semibold text-gray-600">
                  Estado
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Periodo
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Concesionario
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Comprobante
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Vencimiento
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  Monto
                </th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f, i) => (
                <tr
                  key={i}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition ${f.pagada ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => togglePagada(f)}
                      className={`w-6 h-6 rounded-md border-2 inline-flex items-center justify-center cursor-pointer transition ${
                        f.pagada
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                      title={f.pagada ? "Marcar como pendiente" : "Marcar como pagada"}
                    >
                      {f.pagada && (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {f.periodo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {f.concesionario}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {f.comprobante}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-pre-line">
                    {f.vencimiento}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right whitespace-pre-line">
                    {f.pagada ? (
                      <span className="line-through text-gray-400">
                        {f.monto}
                      </span>
                    ) : (
                      f.monto
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {f.url_factura && (
                        <button
                          onClick={() =>
                            handleDownload(
                              f.url_factura!,
                              `factura-${f.comprobante}.pdf`
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition cursor-pointer"
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
                      {f.url_pasadas && (
                        <button
                          onClick={() => handleVerPasadas(f)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition cursor-pointer"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {facturas.map((f, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl shadow-md p-5 ${f.pagada ? "opacity-60" : ""}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePagada(f)}
                    className={`w-6 h-6 rounded-md border-2 inline-flex items-center justify-center cursor-pointer transition shrink-0 ${
                      f.pagada
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                  >
                    {f.pagada && (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p className="font-semibold text-gray-900">{f.periodo}</p>
                    <p className="text-sm text-gray-500">{f.concesionario}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold text-right whitespace-pre-line ${f.pagada ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {f.monto}
                </p>
              </div>
              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <p>
                  <span className="font-medium text-gray-600">
                    Comprobante:
                  </span>{" "}
                  <span className="font-mono">{f.comprobante}</span>
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    Vencimiento:
                  </span>{" "}
                  <span className="whitespace-pre-line">{f.vencimiento}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {f.url_factura && (
                  <button
                    onClick={() =>
                      handleDownload(
                        f.url_factura!,
                        `factura-${f.comprobante}.pdf`
                      )
                    }
                    className="flex-1 text-center px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                  >
                    Factura PDF
                  </button>
                )}
                {f.url_pasadas && (
                  <button
                    onClick={() => handleVerPasadas(f)}
                    className="flex-1 text-center px-3 py-2 text-sm font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition cursor-pointer"
                  >
                    Ver Pasadas
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {facturas.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No se encontraron facturas
          </div>
        )}
      </div>
    </div>
  );
}
