import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const uid = searchParams.get("state"); // Supabase user ID

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  if (!uid) {
    return NextResponse.json(
      { error: "Missing Supabase UID from state" },
      { status: 400 }
    );
  }

  console.log("🔗 Received Upstox code:", code);
  console.log("👤 Supabase UID:", uid);

  const isProduction = process.env.NODE_ENV === "production";

  const redirectUrl = isProduction
    ? `https://rupya-oauth.vercel.app/api/upstox-token?code=${code}&uid=${uid}`
    : `http://localhost:3000/api/upstox-token?code=${code}&uid=${uid}`;

  console.log("🔁 Redirecting to token handler:", redirectUrl);

  return NextResponse.redirect(redirectUrl);
}
