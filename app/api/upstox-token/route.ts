import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uid = searchParams.get("uid") ?? searchParams.get("state");

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid" },
      { status: 400 }
    );
  }

  // Exchange code for token
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
    console.error("Token exchange failed:", data);
    return NextResponse.json(
      { error: "Token exchange failed", details: data },
      { status: 500 }
    );
  }

  // Save token
  const supabase = getSupabase();

  await supabase.from("upstox_tokens").upsert({
    user_id: uid,
    upstox_user_id: data.user_id,
    access_token: data.access_token,
    refresh_token: data.extended_token ?? null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
  });

  // Return clean HTML that auto-closes browser tab
  const html = `
<html>
<head>
<title>Upstox Connected</title>
<style>
body { font-family: Arial; text-align:center; padding:40px; }
</style>
<script>
  setTimeout(() => { window.close(); }, 1000);
</script>
</head>
<body>
<h2>Upstox Connected Successfully 🎉</h2>
<p>You can return to the app now.</p>
</body>
</html>
`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
