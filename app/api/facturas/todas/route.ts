import { NextResponse } from "next/server";
import { getFacturasAll } from "@/lib/telepase";
import { getSessionCookies } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const cookies = await getSessionCookies();
  if (!cookies) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const facturas = await getFacturasAll(cookies);

    for (const f of facturas) {
      await prisma.factura.upsert({
        where: { comprobante: f.comprobante },
        update: {
          periodo: f.periodo,
          concesionario: f.concesionario,
          vencimiento: f.vencimiento,
          monto: f.monto,
          urlFactura: f.url_factura || null,
          urlPasadas: f.url_pasadas || null,
        },
        create: {
          periodo: f.periodo,
          concesionario: f.concesionario,
          comprobante: f.comprobante,
          vencimiento: f.vencimiento,
          monto: f.monto,
          urlFactura: f.url_factura || null,
          urlPasadas: f.url_pasadas || null,
        },
      });
    }

    const dbFacturas = await prisma.factura.findMany({
      orderBy: { periodo: "desc" },
    });

    const result = dbFacturas.map((db) => ({
      periodo: db.periodo,
      concesionario: db.concesionario,
      comprobante: db.comprobante,
      vencimiento: db.vencimiento,
      monto: db.monto,
      url_factura: db.urlFactura,
      url_pasadas: db.urlPasadas,
      pagada: db.pagada,
      pagadaAt: db.pagadaAt,
    }));

    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Error al obtener facturas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
