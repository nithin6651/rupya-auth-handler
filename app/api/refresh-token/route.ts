// app/api/refresh-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(request: Request) {
  // Basic authorization check for cron/manual trigger
  const auth = request.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // fetch tokens that have a refresh_token
  const { data: tokens, error: fetchError } = await supabase
    .from("upstox_tokens")
    .select("*")
    .not("refresh_token", "is", null);

  if (fetchError) {
    console.error("Supabase fetch error:", fetchError);
    return NextResponse.json({ error: "Supabase fetch error", details: fetchError }, { status: 500 });
  }

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ message: "No tokens to refresh" });
  }

  let refreshed = 0;

  for (const t of tokens) {
    // refresh if expires within 15 minutes (or already expired)
    const expiresAt = new Date(t.expires_at).getTime();
    if (expiresAt - Date.now() > 15 * 60 * 1000) continue;

    try {
      const resp = await fetch("https://api.upstox.com/v2/login/authorization/token", {
        method: "POST",
        headers: { accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.UPSTOX_CLIENT_ID!,
          client_secret: process.env.UPSTOX_CLIENT_SECRET!,
          refresh_token: t.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const newData = await resp.json();
      if (!resp.ok) {
        console.error("Refresh failed for", t.upstox_user_id, newData);
        continue;
      }

      const newExpiry = new Date(Date.now() + 59 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("upstox_tokens")
        .update({
          access_token: newData.access_token,
          refresh_token: newData.extended_token ?? t.refresh_token,
          expires_at: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("upstox_user_id", t.upstox_user_id);

      if (updateError) {
        console.error("Update failed for", t.upstox_user_id, updateError);
        continue;
      }

      refreshed++;
      console.log("Refreshed token for", t.upstox_user_id);
    } catch (err) {
      console.error("Exception refreshing token for", t.upstox_user_id, err);
    }
  }

  return NextResponse.json({ message: `Refreshed ${refreshed} tokens` });
}
