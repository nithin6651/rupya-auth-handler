// app/api/refresh-my-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabase();

  // 1. Verify the user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid user token" }, { status: 401 });
  }

  const userId = user.id;
  console.log("🔄 Refresh requested for user:", userId);

  // 2. Fetch the Upstox token row
  const { data: row, error: fetchErr } = await supabase
    .from("upstox_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "No Upstox token found for user" }, { status: 404 });
  }

  if (!row.refresh_token) {
    return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
  }

  // 3. Perform refresh
  try {
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
      return NextResponse.json({ error: "Upstox refresh failed", details: newData }, { status: 502 });
    }

    // New expiry (approx 1 hour)
    const newExpiry = new Date(Date.now() + 59 * 60 * 1000).toISOString();

    // 4. Update Database
    const { error: updateErr } = await supabase
      .from("upstox_tokens")
      .update({
        access_token: newData.access_token,
        refresh_token: newData.extended_token ?? row.refresh_token,
        expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("❌ Failed to update token:", updateErr);
      return NextResponse.json({ error: "Database update failed" }, { status: 500 });
    }

    console.log("✨ Token refreshed for:", userId);
    return NextResponse.json({ 
      success: true, 
      access_token: newData.access_token 
    });

  } catch (err) {
    console.error("🔥 Unexpected error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
