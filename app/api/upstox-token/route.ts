// app/api/upstox-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars:", { url, hasKey: !!key });
    throw new Error("Missing Supabase credentials");
  }
  return createClient(url, key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // robust reading: allow either uid or state
  const code = searchParams.get("code");
  const uidFromUid = searchParams.get("uid");
  const uidFromState = searchParams.get("state");
  const uid = uidFromUid ?? uidFromState ?? null;

  // log what arrived (helps debug production)
  console.log("📥 /api/upstox-token called with:", {
    code,
    uidFromUid,
    uidFromState,
    uid,
  });

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid (state)", received: { code, uidFromUid, uidFromState } },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Exchange code for tokens
  const tokenResponse = await fetch("https://api.upstox.com/v2/login/authorization/token", {
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
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("❌ Token exchange failed:", tokenData);
    return NextResponse.json({ error: "Token exchange failed", details: tokenData }, { status: 500 });
  }

  console.log("✅ Token data received:", { user_id: tokenData.user_id });

  // prepare record
  const tokenRecord = {
    user_id: uid, // Supabase user UUID
    upstox_user_id: tokenData.user_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.extended_token || null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    is_sandbox: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("upstox_tokens").upsert(tokenRecord);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    return NextResponse.json({ error: "Supabase insert failed", details: error }, { status: 500 });
  }

  console.log("🎉 Token saved for UID:", uid);

  return NextResponse.json({
    message: "Token saved",
    user_id: uid,
    upstox_user_id: tokenData.user_id,
  });
}
