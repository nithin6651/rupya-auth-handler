import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json(
      { error: "Missing user id (uid)" },
      { status: 400 }
    );
  }

  console.log("🔗 Received Upstox login request for UID:", uid);

  // Build redirect URL for Upstox OAuth
  const upstoxUrl =
    `https://api.upstox.com/v2/login/authorization/dialog` +
    `?response_type=code` +
    `&client_id=${process.env.UPSTOX_CLIENT_ID}` +
    `&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}/api/callback` +
    `&state=${uid}`; // Pass Supabase UID

  console.log("🔁 Redirecting user to Upstox OAuth:", upstoxUrl);

  return NextResponse.redirect(upstoxUrl);
}
