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
  // accept either state or uid (older code used uid param)
  const uid = searchParams.get("state") ?? searchParams.get("uid");

  console.log("📥 Received /api/upstox-token with:", { code, uid });

  if (!code || !uid) {
    return NextResponse.json({ error: "Missing code or uid (state)" }, { status: 400 });
  }

  // Exchange code for token
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

  const data = await tokenResponse.json();

  if (!tokenResponse.ok) {
    console.error("Token exchange failed:", data);
    return NextResponse.json({ error: "Token exchange failed", details: data }, { status: 500 });
  }

  // Upstox tokens are short-lived (~1 hour). Save expiry = now + 59 minutes
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

  const { error } = await supabase.from("upstox_tokens").upsert(record, { onConflict: ["upstox_user_id", "user_id"] });

  if (error) {
    console.error("Supabase insert failed:", error);
    return NextResponse.json({ error: "Supabase insert failed", details: error }, { status: 500 });
  }

  console.log("🎉 Token saved for uid:", uid);

  // Return a tiny HTML that redirects to the custom deep link (app will handle)
  const deepLink = `rupya://oauth/success?uid=${encodeURIComponent(uid)}&upstox_user_id=${encodeURIComponent(data.user_id)}`;

  const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Upstox Connected</title>
    <script>
      // try to redirect to app deep link; if not possible, show clickable button
      const deep = "${deepLink}";
      function tryRedirect(){
        window.location = deep;
        setTimeout(() => {
          document.getElementById('fallback').style.display = 'block';
        }, 800);
      }
      window.onload = tryRedirect;
    </script>
    <style>body{font-family:Arial;text-align:center;padding:40px}</style>
  </head>
  <body>
    <h2>Upstox Connected 🎉</h2>
    <p>If your app didn't open automatically, tap the button below.</p>
    <a id="fallback" style="display:none" href="${deep}">Return to App</a>
  </body>
</html>
`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
