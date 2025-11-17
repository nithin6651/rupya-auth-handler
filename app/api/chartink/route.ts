import { NextResponse } from "next/server";

const BASE_COOKIE =
  "ci_session=eyJpdiI6Inptc25oR0Y5ZlpFWkhLbDhjQUZZU1E9PSIsInZhbHVlIjoicHlNQncxOTN5VldPM1Q4TENOSk9ZaHR2SS9RZndWSHF0eVFkTGFvRGFyRnBnZnVYZFIyRFBWNXE2Q0JhT0ZoaVc4bVVqRDdkZVAwZ1RLYU5vOFZLbVAwMDkwSmJiNnJ4MlJuME9ua2F2RFRBQy9ubDFzM1BCYXBKVGdSbXpiMU0iLCJtYWMiOiJlZTQwODBmYTVmYWQxZGZlNjA2MDczZDZkZThlNjg0MTJmOTYwMzQ3MzczNjEyMzI0NDhkZTI2YzMyMDg5ZThmIiwidGFnIjoiIn0%3D";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    console.log("Chartink → Received Payload:", payload);

    // const screenerURL =
    //   "https://chartink.com/screener/breakout-with-volume-checking-stage";
const screenerURL = "https://chartink.com/alerts";

    // STEP 1: Fetch page WITHOUT ORIGIN header
    const page = await fetch(screenerURL, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
        Cookie: BASE_COOKIE,
      },
      redirect: "manual",
      cache: "no-store",
    });

    const html = await page.text();

    // STEP 2: Extract ALL cookies
    const setCookies = page.headers.getSetCookie?.() ?? [];

    let xsrf = null;
    let laravel = null;

    for (const c of setCookies) {
      if (c.startsWith("XSRF-TOKEN")) xsrf = c.split(";")[0].split("=")[1];
      if (c.startsWith("laravel_session"))
        laravel = c.split(";")[0].split("=")[1];
    }

    // STEP 3: Extract CSRF token from HTML
    const csrf = html.match(/name="csrf-token" content="([^"]+)"/)?.[1] || null;

    console.log("Chartink → CSRF:", csrf);
    console.log("Chartink → XSRF:", xsrf);
    console.log("Chartink → Laravel:", laravel);

    if (!csrf || !xsrf || !laravel) {
      return NextResponse.json(
        { ok: false, error: "Missing tokens" },
        { status: 500 }
      );
    }

    // STEP 4: Build cookies to send
    const fullCookie = [
      BASE_COOKIE,
      `XSRF-TOKEN=${encodeURIComponent(xsrf)}`,
      `laravel_session=${encodeURIComponent(laravel)}`,
    ].join("; ");

    // STEP 5: Build form
    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => form.append(k, String(v)));

    // STEP 6: Make POST request to Chartink process
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRF-TOKEN": csrf,
        Referer: screenerURL,
        Cookie: fullCookie,
      },
      body: form.toString(),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("Chartink → Raw Response:", text.slice(0, 200));

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
