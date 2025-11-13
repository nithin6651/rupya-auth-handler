import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upstoxUserId = searchParams.get("upstox_user_id");

  if (!upstoxUserId) {
    return NextResponse.json({ error: "Missing upstox_user_id" }, { status: 400 });
  }

  // Fetch token from Supabase
  const { data, error } = await supabase
    .from("upstox_tokens")
    .select("access_token, expires_at")
    .eq("upstox_user_id", upstoxUserId)
    .single();

  if (error || !data) {
    console.error("❌ Token fetch failed:", error);
    return NextResponse.json({ error: "Token not found", details: error }, { status: 404 });
  }

  const expiresAt = new Date(data.expires_at).getTime();
  const now = Date.now();

  // ✅ If token expired, request user to re-login
  if (now > expiresAt) {
    return NextResponse.json({
      status: "expired",
      message: "Access token expired. Please re-authorize your Upstox account.",
      reauth_url: `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${process.env.UPSTOX_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`,
    });
  }

  // ✅ Otherwise, return valid token
  return NextResponse.json({
    status: "success",
    access_token: data.access_token,
    expires_at: data.expires_at,
  });
}
