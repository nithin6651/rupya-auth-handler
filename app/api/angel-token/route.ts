import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Angel One sends params to callback which redirects here
    const code = searchParams.get("code");
    const uid = searchParams.get("state") ?? "unknown_user";

    console.log("📥 Angel One OAuth callback placeholder:", { code, uid });

    // In a real implementation, we would exchange 'code' (auth_token) for access_token here
    // using Angel One API keys.

    // For now, we immediately redirect back to the app with the auth_token/code
    const deepLink = `rupya://oauth/success?uid=${uid}&angel_auth_token=${code}`;

    console.log("🔗 Redirecting to deep link:", deepLink);

    const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Angel One Connected</title>
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
    <h2>Angel One Connected (Mock) 🎉</h2>
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
