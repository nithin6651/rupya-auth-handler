import { NextResponse } from "next/server";

const COOKIE =
  "ci_session=PASTE_YOUR_COOKIE_HERE"; // <-- IMPORTANT: replace this ONLY

const SCREENER_URL =
  "https://chartink.com/screener/breakout-with-volume-checking-stage";

const PROCESS_URL = "https://chartink.com/screener/process";

export async function POST(req: Request) {
  try {
    // 1️⃣ Receive payload from Flutter
    const payload = await req.json();

    if (!payload.scan_clause) {
      return NextResponse.json(
        { ok: false, error: "scan_clause missing" },
        { status: 400 }
      );
    }

    // 2️⃣ Fetch screener page → extract CSRF
    const htmlRes = await fetch(SCREENER_URL, {
      method: "GET",
      headers: { Cookie: COOKIE },
      cache: "no-store",
    });

    const html = await htmlRes.text();

    const csrfMatch = html.match(
      /<meta name="csrf-token" content="([^"]+)" \/>/
    );

    if (!csrfMatch) {
      return NextResponse.json(
        { ok: false, error: "Failed to extract CSRF token" },
        { status: 500 }
      );
    }

    const CSRF = csrfMatch[1]; // <-- FIXED

    // 3️⃣ Build form body (Laravel expects "_token")
    const form = new URLSearchParams();
    form.append("_token", CSRF);

    Object.entries(payload).forEach(([key, value]) => {
      form.append(key, String(value ?? ""));
    });

    // 4️⃣ POST to Chartink -> screener/process
    const res = await fetch(PROCESS_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: COOKIE,
        "X-CSRF-TOKEN": CSRF,
        "X-Requested-With": "XMLHttpRequest",
        Referer: SCREENER_URL,
        Origin: "https://chartink.com",
      },
      body: form.toString(),
    });

    const text = await res.text();

    // 5️⃣ Try parse JSON
    try {
      const json = JSON.parse(text);

      return NextResponse.json({
        ok: true,
        total: json.total ?? 0,
        results: json.data ?? [],
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "HTML returned", raw: text.slice(0, 3000) },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.toString() },
      { status: 500 }
    );
  }
}
