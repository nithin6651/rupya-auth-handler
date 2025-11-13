// app/api/refresh-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Create Supabase client (service role key required)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  // Check CRON_SECRET for security
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // Fetch all tokens that have a refresh token
  const { data: rows, error: fetchErr } = await supabase
    .from("upstox_tokens")
    .select("*")
    .not("refresh_token", "is", null);

  if (fetchErr) {
    console.error("❌ Supabase fetch error:", fetchErr);
    return NextResponse.json(
      { error: "Supabase fetch error", details: fetchErr },
      { status: 500 }
    );
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: "No tokens available for refresh" });
  }

  let refreshedCount = 0;
  const results: any[] = [];

  for (const row of rows) {
    try {
      const expiresAt = new Date(row.expires_at).getTime();
      const timeRemaining = expiresAt - Date.now();

      // Skip tokens valid for more than 15 minutes
      if (timeRemaining > 15 * 60 * 1000) {
        results.push({ user_id: row.user_id, refreshed: false, skipped: true });
        continue;
      }

      console.log("🔄 Attempting refresh for user:", row.user_id);

      // Proper refresh request
      const params = new URLSearchParams({
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
          body: params,
        }
      );

      const newData = await resp.json();

      if (!resp.ok) {
        console.error("❌ Token refresh failed:", newData);
        results.push({ user_id: row.user_id, refreshed: false, error: newData });
        continue;
      }

      // New expiry
      const newExpiry = new Date(Date.now() + 59 * 60 * 1000).toISOString();

      // Update token row
      const { error: updateErr } = await supabase
        .from("upstox_tokens")
        .update({
          access_token: newData.access_token,
          refresh_token: newData.extended_token ?? row.refresh_token,
          expires_at: newExpiry,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", row.user_id);

      if (updateErr) {
        console.error("❌ Failed to update token:", updateErr);
        results.push({ user_id: row.user_id, refreshed: false, error: updateErr });
        continue;
      }

      refreshedCount++;
      results.push({ user_id: row.user_id, refreshed: true });
      console.log("✨ Token refreshed for:", row.user_id);

    } catch (err) {
      console.error("🔥 Unexpected error while refreshing:", err);
      results.push({ user_id: row.user_id, refreshed: false, error: err });
    }
  }

  return NextResponse.json({
    message: `Refreshed ${refreshedCount} tokens`,
    results,
  });
}
