import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload.scan_clause) {
      return NextResponse.json(
        { ok: false, error: "scan_clause is missing" },
        { status: 400 }
      );
    }

    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) =>{
      form.append(k, String(v ?? ""));
    });

    const res = await fetch("https://chartink.com/screener/process", {
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

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return NextResponse.json({
        ok: true,
        total: json.total ?? 0,
        columns: json.columns ?? [],
        results: json.data ?? [],
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "HTML returned", raw: text.slice(0, 5000) },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.toString() }, { status: 500 });
  }
}
