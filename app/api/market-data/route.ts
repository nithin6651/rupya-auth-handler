import { NextResponse } from "next/server";
import { authenticator } from "otplib";

export const dynamic = "force-dynamic";

// Global Cache
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

// Helper to login and get JWT (Cached in memory)
async function getAngelSession() {
    // Return cached token if valid (buffer 5 mins)
    if (cachedToken && Date.now() < tokenExpiry - 300000) {
        return cachedToken;
    }

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
            cachedToken = data.data.jwtToken;
            // Token valid for 24 hours usually, set expiry to 20 hours to be safe
            tokenExpiry = Date.now() + (20 * 60 * 60 * 1000);
            return cachedToken;
        } else {
            console.error("Angel Login Failed Response:", data);
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
        // NOTE: If this fails (Rate Limit), we return MOCK DATA to keep the app working.
        try {
            // Define Symbols to Fetch
            const symbols = [
                { name: "NIFTY", symboltoken: "99926000" },
                { name: "BANKNIFTY", symboltoken: "99926009" }
            ];

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            let results = {};

            try {
                const promises = symbols.map(async (sym) => {
                    const resp = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getLtpData", {
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
                            tradingsymbol: sym.name,
                            symboltoken: sym.symboltoken
                        }),
                        signal: controller.signal
                    });

                    if (!resp.ok) throw new Error(`Failed to fetch ${sym.name}`);
                    const json = await resp.json();

                    if (json.status === true && json.data) {
                        // Calculate Change
                        const ltp = parseFloat(json.data.ltp);
                        const close = parseFloat(json.data.close); // Previous Close
                        const change = ltp - close;
                        const pChange = (change / close) * 100;

                        return {
                            name: sym.name,
                            data: {
                                ...json.data,
                                change: change.toFixed(2),
                                pChange: pChange.toFixed(2)
                            }
                        };
                    }
                    return { name: sym.name, data: null };
                });

                const outcomes = await Promise.all(promises);

                // Reduce to Map
                outcomes.forEach(o => {
                    if (o && o.data) {
                        // @ts-ignore
                        results[o.name] = o.data;
                    }
                });

            } finally {
                clearTimeout(timeoutId);
            }

            // Validate if we got at least NIFTY
            // @ts-ignore
            if (results["NIFTY"]) {
                return NextResponse.json({
                    success: true,
                    data: results
                });
            } else {
                throw new Error("Failed to fetch NIFTY data");
            }

        } catch (apiError) {
            console.warn("Angel API Failed, using MOCK data:", apiError);
            throw new Error("Trigger Mock");
        }

    } catch (error: any) {
        console.error("Market Data / Login Error:", error);

        // FAILOVER TO MOCK DATA check
        // Return plausible dummy data for BOTH indices
        const mockNifty = 24500.55 + (Math.random() * 50 - 25);
        const mockBank = 52400.20 + (Math.random() * 100 - 50);

        return NextResponse.json({
            success: true,
            source: "MOCK_FAILOVER", // Flag
            debug_error: error.message || "Unknown Error",
            data: {
                "NIFTY": {
                    exchange: "NSE",
                    tradingsymbol: "NIFTY",
                    symboltoken: "99926000",
                    ltp: mockNifty.toFixed(2),
                    close: "24400.00",
                    change: (mockNifty - 24400).toFixed(2),
                    pChange: ((mockNifty - 24400) / 24400 * 100).toFixed(2)
                },
                "BANKNIFTY": {
                    exchange: "NSE",
                    tradingsymbol: "BANKNIFTY",
                    symboltoken: "99926009",
                    ltp: mockBank.toFixed(2),
                    close: "52300.00",
                    change: (mockBank - 52300).toFixed(2),
                    pChange: ((mockBank - 52300) / 52300 * 100).toFixed(2)
                }
            }
        });
    }
}
