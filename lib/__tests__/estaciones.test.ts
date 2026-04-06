import { describe, it, expect } from "vitest";
import { matchStations, cleanStationName } from "../estaciones";

describe("matchStations", () => {
  it("matches by exact count and total", () => {
    const csvGroups = new Map([
      ["0003", { count: 1, total: 3608.95 }],
      ["0006", { count: 3, total: 10826.85 }],
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
      { name: "LA PLATA", count: 3, total: 10826.85 },
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.get("0003")).toBe("BERAZATEGUI");
    expect(matches.get("0006")).toBe("LA PLATA");
    expect(matches.size).toBe(2);
  });

  it("disambiguates by count when totals are the same", () => {
    const csvGroups = new Map([
      ["0003", { count: 1, total: 3608.95 }],
      ["0006", { count: 2, total: 3608.95 }],
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
      { name: "LA PLATA", count: 2, total: 3608.95 },
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.get("0003")).toBe("BERAZATEGUI");
    expect(matches.get("0006")).toBe("LA PLATA");
  });

  it("returns empty map when no matches found", () => {
    const csvGroups = new Map([
      ["0099", { count: 5, total: 99999.99 }],
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.size).toBe(0);
  });

  it("handles partial matches (some codes match, some don't)", () => {
    const csvGroups = new Map([
      ["0003", { count: 1, total: 3608.95 }],
      ["0006", { count: 3, total: 10826.85 }],
      ["0099", { count: 7, total: 55555.55 }],
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
      { name: "LA PLATA", count: 3, total: 10826.85 },
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.size).toBe(2);
    expect(matches.get("0003")).toBe("BERAZATEGUI");
    expect(matches.get("0006")).toBe("LA PLATA");
    expect(matches.has("0099")).toBe(false);
  });

  it("uses total-only fallback in pass 2", () => {
    const csvGroups = new Map([
      ["0003", { count: 1, total: 3608.95 }],
      ["0006", { count: 5, total: 10826.85 }], // count doesn't match any PDF item
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
      { name: "LA PLATA", count: 3, total: 10826.85 }, // unique total, different count
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.get("0003")).toBe("BERAZATEGUI"); // pass 1: count+total
    expect(matches.get("0006")).toBe("LA PLATA"); // pass 2: total-only fallback
  });

  it("handles floating-point tolerance", () => {
    const csvGroups = new Map([
      ["0003", { count: 1, total: 3608.949999999999 }],
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.get("0003")).toBe("BERAZATEGUI");
  });

  it("skips ambiguous total-only matches in pass 2", () => {
    const csvGroups = new Map([
      ["0003", { count: 5, total: 3608.95 }], // count doesn't match
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 },
      { name: "LA PLATA", count: 2, total: 3608.95 }, // two items with same total
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.size).toBe(0); // ambiguous, so no match
  });

  it("doesn't reuse a PDF item already matched in pass 1", () => {
    const csvGroups = new Map([
      ["0003", { count: 1, total: 3608.95 }], // matches pass 1
      ["0006", { count: 5, total: 3608.95 }], // same total, different count
    ]);
    const pdfItems = [
      { name: "BERAZATEGUI", count: 1, total: 3608.95 }, // claimed by 0003 in pass 1
    ];

    const matches = matchStations(csvGroups, pdfItems);
    expect(matches.size).toBe(1);
    expect(matches.get("0003")).toBe("BERAZATEGUI");
    expect(matches.has("0006")).toBe(false); // PDF item already used
  });
});

describe("cleanStationName", () => {
  it("converts uppercase to title case", () => {
    expect(cleanStationName("BERAZATEGUI")).toBe("Berazategui");
  });

  it("handles multi-word names", () => {
    expect(cleanStationName("DOCK SUD")).toBe("Dock Sud");
  });

  it("preserves already title-cased names", () => {
    expect(cleanStationName("Berazategui")).toBe("Berazategui");
  });

  it("handles MAR CHIQUITA style names", () => {
    expect(cleanStationName("MAR CHIQUITA")).toBe("Mar Chiquita");
  });
});
