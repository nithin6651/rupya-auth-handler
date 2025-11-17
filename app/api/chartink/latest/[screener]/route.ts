import { NextResponse, NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ screener: string }> }
) {
  try {
    const { screener } = await context.params;

    const data = { screener, items: [] };
    const lastUpdated = new Date().toISOString();

    return NextResponse.json(
      { ok: true, data, last_updated: lastUpdated },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ screener: string }> }
) {
  try {
    const body = await request.json();
    const { screener } = await context.params;

    return NextResponse.json(
      {
        ok: true,
        message: "posted",
        screener,
        body,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
