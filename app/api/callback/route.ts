// app/api/callback/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uid = searchParams.get("state"); // UID passed from login-upstox

  if (!code || !uid) {
    return NextResponse.json(
      { error: "Missing code or uid" },
      { status: 400 }
    );
  }

  console.log("🔗 Received Upstox OAuth callback");
  console.log("➡️ Code:", code);
  console.log("➡️ UID:", uid);

  // Always redirect to your deployed token handler
  const tokenUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/upstox-token?code=${code}&uid=${uid}`;

  console.log("🔁 Redirecting to:", tokenUrl);

  return NextResponse.redirect(tokenUrl);
}
