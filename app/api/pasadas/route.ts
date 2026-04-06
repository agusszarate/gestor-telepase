import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { descargar } from "@/lib/telepase";
import { getSessionCookies } from "@/lib/session";
import { prisma } from "@/lib/db";
import { lookupEstaciones, discoverEstaciones, cleanStationName, type StationInfo } from "@/lib/estaciones";

export interface Pasada {
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

type Concesionario = "AUBASA" | "CORREDORES_VIALES" | "AUTOPISTAS_DEL_SOL";

function parseHoraCompacta(raw: string): string {
  const padded = raw.padStart(6, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
}

function normalizeHora(raw: string): string {
  return raw.includes(":") ? raw : parseHoraCompacta(raw);
}

function isCodigoEstacion(estacion: string): boolean {
  return /^\d{4}$/.test(estacion);
}

function limpiarNombreEstacion(raw: string): string {
  return raw.replace(/\s+(ASCENDENTE|DESCENDENTE)$/i, "");
}

function extraerSentido(raw: string): string | undefined {
  const match = raw.match(/\s+(ASCENDENTE|DESCENDENTE)$/i);
  return match ? match[1].toUpperCase() : undefined;
}

// AUBASA: L-V 7-10h y 17-20h
// CORREDORES VIALES (Riccheri) y AUTOPISTAS DEL SOL:
//   L-V 7-11h y 16-20h
//   S-D-Feriados: 11-15h ascendente (→prov) y 17-21h descendente (→CABA)
function esHoraPico(fecha: string, hora: string, concesionario: Concesionario | undefined, sentido?: string): boolean {
  const dt = DateTime.fromISO(`${fecha}T${hora}`, {
    zone: "America/Argentina/Buenos_Aires",
  });
  const dow = dt.weekday;
  const h = dt.hour;

  if (concesionario === "CORREDORES_VIALES" || concesionario === "AUTOPISTAS_DEL_SOL") {
    if (dow <= 5) {
      return (h >= 7 && h < 11) || (h >= 16 && h < 20);
    }
    if (sentido === "ASCENDENTE") {
      return h >= 11 && h < 15;
    }
    if (sentido === "DESCENDENTE") {
      return h >= 17 && h < 21;
    }
    return (h >= 11 && h < 15) || (h >= 17 && h < 21);
  }

  if (dow > 5) return false;
  return (h >= 7 && h < 10) || (h >= 17 && h < 20);
}

interface RawPasada {
  fecha: string;
  hora: string;
  estacion: string;
  sentido?: string;
  via: string;
  dispositivo: string;
  patente: string;
  categoria: string;
  tarifa: number;
  bonificacion: number;
}

function parseCsvRaw(csv: string): RawPasada[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(";");
    const estacionRaw = cols[2];

    let estacion: string;
    let sentido: string | undefined;

    if (isCodigoEstacion(estacionRaw)) {
      estacion = estacionRaw;
    } else {
      estacion = estacionRaw;
      sentido = extraerSentido(estacionRaw);
    }

    return {
      fecha: cols[0],
      hora: normalizeHora(cols[1]),
      estacion,
      sentido,
      via: cols[3],
      dispositivo: cols[4],
      patente: cols[5],
      categoria: cols[6],
      tarifa: parseFloat(cols[7]) || 0,
      bonificacion: parseFloat(cols[8]) || 0,
    };
  });
}

function resolvePasadas(
  rawPasadas: RawPasada[],
  stationMap: Map<string, StationInfo>,
  fallbackConcesionario?: string,
): Pasada[] {
  return rawPasadas.map((raw) => {
    let estacionNombre: string;
    let concesionario: Concesionario | undefined;

    if (isCodigoEstacion(raw.estacion)) {
      const info = stationMap.get(raw.estacion);
      estacionNombre = info?.nombre || `Estacion ${raw.estacion}`;
      concesionario = (info?.concesionario || fallbackConcesionario) as Concesionario | undefined;
    } else {
      estacionNombre = limpiarNombreEstacion(raw.estacion);
      concesionario = "AUTOPISTAS_DEL_SOL";
    }

    return {
      fecha: raw.fecha,
      hora: raw.hora,
      estacion: raw.estacion,
      estacionNombre,
      horaPico: esHoraPico(raw.fecha, raw.hora, concesionario, raw.sentido),
      via: raw.via,
      dispositivo: raw.dispositivo,
      patente: raw.patente,
      categoria: raw.categoria,
      tarifa: raw.tarifa,
      bonificacion: raw.bonificacion,
    };
  });
}

function buildCsvGroups(rawPasadas: RawPasada[]): Map<string, { count: number; total: number }> {
  const groups = new Map<string, { count: number; total: number }>();
  for (const p of rawPasadas) {
    if (!isCodigoEstacion(p.estacion)) continue;
    const existing = groups.get(p.estacion) || { count: 0, total: 0 };
    existing.count++;
    existing.total += p.tarifa;
    groups.set(p.estacion, existing);
  }
  return groups;
}

export async function GET(request: NextRequest) {
  const session = await getSessionCookies();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "telepase.com.ar") {
      return NextResponse.json({ error: "URL no permitida" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "URL invalida" }, { status: 400 });
  }

  try {
    const response = await descargar(url, session.cookies);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al descargar pasadas" },
        { status: response.status }
      );
    }

    const csv = await response.text();
    const rawPasadas = parseCsvRaw(csv);

    // Collect numeric station codes and look them up in DB
    const codesInCsv = [...new Set(
      rawPasadas.filter((p) => isCodigoEstacion(p.estacion)).map((p) => p.estacion)
    )];
    const stationMap = await lookupEstaciones(codesInCsv);

    // Find unknown codes
    const unknownCodes = codesInCsv.filter((c) => !stationMap.has(c));

    // Attempt auto-discovery if there are unknowns
    const comprobante = request.nextUrl.searchParams.get("comprobante");
    if (unknownCodes.length > 0 && comprobante) {
      const factura = await prisma.factura.findUnique({
        where: { comprobante_userEmail: { comprobante, userEmail: session.email } },
      });
      if (factura?.urlFactura) {
        const csvGroups = buildCsvGroups(rawPasadas);
        const discovered = await discoverEstaciones({
          csvGroups,
          unknownCodes,
          facturaUrl: factura.urlFactura,
          cookies: session.cookies,
          concesionario: factura.concesionario,
          comprobante,
        });
        // Merge discoveries into stationMap
        for (const [code, rawName] of discovered) {
          stationMap.set(code, {
            nombre: cleanStationName(rawName),
            concesionario: factura.concesionario,
          });
        }
      }
    }

    // Resolve names and hora pico
    const factura = comprobante
      ? await prisma.factura.findUnique({
          where: { comprobante_userEmail: { comprobante, userEmail: session.email } },
        })
      : null;
    const pasadas = resolvePasadas(rawPasadas, stationMap, factura?.concesionario);

    // Persist to DB if comprobante is provided
    if (comprobante && factura) {
      for (const p of pasadas) {
        await prisma.pasada.upsert({
          where: {
            fecha_hora_estacion_via_facturaId: {
              fecha: p.fecha,
              hora: p.hora,
              estacion: p.estacion,
              via: p.via,
              facturaId: factura.id,
            },
          },
          update: {},
          create: {
            fecha: p.fecha,
            hora: p.hora,
            estacion: p.estacion,
            estacionNombre: p.estacionNombre,
            horaPico: p.horaPico,
            via: p.via,
            dispositivo: p.dispositivo,
            patente: p.patente,
            categoria: p.categoria,
            tarifa: p.tarifa,
            bonificacion: p.bonificacion,
            facturaId: factura.id,
          },
        });
      }
    }

    return NextResponse.json(pasadas);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener pasadas" },
      { status: 500 }
    );
  }
}
