import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("auth_token"); // Angel One usually returns 'auth_token' or 'code'
    const state = searchParams.get("state");

    if (!code) {
        // Some flows return 'code'
        const altCode = searchParams.get("code");
        if (!altCode) {
            return NextResponse.json({ error: "Missing authorization code/token" }, { status: 400 });
        }
    }

    // Redirect to an exchange endpoint matching the Upstox pattern, or directly to app deep link?
    // Matching Upstox pattern: redirect to an internal API that exchanges token and saves to DB.
    // For now, we'll redirect to a placeholder 'angel-token' endpoint (to be created later) or the same pattern.

    // URL to Redirect to Angel Token Exchanger
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/angel-token?code=${encodeURIComponent(code || searchParams.get("code") || "")}&state=${encodeURIComponent(state ?? "")}`;

    return NextResponse.redirect(redirectUrl);
}
