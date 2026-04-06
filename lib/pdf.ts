import { PDFParse } from "pdf-parse";
import { descargar } from "./telepase";

export interface PdfLineItem {
  name: string;
  count: number;
  total: number;
}

export async function extractPdfText(url: string, cookies: string): Promise<string> {
  const response = await descargar(url, cookies);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

const LINE_REGEX = /(\d+)\s+PEAJE\s+(.+?)[-\s]+CAT\.\s*\d+\s+\S+\s+([\d.,]+)/g;

export function parseTollLineItems(pdfText: string): PdfLineItem[] {
  const items: PdfLineItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = LINE_REGEX.exec(pdfText)) !== null) {
    const count = parseInt(match[1], 10);
    const name = match[2].trim();
    const totalStr = match[3].replace(/,/g, "");
    const total = parseFloat(totalStr);

    if (!isNaN(count) && !isNaN(total) && name) {
      items.push({ name, count, total });
    }
  }

  return items;
}
