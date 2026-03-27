"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Factura } from "@/types";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { ErrorState } from "@/app/components/ui/ErrorState";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { FacturasHeader } from "./components/FacturasHeader";
import { FacturaTable } from "./components/FacturaTable";
import { FacturaCardList } from "./components/FacturaCardList";

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

  if (loading) return <LoadingSpinner message="Cargando facturas..." />;
  if (error) return <ErrorState message={error} actionLabel="Volver al login" onAction={() => router.push("/")} />;

  const pagadas = facturas.filter((f) => f.pagada);
  const pendientes = facturas.filter((f) => !f.pagada);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <FacturasHeader
          pendientes={pendientes.length}
          pagadas={pagadas.length}
          loadingTodas={loadingTodas}
          onFetchTodas={fetchTodas}
          onLogout={() => router.push("/")}
        />

        <FacturaTable
          facturas={facturas}
          onTogglePagada={togglePagada}
          onDownload={handleDownload}
          onVerPasadas={handleVerPasadas}
        />

        <FacturaCardList
          facturas={facturas}
          onTogglePagada={togglePagada}
          onDownload={handleDownload}
          onVerPasadas={handleVerPasadas}
        />

        {facturas.length === 0 && <EmptyState message="No se encontraron facturas" />}
      </div>
    </div>
  );
}
