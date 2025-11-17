import { NextResponse } from "next/server";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "text/html,application/xhtml+xml",
};

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Chartink → Received Payload:", payload);

    const screenerURL = "https://chartink.com/screener";

    // STEP 1 — fetch public screener page
    const page = await fetch(screenerURL, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "manual",
      cache: "no-store",
    });

    const html = await page.text();
    const cookies = page.headers.getSetCookie?.() ?? [];

    let xsrf = null;
    let laravel = null;
    let csrf = html.match(/name="csrf-token" content="([^"]+)"/)?.[1] || null;

    for (const c of cookies) {
      if (c.startsWith("XSRF-TOKEN")) xsrf = c.split(";")[0].split("=")[1];
      if (c.startsWith("laravel_session"))
        laravel = c.split(";")[0].split("=")[1];
    }

    console.log("Chartink → CSRF:", csrf);
    console.log("Chartink → XSRF:", xsrf);
    console.log("Chartink → Laravel:", laravel);

    if (!csrf || !xsrf || !laravel) {
      return NextResponse.json(
        { ok: false, error: "Missing csrf tokens" },
        { status: 500 }
      );
    }

    // STEP 2 — Build cookies
    const fullCookie = [
      `XSRF-TOKEN=${encodeURIComponent(xsrf)}`,
      `laravel_session=${encodeURIComponent(laravel)}`,
    ].join("; ");

    // STEP 3 — create form
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) =>
      form.append(k, String(v ?? ""))
    );

    // STEP 4 — submit POST to screener/process
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": csrf,
        Cookie: fullCookie,
        Referer: screenerURL,
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
