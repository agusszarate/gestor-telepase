import { describe, it, expect } from "vitest";
import { parseTollLineItems } from "../pdf";

describe("parseTollLineItems", () => {
  it("parses a single line item", () => {
    const text = "1 PEAJE BERAZATEGUI-CAT.2 SI9060981686 3608.95";
    const items = parseTollLineItems(text);
    expect(items).toEqual([
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
    ]);
  });

  it("parses multiple line items", () => {
    const text = [
      "1 PEAJE BERAZATEGUI-CAT.2 SI9060981686 3608.95",
      "3 PEAJE QUILMES-CAT.2 SI1234567890 10826.85",
      "2 PEAJE HUDSON-CAT.2 SI0000000001 7217.90",
    ].join("\n");
    const items = parseTollLineItems(text);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({ name: "BERAZATEGUI", count: 1, total: 3608.95 });
    expect(items[1]).toEqual({ name: "QUILMES", count: 3, total: 10826.85 });
    expect(items[2]).toEqual({ name: "HUDSON", count: 2, total: 7217.90 });
  });

  it("parses station name with spaces", () => {
    const text = "2 PEAJE DOCK SUD-CAT.2 SI1234567890 7200.00";
    const items = parseTollLineItems(text);
    expect(items).toEqual([
      { name: "DOCK SUD", count: 2, total: 7200.00 },
    ]);
  });

  it("returns empty array for text without PEAJE lines", () => {
    const text = "Some random PDF text\nwith multiple lines\nbut no toll data";
    const items = parseTollLineItems(text);
    expect(items).toEqual([]);
  });

  it("extracts only PEAJE lines from mixed content", () => {
    const text = [
      "FACTURA DE PEAJE",
      "Fecha: 2024-01-15",
      "Detalle de pasadas:",
      "1 PEAJE BERAZATEGUI-CAT.2 SI9060981686 3608.95",
      "Total: $3608.95",
      "IVA: $758.88",
    ].join("\n");
    const items = parseTollLineItems(text);
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({ name: "BERAZATEGUI", count: 1, total: 3608.95 });
  });

  it("handles amount with comma as thousands separator", () => {
    const text = "10 PEAJE QUILMES-CAT.2 SI1234567890 36,089.50";
    const items = parseTollLineItems(text);
    expect(items).toEqual([
      { name: "QUILMES", count: 10, total: 36089.50 },
    ]);
  });

  it("handles double-digit count", () => {
    const text = "15 PEAJE BERNAL-CAT.2 SI5555555555 54134.25";
    const items = parseTollLineItems(text);
    expect(items).toEqual([
      { name: "BERNAL", count: 15, total: 54134.25 },
    ]);
  });
});
