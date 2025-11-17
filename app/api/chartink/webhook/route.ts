import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role required for inserts
);

export async function POST(req: Request) {
  try {
    const text = await req.text(); // CSV comes as raw text
  
    if (!text.trim().includes(",")) {
      return NextResponse.json(
        { ok: false, error: "CSV not detected in payload" },
        { status: 400 }
      );
    }

    // Parse CSV
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
    });

    // Save to Supabase
    const { error } = await supabase.from("chartink_results").insert({
      screener: "breakout_volume", // YOU CAN CHANGE THIS
      data: records,
    });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      received_rows: records.length,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
