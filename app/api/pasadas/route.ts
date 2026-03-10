import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import { descargar } from "@/lib/telepase";
import { getSessionCookies } from "@/lib/session";
import { prisma } from "@/lib/db";

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

const ESTACIONES_COD: Record<string, { nombre: string; concesionario: Concesionario }> = {
  "0001": { nombre: "Dock Sud", concesionario: "AUBASA" },
  "0002": { nombre: "Quilmes", concesionario: "AUBASA" },
  "0004": { nombre: "Hudson", concesionario: "AUBASA" },
  "0005": { nombre: "Bernal", concesionario: "AUBASA" },
  "0020": { nombre: "Samborombon", concesionario: "AUBASA" },
  "0024": { nombre: "Mar Chiquita", concesionario: "AUBASA" },
  "0091": { nombre: "Riccheri", concesionario: "CORREDORES_VIALES" },
};

function parseHoraCompacta(raw: string): string {
  const padded = raw.padStart(6, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}:${padded.slice(4, 6)}`;
}

// Detecta si la hora ya viene formateada (HH:MM:SS) o compacta (HHMMSS)
function normalizeHora(raw: string): string {
  return raw.includes(":") ? raw : parseHoraCompacta(raw);
}

// Detecta si la estación es código numérico o nombre completo
function isCodigoEstacion(estacion: string): boolean {
  return /^\d{4}$/.test(estacion);
}

// Extrae nombre limpio de estación (quita ASCENDENTE/DESCENDENTE)
function limpiarNombreEstacion(raw: string): string {
  return raw.replace(/\s+(ASCENDENTE|DESCENDENTE)$/i, "");
}

// Extrae sentido de circulación del nombre de estación
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
  const dow = dt.weekday; // 1=lunes, 7=domingo
  const h = dt.hour;

  if (concesionario === "CORREDORES_VIALES" || concesionario === "AUTOPISTAS_DEL_SOL") {
    if (dow <= 5) {
      return (h >= 7 && h < 11) || (h >= 16 && h < 20);
    }
    // S-D-Feriados: depende del sentido
    if (sentido === "ASCENDENTE") {
      return h >= 11 && h < 15;
    }
    if (sentido === "DESCENDENTE") {
      return h >= 17 && h < 21;
    }
    // Sin sentido conocido (ej. Riccheri con código numérico): ambas franjas
    return (h >= 11 && h < 15) || (h >= 17 && h < 21);
  }

  // AUBASA / default: solo L-V
  if (dow > 5) return false;
  return (h >= 7 && h < 10) || (h >= 17 && h < 20);
}

function parseCsv(csv: string): Pasada[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(";");
    const fecha = cols[0];
    const hora = normalizeHora(cols[1]);
    const estacionRaw = cols[2];

    let estacionCod: string;
    let estacionNombre: string;
    let concesionario: Concesionario | undefined;

    let sentido: string | undefined;

    if (isCodigoEstacion(estacionRaw)) {
      // Formato AUBASA/Corredores Viales: código numérico
      estacionCod = estacionRaw;
      const info = ESTACIONES_COD[estacionCod];
      estacionNombre = info?.nombre || `Estacion ${estacionCod}`;
      concesionario = info?.concesionario;
    } else {
      // Formato Autopistas del Sol: nombre completo con sentido
      estacionCod = estacionRaw;
      estacionNombre = limpiarNombreEstacion(estacionRaw);
      sentido = extraerSentido(estacionRaw);
      concesionario = "AUTOPISTAS_DEL_SOL";
    }

    return {
      fecha,
      hora,
      estacion: estacionCod,
      estacionNombre,
      horaPico: esHoraPico(fecha, hora, concesionario, sentido),
      via: cols[3],
      dispositivo: cols[4],
      patente: cols[5],
      categoria: cols[6],
      tarifa: parseFloat(cols[7]) || 0,
      bonificacion: parseFloat(cols[8]) || 0,
    };
  });
}

export async function GET(request: NextRequest) {
  const cookies = await getSessionCookies();
  if (!cookies) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  if (!url.startsWith("https://telepase.com.ar/")) {
    return NextResponse.json({ error: "URL no permitida" }, { status: 403 });
  }

  try {
    const response = await descargar(url, cookies);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Error al descargar pasadas" },
        { status: response.status }
      );
    }

    const csv = await response.text();
    const pasadas = parseCsv(csv);

    // Persist to DB if comprobante is provided
    const comprobante = request.nextUrl.searchParams.get("comprobante");
    if (comprobante) {
      const factura = await prisma.factura.findUnique({
        where: { comprobante },
      });
      if (factura) {
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
    }

    return NextResponse.json(pasadas);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener pasadas" },
      { status: 500 }
    );
  }
}
