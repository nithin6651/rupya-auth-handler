import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  console.log("🔌 Login Upstox - Supabase UID:", uid);

  const redirect = `https://api.upstox.com/v2/login/authorization/dialog?` +
                   `response_type=code&client_id=${process.env.UPSTOX_CLIENT_ID}` +
                   `&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/callback` +
                   `&state=${uid}`;

  return NextResponse.redirect(redirect);
}
