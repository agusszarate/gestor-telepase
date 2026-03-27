"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { Pasada, PasadasStats } from "@/types";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { ErrorState } from "@/app/components/ui/ErrorState";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { PasadasHeader } from "./components/PasadasHeader";
import { StatsCards } from "./components/StatsCards";
import { HoraPicoBreakdown } from "./components/HoraPicoBreakdown";
import { BarChart } from "./components/BarChart";
import { PasadasTable } from "./components/PasadasTable";
import { PasadasMobileList } from "./components/PasadasMobileList";

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

  const stats: PasadasStats | null = useMemo(() => {
    if (pasadas.length === 0) return null;

    const totalTarifa = pasadas.reduce((sum, p) => sum + p.tarifa, 0);
    const totalBonificacion = pasadas.reduce((sum, p) => sum + p.bonificacion, 0);

    const porEstacion = new Map<string, { count: number; total: number }>();
    pasadas.forEach((p) => {
      const existing = porEstacion.get(p.estacionNombre) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.tarifa;
      porEstacion.set(p.estacionNombre, existing);
    });

    const porFecha = new Map<string, { count: number; total: number }>();
    pasadas.forEach((p) => {
      const existing = porFecha.get(p.fecha) || { count: 0, total: 0 };
      existing.count++;
      existing.total += p.tarifa;
      porFecha.set(p.fecha, existing);
    });

    const fechasSorted = Array.from(porFecha.entries()).sort(([a], [b]) => a.localeCompare(b));
    const maxTarifa = Math.max(...pasadas.map((p) => p.tarifa));
    const avgTarifa = totalTarifa / pasadas.length;

    const pasadasHoraPico = pasadas.filter((p) => p.horaPico);
    const totalHoraPico = pasadasHoraPico.reduce((sum, p) => sum + p.tarifa, 0);
    const pasadasNormal = pasadas.filter((p) => !p.horaPico);
    const totalNormal = pasadasNormal.reduce((sum, p) => sum + p.tarifa, 0);

    const estacionesSorted = Array.from(porEstacion.entries()).sort(([, a], [, b]) => b.total - a.total);
    const maxEstacionTotal = Math.max(...estacionesSorted.map(([, v]) => v.total));

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

  const fmt = useCallback(
    (n: number) =>
      n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }),
    []
  );

  if (loading) return <LoadingSpinner message="Cargando pasadas..." />;
  if (error) return <ErrorState message={error} actionLabel="Volver a facturas" onAction={() => router.push("/facturas")} />;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PasadasHeader
          periodo={periodo}
          comprobante={comprobante}
          urlFactura={urlFactura}
          url={url}
          onBack={() => router.push("/facturas")}
        />

        {stats && (
          <>
            <StatsCards total={pasadas.length} stats={stats} fmt={fmt} />
            <HoraPicoBreakdown stats={stats} fmt={fmt} />

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <BarChart
                title="Por estacion"
                data={stats.estacionesSorted}
                barColor="bg-blue-500"
                fmt={fmt}
              />
              <BarChart
                title="Por fecha"
                data={stats.fechasSorted}
                barColor="bg-green-500"
                fmt={fmt}
              />
            </div>
          </>
        )}

        <div className="bg-bg-surface rounded-xl shadow-md overflow-hidden">
          <h2 className="text-lg font-semibold text-text-primary px-6 pt-5 pb-3">
            Todas las pasadas
          </h2>
          <PasadasTable pasadas={pasadas} fmt={fmt} />
          <PasadasMobileList pasadas={pasadas} fmt={fmt} />
        </div>

        {pasadas.length === 0 && <EmptyState message="No se encontraron pasadas" />}
      </div>
    </div>
  );
}

export default function PasadasPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Cargando..." />}>
      <PasadasDashboard />
    </Suspense>
  );
}
