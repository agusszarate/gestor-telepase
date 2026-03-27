import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionCookies } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getSessionCookies();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { comprobante, pagada } = await request.json();

  if (!comprobante || typeof pagada !== "boolean") {
    return NextResponse.json(
      { error: "comprobante y pagada son requeridos" },
      { status: 400 }
    );
  }

  try {
    await prisma.factura.update({
      where: { comprobante_userEmail: { comprobante, userEmail: session.email } },
      data: {
        pagada,
        pagadaAt: pagada ? new Date() : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar factura" },
      { status: 500 }
    );
  }
}
