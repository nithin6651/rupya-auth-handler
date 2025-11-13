// app/api/callback/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Upstox returns 'state' (we originally set it to uid)

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  if (!state) {
    // keep helpful logging so we know what's missing in production logs
    console.error("Missing state in Upstox callback");
    return NextResponse.json({ error: "Missing Supabase UID in state" }, { status: 400 });
  }

  console.log("🔗 Received Upstox code:", code);
  console.log("👤 Received state (Supabase UID):", state);

  const isProduction = process.env.NODE_ENV === "production";

  // Redirect to the token handler and pass uid explicitly (so token handler can read uid param)
  const redirectUrl = isProduction
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/upstox-token?code=${encodeURIComponent(code)}&uid=${encodeURIComponent(state)}`
    : `http://localhost:3000/api/upstox-token?code=${encodeURIComponent(code)}&uid=${encodeURIComponent(state)}`;

  console.log("🔁 Redirecting to token handler:", redirectUrl);
  return NextResponse.redirect(redirectUrl);
}
