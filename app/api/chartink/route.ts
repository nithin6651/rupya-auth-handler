import { NextResponse } from "next/server";

const COOKIE =
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

    // 🔍 Debug log
    console.log("Chartink → Received Payload:", payload);

    const form = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      form.append(k, String(v ?? ""));
    });

    const response = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://chartink.com/screener/breakout-with-volume-checking-stage",
        Origin: "https://chartink.com",
        Cookie: COOKIE,
      },
      body: form.toString(),
    });

    const raw = await response.text();

    // 🔍 Debug log
    console.log("Chartink → Raw Response:", raw.slice(0, 300));

    try {
      const json = JSON.parse(raw);

      return NextResponse.json({
        ok: true,
        total: json.total ?? 0,
        results: json.data ?? [],
      });
    } catch (e) {
      return NextResponse.json(
        {
          ok: false,
          error: "HTML returned instead of JSON",
          raw: raw.slice(0, 3000),
        },
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
