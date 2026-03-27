import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "telepase_session";

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET env var is required");
  }
  return secret;
}

function sign(payload: string): string {
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

function verify(signed: string): string | null {
  const dotIndex = signed.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payload = signed.slice(0, dotIndex);
  const signature = signed.slice(dotIndex + 1);

  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");

  if (signature.length !== expected.length) return null;

  const valid = timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex")
  );

  return valid ? payload : null;
}

export interface Session {
  cookies: string;
  email: string;
}

export async function setSessionCookies(telepaseCookies: string, email: string) {
  const cookieStore = await cookies();
  const payload = Buffer.from(
    JSON.stringify({ cookies: telepaseCookies, email })
  ).toString("base64");
  const signed = sign(payload);

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
}

export async function getSessionCookies(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;

  const payload = verify(cookie.value);
  if (!payload) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
    if (!data.cookies || !data.email) return null;
    return { cookies: data.cookies, email: data.email };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
