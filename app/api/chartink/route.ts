import { NextResponse } from "next/server";

/*
  Full Chrome browser fingerprint
  REQUIRED to bypass Cloudflare bot protection
*/
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua":
    "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Google Chrome\";v=\"122\"",
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": "\"Windows\"",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Chartink → Received Payload:", payload);

    /** #1 — Open login page to extract CSRF tokens */
    const loginURL = "https://chartink.com/login";

    const page = await fetch(loginURL, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "manual",
      cache: "no-store",
    });

    const html = await page.text();
    const setCookies = page.headers.getSetCookie?.() ?? [];

    /** Extract cookies */
    let xsrf: string | null = null;
    let laravel: string | null = null;

    for (const c of setCookies) {
      if (c.startsWith("XSRF-TOKEN="))
        xsrf = c.split(";")[0].split("=")[1];
      if (c.startsWith("laravel_session="))
        laravel = c.split(";")[0].split("=")[1];
    }

    /** Extract CSRF token from HTML */
    const csrf =
      html.match(/name="csrf-token" content="([^"]+)"/)?.[1] || null;

    console.log("Chartink → CSRF:", csrf);
    console.log("Chartink → XSRF:", xsrf);
    console.log("Chartink → Laravel:", laravel);

    if (!csrf || !xsrf || !laravel) {
      return NextResponse.json(
        { ok: false, error: "Missing csrf tokens" },
        { status: 500 }
      );
    }

    /** Build full cookie string */
    const cookieHeader = [
      `XSRF-TOKEN=${encodeURIComponent(xsrf)}`,
      `laravel_session=${encodeURIComponent(laravel)}`,
    ].join("; ");

    /** Prepare POST payload */
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) =>
      form.append(k, String(v ?? ""))
    );

    /** #2 — Send request to Chartink screener */
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": csrf,
        Cookie: cookieHeader,
        Referer: loginURL,
      },
      body: form.toString(),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("Chartink → Raw Response:", text.slice(0, 500));

    const json = JSON.parse(text);

    return NextResponse.json({
      ok: true,
      total: json.total ?? 0,
      results: json.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.toString() },
      { status: 500 }
    );
  }
}
