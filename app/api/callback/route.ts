// app/api/callback/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  console.log("🟨 FULL CALLBACK URL:", url.toString());
  console.log("🟦 SEARCH PARAMS:", Object.fromEntries(url.searchParams.entries()));

  const code = url.searchParams.get("code");
  const uid = url.searchParams.get("state"); // should come from Upstox

  if (!code || !uid) {
    return NextResponse.json(
      {
        error: "Missing code or uid (state)",
        received: Object.fromEntries(url.searchParams.entries()), // show EXACTLY what came
      },
      { status: 400 }
    );
  }

  const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/upstox-token?code=${code}&uid=${uid}`;

  console.log("🔁 Redirecting to:", redirectUrl);
  return NextResponse.redirect(redirectUrl);
}
