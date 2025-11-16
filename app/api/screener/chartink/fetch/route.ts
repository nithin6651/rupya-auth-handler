import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { scanClause, page = 1 } = await req.json();

    if (!scanClause) {
      return NextResponse.json(
        { error: "scanClause is required" },
        { status: 400 }
      );
    }

    const formData = new URLSearchParams();
    formData.append("scan_clause", scanClause);
    formData.append("p", page.toString());

    const response = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://chartink.com/screener/",
      },
      body: formData.toString(),
      credentials: "include",
    });

    const text = await response.text();

    // Try parsing JSON safely
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: "Chartink returned non-JSON response", raw: text },
        { status: 500 }
      );
    }

    if (!json?.data) {
      return NextResponse.json(
        { error: "Invalid response from Chartink", raw: json },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      results: json.data,
      total: json.total,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}
