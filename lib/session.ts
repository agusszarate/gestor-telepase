import { cookies } from "next/headers";

const COOKIE_NAME = "telepase_session";

export async function setSessionCookies(telepaseCookies: string) {
  const cookieStore = await cookies();
  // Encode to base64 to safely store in a cookie
  const encoded = Buffer.from(telepaseCookies).toString("base64");
  cookieStore.set(COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 2, // 2 hours
  });
}

export async function getSessionCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie) return null;
  return Buffer.from(cookie.value, "base64").toString("utf-8");
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
