// app/api/upstox-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Lazy-load Supabase
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uid = searchParams.get("state"); // ✅ Supabase UID passed via state

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid (state)" },
      { status: 400 }
    );
  }

  console.log("🔗 Received Upstox code:", code);
  console.log("👤 Supabase UID (state):", uid);

  const supabase = getSupabase();

  // 1️⃣ Exchange authorization code for Upstox token
  const response = await fetch(
    "https://api.upstox.com/v2/login/authorization/token",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.UPSTOX_CLIENT_ID!,
        client_secret: process.env.UPSTOX_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`,
        grant_type: "authorization_code",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Token exchange failed:", data);
    return NextResponse.json(
      { error: "Token exchange failed", details: data },
      { status: 500 }
    );
  }

  console.log("✅ Upstox token received:", data);

  // 2️⃣ Build token row
  const tokenRecord = {
    user_id: uid,                        // Link to Supabase User
    upstox_user_id: data.user_id,        // BH7396
    access_token: data.access_token,     
    refresh_token: data.extended_token || null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3️⃣ Save token in Supabase
  const { error } = await supabase
    .from("upstox_tokens")
    .upsert(tokenRecord);

  if (error) {
    console.error("❌ Supabase insert failed:", error);
    return NextResponse.json(
      { error: "Supabase insert failed", details: error },
      { status: 500 }
    );
  }

  console.log("🎉 Upstox token saved for Supabase UID:", uid);

  return NextResponse.json({
    message: "Upstox token saved successfully",
    user_id: uid,
    upstox_user_id: data.user_id,
  });
}
