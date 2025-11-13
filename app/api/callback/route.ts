// app/api/callback/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // Supabase UID

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  // Redirect to /api/upstox-token on same deployment so it can exchange and save token
  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/upstox-token?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state ?? "")}`;

  return NextResponse.redirect(redirectUrl);
}
