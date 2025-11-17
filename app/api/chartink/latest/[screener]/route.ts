// app/api/chartink/latest/[screener]/route.ts
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { screener: string } }) {
  try {
    const screener = params.screener; // e.g. "breakout-volume"
    // Use `screener` to decide which logic/screener to run
    // Example response:
    const data = { screener, items: [] };
    const lastUpdated = new Date().toISOString();

    return NextResponse.json({ ok: true, data, last_updated: lastUpdated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { screener: string } }) {
  try {
    const body = await request.json();
    const screener = params.screener;
    // process request body for screener...
    return NextResponse.json({ ok: true, message: "posted", screener });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
