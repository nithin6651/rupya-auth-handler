import { NextResponse } from "next/server";

// Your final cookie from Chartink
const SESSION_COOKIE =
  "ci_session=eyJpdiI6Inptc25oR0Y5ZlpFWkhLbDhjQUZZU1E9PSIsInZhbHVlIjoicHlNQncxOTN5VldPM1Q4TENOSk9ZaHR2SS9RZndWSHF0eVFkTGFvRGFyRnBnZnVYZFIyRFBWNXE2Q0JhT0ZoaVc4bVVqRDdkZVAwZ1RLYU5vOFZLbVAwMDkwSmJiNnJ4MlJuME9ua2F2RFRBQy9ubDFzM1BCYXBKVGdSbXpiMU0iLCJtYWMiOiJlZTQwODBmYTVmYWQxZGZlNjA2MDczZDZkZThlNjg0MTJmOTYwMzQ3MzczNjEyMzI0NDhkZTI2YzMyMDg5ZThmIiwidGFnIjoiIn0%3D";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload.scan_clause) {
      return NextResponse.json(
        { ok: false, error: "scan_clause missing" },
        { status: 400 }
      );
    }

    console.log("Chartink → Received Payload:", payload);

    // STEP 1 — Fetch the screener page to get CSRF + XSRF tokens
    const screenerURL =
      "https://chartink.com/screener/breakout-with-volume-checking-stage";

    const page = await fetch(screenerURL, {
      headers: {
        Cookie: SESSION_COOKIE,
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    const html = await page.text();

    // STEP 2 — Extract tokens
    const csrfMatch = html.match(/name="csrf-token" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;

    const xsrfMatch = html.match(/XSRF-TOKEN=([^;]+)/);
    const xsrfToken = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : null;

    console.log("Chartink → CSRF:", csrfToken);
    console.log("Chartink → XSRF:", xsrfToken);

    if (!csrfToken || !xsrfToken) {
      return NextResponse.json(
        { ok: false, error: "Failed to extract CSRF / XSRF tokens" },
        { status: 500 }
      );
    }

    // STEP 3 — Build form data
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) =>
      form.append(k, String(v ?? ""))
    );

    // STEP 4 — POST to Chartink
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: screenerURL,
        Origin: "https://chartink.com",

        // 🔥 Required for CSRF
        "X-CSRF-TOKEN": csrfToken,

        // 🔥 Complete cookies
        Cookie: `${SESSION_COOKIE}; XSRF-TOKEN=${xsrfToken}`,
      },
      body: form.toString(),
      cache: "no-store",
    });

    const text = await res.text();

    console.log("Chartink → Raw Response:", text.slice(0, 500));

    // STEP 5 — Parse JSON
    try {
      const json = JSON.parse(text);

      return NextResponse.json({
        ok: true,
        total: json.total ?? 0,
        results: json.data ?? [],
      });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "HTML returned instead of JSON",
          raw: text.slice(0, 2000),
        },
        { status: 502 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.toString() },
      { status: 500 }
    );
  }
}
