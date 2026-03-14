import * as cheerio from "cheerio";

const BASE_URL = "https://telepase.com.ar";

function extractCookies(response: Response): string {
  const setCookieHeaders = response.headers.getSetCookie();
  return setCookieHeaders
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

function mergeCookies(existing: string, newCookies: string): string {
  const cookieMap = new Map<string, string>();
  const parse = (str: string) =>
    str.split("; ").filter(Boolean).forEach((c) => {
      const [key, ...rest] = c.split("=");
      if (key) cookieMap.set(key.trim(), rest.join("="));
    });
  parse(existing);
  parse(newCookies);
  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export async function getTokenAndCookies(): Promise<{
  token: string;
  cookies: string;
}> {
  const response = await fetch(`${BASE_URL}/login`, {
    redirect: "manual",
  });
  const html = await response.text();
  const cookies = extractCookies(response);
  const $ = cheerio.load(html);
  const token = $('input[name="_token"]').attr("value") || "";
  return { token, cookies };
}

export async function login(
  email: string,
  password: string
): Promise<string> {
  const { token, cookies } = await getTokenAndCookies();

  const body = new URLSearchParams({
    _token: token,
    email,
    password,
  });

  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies,
    },
    body: body.toString(),
    redirect: "manual",
  });

  const postCookies = extractCookies(response);
  const allCookies = mergeCookies(cookies, postCookies);

  // Check if login was successful by following the redirect
  const location = response.headers.get("location");
  if (!location || location.includes("login")) {
    throw new Error("Credenciales invalidas");
  }

  return allCookies;
}

export interface Factura {
  periodo: string;
  concesionario: string;
  comprobante: string;
  vencimiento: string;
  monto: string;
  url_factura: string | undefined;
  url_pasadas: string | undefined;
}

export async function getFacturas(cookies: string): Promise<Factura[]> {
  const response = await fetch(`${BASE_URL}/admin/facturas`, {
    headers: {
      Cookie: cookies,
    },
    redirect: "manual",
  });

  if (response.status === 302) {
    throw new Error("Sesion expirada");
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const facturas: Factura[] = [];

  $("#example tbody tr").each((_, element) => {
    const tds = $(element).find("td");
    if (tds.length > 0) {
      const factura: Factura = {
        periodo: $(tds[0]).text().trim(),
        concesionario: $(tds[1]).text().trim(),
        comprobante: $(tds[2]).text().trim(),
        vencimiento: $(tds[3]).html()?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim().replace(/(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})/, "$1\n$2") || "",
        monto: ($(tds[4]).html()?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim() || $(tds[4]).text().trim()).replace(/(\$[\d.,]+)\s+(\$)/g, "$1\n$2"),
        url_factura: $(tds[5]).find("a").attr("href"),
        url_pasadas: $(tds[6]).find("a").attr("href"),
      };
      if (factura.comprobante) {
        facturas.push(factura);
      }
    }
  });

  return facturas;
}

export async function getFacturasAll(cookies: string): Promise<Factura[]> {
  // First GET /admin/facturas to extract the _token for the filter form
  const pageRes = await fetch(`${BASE_URL}/admin/facturas`, {
    headers: { Cookie: cookies },
    redirect: "manual",
  });

  if (pageRes.status === 302) {
    throw new Error("Sesion expirada");
  }

  const pageHtml = await pageRes.text();
  const $page = cheerio.load(pageHtml);
  const token = $page('input[name="_token"]').attr("value") || "";

  if (!token) {
    throw new Error("No se pudo obtener token para filtrar facturas");
  }

  // Fetch all invoices from 2020 to today+1
  const today = new Date();
  const fin = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate() + 1).padStart(2, "0")}`;

  const params = new URLSearchParams({
    _token: token,
    "filtro-aut": "T",
    "filtro-cond": "T",
    "filtro-fec-ini": "2020-01-01",
    "filtro-fec-fin": fin,
    aplic: "",
  });

  const response = await fetch(`${BASE_URL}/admin/facturas?${params.toString()}`, {
    headers: { Cookie: cookies },
    redirect: "manual",
  });

  if (response.status === 302) {
    throw new Error("Sesion expirada");
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const facturas: Factura[] = [];

  $("#example tbody tr").each((_, element) => {
    const tds = $(element).find("td");
    if (tds.length > 0) {
      const factura: Factura = {
        periodo: $(tds[0]).text().trim(),
        concesionario: $(tds[1]).text().trim(),
        comprobante: $(tds[2]).text().trim(),
        vencimiento: $(tds[3]).html()?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim().replace(/(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})/, "$1\n$2") || "",
        monto: ($(tds[4]).html()?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim() || $(tds[4]).text().trim()).replace(/(\$[\d.,]+)\s+(\$)/g, "$1\n$2"),
        url_factura: $(tds[5]).find("a").attr("href"),
        url_pasadas: $(tds[6]).find("a").attr("href"),
      };
      if (factura.comprobante) {
        facturas.push(factura);
      }
    }
  });

  return facturas;
}

export async function descargar(
  url: string,
  cookies: string
): Promise<Response> {
  return fetch(url, {
    headers: {
      Cookie: cookies,
    },
  });
}
