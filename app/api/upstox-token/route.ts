// app/api/upstox-token/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Create Supabase client (SERVICE ROLE — required for insert)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Upstox sends: ?code=xxxx&state=<uid>
  const code = searchParams.get("code");
  const uid = searchParams.get("state") ?? searchParams.get("uid");

  console.log("📥 Upstox OAuth callback:", { code, uid });

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid" },
      { status: 400 }
    );
  }

  // Exchange authorization code for access + refresh token
  const resp = await fetch(
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

  const data = await resp.json();

  if (!resp.ok) {
    console.error("❌ Token exchange failed:", data);
    return NextResponse.json(
      { error: "Token exchange failed", details: data },
      { status: 500 }
    );
  }

  console.log("🔑 Upstox user authenticated:", data.user_id);

  // Token valid for 59 minutes
  const expiresAt = new Date(Date.now() + 59 * 60 * 1000).toISOString();

  const supabase = getSupabase();

  const record = {
    user_id: uid,                 // UNIQUE key
    upstox_user_id: data.user_id, // NOT unique (but one person usually uses one account)
    access_token: data.access_token,
    refresh_token: data.extended_token ?? null,
    expires_at: expiresAt,
    is_sandbox: false,

    // timestamps required for your schema
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log("💾 Saving token:", record);

  // IMPORTANT — matches your table with UNIQUE (user_id)
  const { error } = await supabase
    .from("upstox_tokens")
    .upsert([record], {
      onConflict: "user_id", // CORRECT NOW
    });

  if (error) {
    console.error("❌ Supabase INSERT/UPSERT error:", error);
    return NextResponse.json(
      { error: "Supabase insert failed", details: error },
      { status: 500 }
    );
  }

  console.log("🎉 Token stored successfully for:", uid);

  // Deep link to return to Flutter
  const deepLink = `rupya://oauth/success?uid=${uid}&upstox_user_id=${data.user_id}`;

  console.log("🔗 Redirecting to deep link:", deepLink);

  // Returning HTML that tries to open the Flutter app
  const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Upstox Connected</title>
    <script>
      const link = "${deepLink}";
      function openApp() {
        window.location.href = link;
        setTimeout(() => {
          document.getElementById("fallback").style.display = "block";
        }, 800);
      }
      window.onload = openApp;
    </script>
  </head>
  <body style="font-family:Arial;text-align:center;padding:40px">
    <h2>Upstox Connected 🎉</h2>
    <p>If your app doesn't open automatically, tap below.</p>
    <a id="fallback" href="${deepLink}" style="display:none;font-size:20px">
      Return to App
    </a>
  </body>
</html>
`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
