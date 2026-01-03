import { NextResponse } from "next/server";
import { authenticator } from "otplib";

export const dynamic = "force-dynamic";

// Helper to login and get JWT (Cached in memory ideally, or just re-login for simplicity/robustness first)
async function getAngelSession() {
    const apiKey = process.env.ANGEL_MARKET_API_KEY;
    const clientCode = process.env.ANGEL_CLIENT_CODE;
    const password = process.env.ANGEL_PASSWORD;
    const totpSecret = process.env.ANGEL_TOTP_KEY;

    if (!apiKey || !clientCode || !password || !totpSecret) {
        throw new Error("Missing Angel One System Credentials (CLIENT_CODE, PASSWORD, TOTP_KEY, API_KEY)");
    }

    // Generate TOTP
    const totp = authenticator.generate(totpSecret);

    // Login
    const loginResp = await fetch("https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-User-Type": "USER",
            "X-SourceID": "WEB",
            "X-ClientLocalIP": "127.0.0.1",
            "X-ClientPublicIP": "127.0.0.1",
            "X-MACAddress": "MAC_ADDRESS",
            "X-PrivateKey": apiKey,
        },
        body: JSON.stringify({
            clientcode: clientCode,
            password: password,
            totp: totp,
        }),
    });

    const responseText = await loginResp.text();
    try {
        const data = JSON.parse(responseText);
        if (data.status === true && data.data && data.data.jwtToken) {
            return data.data.jwtToken;
        } else {
            throw new Error(`Angel Login Failed: ${data.message || 'Unknown Error'} (Code: ${data.errorcode})`);
        }
    } catch (e) {
        console.error("Angel Login Parse Error. Raw Response:", responseText);
        throw new Error("Failed to parse Angel One Login response: " + responseText);
    }
}

export async function GET() {
    try {
        // 1. Get Session Token (System Level)
        // NOTE: In production, cache this token! Don't login on every request.
        const token = await getAngelSession();

        // 2. Fetch Market Data (e.g. Nifty 50, Bank Nifty)
        // Using LTP Data endpoint (lighter than Quote)
        const marketResp = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/ltpData", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer " + token,
                "X-User-Type": "USER",
                "X-SourceID": "WEB",
                "X-ClientLocalIP": "127.0.0.1",
                "X-ClientPublicIP": "127.0.0.1",
                "X-MACAddress": "MAC_ADDRESS",
                "X-PrivateKey": process.env.ANGEL_MARKET_API_KEY!,
            },
            body: JSON.stringify({
                exchange: "NSE",
                tradingsymbol: "NIFTY",
                symboltoken: "99926000" // Nifty 50 Token
            }),
        });

        // We can fetch multiple symbols by making parallel requests or using 'batch' if available?
        // SmartAPI 'ltpData' is single symbol. 'quote' is single symbol.
        // There is no batch LTP in public docs easily found without iterating.
        // For demo, we check NIFTY.

        const marketData = await marketResp.json();

        return NextResponse.json({
            success: true,
            data: marketData.data
        });

    } catch (error: any) {
        console.error("Market Data Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
