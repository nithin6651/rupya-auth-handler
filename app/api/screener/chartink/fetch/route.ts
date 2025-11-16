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

    const form = new URLSearchParams();
    form.append("scan_clause", scanClause);
    form.append("p", page.toString());

    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://chartink.com/screener/",
      },
      body: form.toString(),
    });

    const json = await res.json();

    return NextResponse.json({
      ok: true,
      results: json.data,
      total: json.total,
      columns: json.columns,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.toString() },
      { status: 500 }
    );
  }
}
