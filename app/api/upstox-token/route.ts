// app/api/upstox-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uid = searchParams.get("state") ?? searchParams.get("uid");

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid" },
      { status: 400 }
    );
  }

  // Exchange authorisation code for access token
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
    return NextResponse.json(
      { error: "Token exchange failed", details: data },
      { status: 500 }
    );
  }

  // Token expires in ~1 hour. Set to 55 minutes.
  const expiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString();

  const supabase = getSupabase();

  const record = {
    user_id: uid,
    upstox_user_id: data.user_id,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? data.extended_token ?? null,
    expires_at: expiresAt,
    is_sandbox: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Correct UPSERT
  const { error } = await supabase
    .from("upstox_tokens")
    .upsert([record], {
      onConflict: "user_id,upstox_user_id",
    });

  if (error) {
    return NextResponse.json(
      { error: "Supabase insert failed", details: error },
      { status: 500 }
    );
  }

  // Deep link to Flutter app
  const deepLink = `rupya://oauth/success?uid=${encodeURIComponent(uid)}&upstox_user_id=${encodeURIComponent(data.user_id)}`;

  const html = `
<html>
  <head>
    <title>Upstox Connected</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script>
      setTimeout(() => { window.location.href = "${deepLink}"; }, 200);
    </script>
  </head>
  <body>
    <h2>Upstox Connected 🎉</h2>
    <p>If your app did not open, <a href="${deepLink}">tap here</a>.</p>
  </body>
</html>
`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
