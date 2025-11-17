import { NextResponse } from "next/server";

const COOKIE =
  "ci_session=eyJpdiI6IlZ2Qzh6RXJRTDVkOUV5RERIWXNvWUE9PSIsInZhbHVlIjoiVXFLWTJrS3hRMWNMSjdVUnI3OHJGSHdYMjZqL0NvYkJLcnFTSXFuQ2hPU2dETlV0ZUozRXN4TDBTM0JzZEJ4NEFpUk1PdFZ6cys5OE9KSU0wUUlsTkVtK0NWNzVTeFNHTDlsK1p2MG0zNXlpZmJYek1tN0NKVXR3N05ja2htWnIiLCJtYWMiOiI5OGM5ODI0YzE0ZThmNzUzZTAwZTM2MTRjOGZjNGUyOGQzYTdlMGVlNTdmMDFjN2VlM2FkZjM0NmUxNDkxMGMyIiwidGFnIjoiIn0%3D";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload.scan_clause) {
      return NextResponse.json(
        { ok: false, error: "scan_clause missing" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch screener page to get CSRF token
    const page = await fetch(
      "https://chartink.com/screener/breakout-with-volume-checking-stage",
      {
        headers: { Cookie: COOKIE },
      }
    );

    const html = await page.text();

    // Extract CSRF token
    const match = html.match(
      /<meta name="csrf-token" content="([^"]+)" \/>/
    );

    if (!match) {
      return NextResponse.json(
        { ok: false, error: "CSRF token not found" },
        { status: 500 }
      );
    }

    const csrf = match[1];

    // 2️⃣ Build form data with _token + scan_clause
    const form = new URLSearchParams();
    form.append("_token", csrf);

    Object.entries(payload).forEach(([k, v]) => {
      form.append(k, String(v ?? ""));
    });

    // 3️⃣ Send POST request to process API
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: COOKIE,
        "X-CSRF-TOKEN": csrf,
        "X-Requested-With": "XMLHttpRequest",
        Referer:
          "https://chartink.com/screener/breakout-with-volume-checking-stage",
        Origin: "https://chartink.com",
      },
      body: form.toString(),
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);

      return NextResponse.json({
        ok: true,
        total: json.total ?? 0,
        results: json.data ?? [],
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "HTML returned", raw: text },
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
