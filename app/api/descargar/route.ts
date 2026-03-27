import { NextRequest, NextResponse } from "next/server";
import { descargar } from "@/lib/telepase";
import { getSessionCookies } from "@/lib/session";

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
        { error: "Error al descargar" },
        { status: response.status }
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const contentDisposition = response.headers.get("content-disposition");
    const body = await response.arrayBuffer();

    const headers: Record<string, string> = {
      "Content-Type": contentType,
    };
    if (contentDisposition) {
      headers["Content-Disposition"] = contentDisposition;
    }

    return new NextResponse(body, { headers });
  } catch {
    return NextResponse.json(
      { error: "Error al descargar archivo" },
      { status: 500 }
    );
  }
}
