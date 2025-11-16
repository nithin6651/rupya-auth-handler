// app/api/chartink/forward/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1) Take the ENTIRE request JSON body
    const body = await req.json();

    // body must be a key-value object
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload (must be JSON object)" },
        { status: 400 }
      );
    }

    // 2) Build formData EXACTLY as Chartink requires
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      form.append(key, String(value ?? ""));
    }

    // 3) Forward to Chartink using browser-like headers
    const response = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://chartink.com/screener/",
        Origin: "https://chartink.com",
      },
      body: form.toString(),
    });

    const text = await response.text();

    // 4) Try to parse JSON
    try {
      const json = JSON.parse(text);
      return NextResponse.json({ ok: true, ...json });
    } catch {
      // 5) If not JSON, Chartink is returning HTML (error), return raw for debugging
      return NextResponse.json(
        {
          ok: false,
          error: "Chartink returned HTML instead of JSON",
          raw: text.slice(0, 2000),
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}
