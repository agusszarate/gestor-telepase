import { NextResponse } from "next/server";
import { login } from "@/lib/telepase";
import { setSessionCookies } from "@/lib/session";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y password son requeridos" },
      { status: 400 }
    );
  }

  try {
    const cookies = await login(email, password);
    await setSessionCookies(cookies);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error de login";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
