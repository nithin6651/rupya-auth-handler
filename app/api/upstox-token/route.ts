// app/api/upstox-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials");
  return createClient(url, key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uid = searchParams.get("uid") ?? searchParams.get("state");

  console.log("📥 upstox-token params:", { code, uid });

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid", received: { code, uid } },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // Exchange code
  const tokenResponse = await fetch(
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

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("❌ Token exchange failed:", tokenData);
    return NextResponse.json(
      { error: "Token exchange failed", details: tokenData },
      { status: 500 }
    );
  }

  console.log("✅ Token received:", tokenData);

  const record = {
    user_id: uid,
    upstox_user_id: tokenData.user_id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.extended_token ?? null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    is_sandbox: false,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("upstox_tokens").upsert(record);

  if (error) {
    console.error("❌ Supabase insert error:", error);
    return NextResponse.json(
      { error: "Supabase insert failed", details: error },
      { status: 500 }
    );
  }

  console.log("🎉 Token saved for:", uid);

  // AUTO-CLOSE WINDOW
  return new NextResponse(
    `
    <html>
      <body style="font-family:sans-serif; text-align:center; padding:40px;">
        <h2>Upstox Login Success 🎉</h2>
        <p>You can close this window and return to the Rupya app.</p>
        <script>
          setTimeout(() => window.close(), 800);
        </script>
      </body>
    </html>
    `,
    { headers: { "Content-Type": "text/html" } }
  );
}
