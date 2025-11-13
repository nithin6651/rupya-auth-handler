// app/api/upstox-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Create Supabase client using service role
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uidRaw = searchParams.get("state") ?? searchParams.get("uid");
  const uid = uidRaw ? String(uidRaw) : null;

  console.log("📥 /api/upstox-token called with:", {
    code,
    uidReceived: uidRaw,
    uid,
  });

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid", received: { code, uidRaw } },
      { status: 400 }
    );
  }

  // Request Upstox token exchange
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

  const data = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("❌ Token exchange failed:", data);
    return NextResponse.json(
      { error: "Token exchange failed", details: data },
      { status: 500 }
    );
  }

  console.log("🔑 Token exchange success for Upstox user:", data.user_id);

  // Upstox tokens are short-lived — valid for ~1 hour
  const expiresAt = new Date(Date.now() + 59 * 60 * 1000).toISOString();

  const supabase = getSupabase();

  const record = {
    user_id: uid,
    upstox_user_id: data.user_id,
    access_token: data.access_token,
    refresh_token: data.extended_token ?? null,
    expires_at: expiresAt,
    is_sandbox: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("💾 Saving token record:", record);

  // Upsert array-based (fixes TypeScript overload issues)
  const { error } = await supabase
    .from("upstox_tokens")
    .upsert([record], { onConflict: "user_id" });

  if (error) {
    console.error("❌ Supabase upsert error:", error);
    return NextResponse.json(
      { error: "Supabase insert failed", details: error },
      { status: 500 }
    );
  }

  console.log("🎉 Token saved successfully for UID:", uid);

  // Prepare deep link that opens the Flutter app
  const deepLink = `rupya://oauth/success?uid=${encodeURIComponent(
    uid
  )}&upstox_user_id=${encodeURIComponent(data.user_id)}`;

  console.log("🔗 Returning deep link:", deepLink);

  // Clean success page with auto-redirect to app
  const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Upstox Connected</title>
    <script>
      const deepLink = "${deepLink}";
      function openApp() {
        window.location.href = deepLink;
        setTimeout(() => {
          document.getElementById("fallback").style.display = "block";
        }, 800);
      }
      window.onload = openApp;
    </script>
    <style>
      body { font-family: Arial; text-align:center; padding:40px; }
      a { display:inline-block; margin-top:20px; font-size:18px; }
    </style>
  </head>
  <body>
    <h2>Upstox Connected 🎉</h2>
    <p>If your app did not open automatically, tap below.</p>
    <a id="fallback" style="display:none" href="${deepLink}">
      Return to App
    </a>
  </body>
</html>
`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
