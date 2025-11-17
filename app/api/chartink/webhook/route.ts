// app/api/screener/chartink/webhook/route.ts
import { NextResponse } from "next/server";

/*
  Chartink will POST JSON to the webhook URL you enter in their alert dialog.
  This endpoint simply validates and returns 200 quickly, and then you can
  process/store the payload (e.g. push to Supabase, Redis, or send to users).
*/

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // QUICK VALIDATION (chartink payload structure may include: name, symbol, url, time etc)
    // Save to DB / enqueue job for processing / send push notification
    // Example: await saveToSupabase('chartink_alerts', payload);

    console.log("Chartink webhook received:", payload);

    // respond 200 to acknowledge
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook parse error:", err);
    return NextResponse.json({ error: "invalid webhook payload" }, { status: 400 });
  }
}
