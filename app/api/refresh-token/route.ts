// app/api/refresh-token/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log("🔄 Starting Upstox token refresh check...");

    // 1️⃣ Get all tokens that will expire soon (next 2 hours)
    const { data: tokens, error: fetchError } = await supabase
      .from("upstox_tokens")
      .select("*")
      .not("refresh_token", "is", null);

    if (fetchError) throw fetchError;

    if (!tokens || tokens.length === 0) {
      console.log("⚠️ No tokens found for refresh.");
      return NextResponse.json({ message: "No tokens to refresh" });
    }

    const now = Date.now();
    let refreshedCount = 0;

    // 2️⃣ Loop through tokens
    for (const token of tokens) {
      const expiresAt = new Date(token.expires_at).getTime();
      const timeLeft = expiresAt - now;

      // If token expires within next 2 hours
      if (timeLeft < 2 * 60 * 60 * 1000) {
        console.log(`🕓 Token for ${token.upstox_user_id} expiring soon — refreshing...`);

        // 3️⃣ Request new tokens
        const response = await fetch("https://api.upstox.com/v2/login/authorization/token", {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.UPSTOX_CLIENT_ID!,
            client_secret: process.env.UPSTOX_CLIENT_SECRET!,
            refresh_token: token.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        const newToken = await response.json();

        if (!response.ok) {
          console.error(`❌ Refresh failed for ${token.upstox_user_id}:`, newToken);
          continue;
        }

        // 4️⃣ Update Supabase record
        const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { error: updateError } = await supabase
          .from("upstox_tokens")
          .update({
            access_token: newToken.access_token,
            refresh_token: newToken.extended_token || token.refresh_token,
            expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq("upstox_user_id", token.upstox_user_id);

        if (updateError) {
          console.error("⚠️ Failed to update refreshed token:", updateError);
          continue;
        }

        refreshedCount++;
        console.log(`✅ Token refreshed successfully for: ${token.upstox_user_id}`);
      }
    }

    return NextResponse.json({
      message: `Refreshed ${refreshedCount} tokens successfully.`,
    });
  } catch (err) {
    console.error("🔥 Error during token refresh:", err);
    return NextResponse.json({ error: "Token refresh failed", details: err }, { status: 500 });
  }
}
