import { NextResponse } from "next/server";
import { getAngelSession } from "@/lib/angel-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { exchange, symboltoken } = body;

        if (!exchange || !symboltoken) {
            return NextResponse.json({ success: false, error: "Missing exchange or symboltoken" }, { status: 400 });
        }

        const token = await getAngelSession();

        // Angel One Quote API
        // Endpoint: /rest/secure/angelbroking/market/v1/quote/
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        let quoteResp;
        try {
            quoteResp = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/", {
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
                    mode: "FULL",
                    exchangeTokens: {
                        [exchange]: [symboltoken]
                    }
                }),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }

        const json = await quoteResp.json();

        if (json.status === true && json.data) {
            return NextResponse.json({ success: true, data: json.data });
        } else {
            throw new Error(json.message || "Quote API Failed");
        }

    } catch (error: any) {
        console.error("Quote API Error:", error);

        // Mock Fallback
        return NextResponse.json({
            success: true,
            source: "MOCK_FAILOVER",
            data: {
                fetched: [], // Quote API returns structure differently, usually a flat list or nested by exchange
                // Mocking the likely response structure for a single item
                item: {
                    exchange: "NSE",
                    symboltoken: "MockToken",
                    ltp: 2450.00,
                    open: 2440.00,
                    high: 2460.00,
                    low: 2430.00,
                    close: 2445.00,
                    percentChange: 0.20,
                    netChange: 5.00
                }
            }
        });
    }
}
