// app/api/refresh-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Create Supabase client (service role)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  // Secure refresh endpoint: requires CRON_SECRET in Authorization header
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Fetch all tokens that actually have a refresh_token
  const { data: tokens, error: fetchErr } = await supabase
    .from("upstox_tokens")
    .select("*")
    .not("refresh_token", "is", null);

  if (fetchErr) {
    console.error("❌ Failed to fetch tokens:", fetchErr);
    return NextResponse.json(
      { error: "Supabase fetch error", details: fetchErr },
      { status: 500 }
    );
  }

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ message: "No tokens with refresh_token available" });
  }

  let refreshed = 0;
  const results: any[] = [];

  for (const row of tokens) {
    try {
      const expiresAtMs = new Date(row.expires_at).getTime();
      const timeLeft = expiresAtMs - Date.now();

      // Skip if token is still valid for more than 15 minutes
      if (timeLeft > 15 * 60 * 1000) {
        results.push({ user_id: row.user_id, skipped: true });
        continue;
      }

      console.log("🔄 Refreshing token for:", row.user_id);

      // REFRESH REQUEST — correct Upstox flow
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: row.refresh_token,
        client_id: process.env.UPSTOX_CLIENT_ID!,
        client_secret: process.env.UPSTOX_CLIENT_SECRET!,
      });

      const resp = await fetch(
        "https://api.upstox.com/v2/login/authorization/token",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        }
      );

      const newData = await resp.json();

      if (!resp.ok) {
        console.error("❌ Refresh failed:", newData);
        results.push({
          user_id: row.user_id,
          refreshed: false,
          error: newData,
        });
        continue;
      }

      // Calculate next expiry (~59 minutes)
      const newExpires = new Date(Date.now() + 59 * 60 * 1000).toISOString();

      // Update the token row — using user_id unique constraint
      const { error: updateErr } = await supabase
        .from("upstox_tokens")
        .update({
          access_token: newData.access_token,
          refresh_token: newData.extended_token ?? row.refresh_token,
          expires_at: newExpires,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", row.user_id);

      if (updateErr) {
        console.error("❌ Failed to update token:", updateErr);
        results.push({
          user_id: row.user_id,
          refreshed: false,
          error: updateErr,
        });
        continue;
      }

      refreshed++;
      results.push({ user_id: row.user_id, refreshed: true });

      console.log("✨ Token refreshed for:", row.user_id);

    } catch (err) {
      console.error("🔥 Exception while refreshing token:", err);
      results.push({ user_id: row.user_id, refreshed: false, error: err });
    }
  }

  return NextResponse.json({
    message: `Refreshed ${refreshed} tokens`,
    results,
  });
}
