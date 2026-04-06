import { prisma } from "./db";
import { extractPdfText, parseTollLineItems, type PdfLineItem } from "./pdf";

export interface StationInfo {
  nombre: string;
  concesionario: string;
}

export async function lookupEstaciones(codigos: string[]): Promise<Map<string, StationInfo>> {
  if (codigos.length === 0) return new Map();

  const rows = await prisma.estacion.findMany({
    where: { codigo: { in: codigos } },
  });

  const map = new Map<string, StationInfo>();
  for (const row of rows) {
    map.set(row.codigo, { nombre: row.nombre, concesionario: row.concesionario });
  }
  return map;
}

export function matchStations(
  unknownCsvGroups: Map<string, { count: number; total: number }>,
  pdfItems: PdfLineItem[]
): Map<string, string> {
  const matches = new Map<string, string>();
  const usedPdfIndices = new Set<number>();

  // Pass 1: match by count AND total
  for (const [code, csv] of unknownCsvGroups) {
    const candidates = pdfItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) =>
        !usedPdfIndices.has(idx) &&
        item.count === csv.count &&
        Math.abs(item.total - csv.total) < 0.01
      );
    if (candidates.length === 1) {
      matches.set(code, candidates[0].item.name);
      usedPdfIndices.add(candidates[0].idx);
    }
  }

  // Pass 2: for remaining unmatched, try total only (if unique)
  for (const [code, csv] of unknownCsvGroups) {
    if (matches.has(code)) continue;
    const candidates = pdfItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item, idx }) =>
        !usedPdfIndices.has(idx) &&
        Math.abs(item.total - csv.total) < 0.01
      );
    if (candidates.length === 1) {
      matches.set(code, candidates[0].item.name);
      usedPdfIndices.add(candidates[0].idx);
    }
  }

  return matches;
}

export function cleanStationName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function discoverEstaciones({
  csvGroups,
  unknownCodes,
  facturaUrl,
  cookies,
  concesionario,
  comprobante,
}: {
  csvGroups: Map<string, { count: number; total: number }>;
  unknownCodes: string[];
  facturaUrl: string;
  cookies: string;
  concesionario: string;
  comprobante: string;
}): Promise<Map<string, string>> {
  const unknownGroups = new Map<string, { count: number; total: number }>();
  for (const code of unknownCodes) {
    const group = csvGroups.get(code);
    if (group) unknownGroups.set(code, group);
  }

  if (unknownGroups.size === 0) return new Map();

  let pdfText: string;
  try {
    pdfText = await extractPdfText(facturaUrl, cookies);
  } catch {
    return new Map();
  }

  const pdfItems = parseTollLineItems(pdfText);
  if (pdfItems.length === 0) return new Map();

  const matches = matchStations(unknownGroups, pdfItems);

  for (const [code, rawName] of matches) {
    const nombre = cleanStationName(rawName);
    await prisma.estacion.upsert({
      where: { codigo: code },
      update: {},
      create: {
        codigo: code,
        nombre,
        concesionario,
        discoveredFrom: comprobante,
      },
    });
  }

  return matches;
}
