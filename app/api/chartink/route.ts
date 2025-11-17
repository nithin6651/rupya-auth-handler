import { NextResponse } from "next/server";

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

    const screenerURL =
      "https://chartink.com/screener/breakout-with-volume-checking-stage";

    // FIX: Proper browser headers (NO ORIGIN header)
    const page = await fetch(screenerURL, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
        Cookie: SESSION_COOKIE,
      },
      cache: "no-store",
      redirect: "manual",
    });

    // Extract all cookies from SET-COOKIE headers
    const setCookies = page.headers.getSetCookie?.() ?? [];

    // Extract XSRF-TOKEN
    const xsrfToken =
      setCookies
        .find((c: string) => c.startsWith("XSRF-TOKEN"))
        ?.split(";")[0]
        ?.split("=")[1] ?? null;

    const html = await page.text();

    // Extract CSRF TOKEN from HTML
    const csrfMatch = html.match(/name="csrf-token" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;

    console.log("Chartink → CSRF:", csrfToken);
    console.log("Chartink → XSRF:", xsrfToken);

    if (!csrfToken || !xsrfToken) {
      return NextResponse.json(
        { ok: false, error: "Missing CSRF or XSRF" },
        { status: 500 }
      );
    }

    // Build form
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) =>
      form.append(k, String(v ?? ""))
    );

    // POST to Chartink
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": csrfToken,
        Referer: screenerURL,

        Cookie: `${SESSION_COOKIE}; XSRF-TOKEN=${encodeURIComponent(
          xsrfToken
        )}`,
      },
      body: form.toString(),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("Chartink → Raw Response:", text.slice(0, 400));

    // Parse JSON
    const json = JSON.parse(text);
    return NextResponse.json({
      ok: true,
      total: json.total,
      results: json.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.toString() },
      { status: 500 }
    );
  }
}
