import { NextResponse } from "next/server";
import { getAngelSession } from "@/lib/angel-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { exchange, symboltoken, interval, fromdate, todate } = body;

        if (!exchange || !symboltoken || !interval || !fromdate || !todate) {
            return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
        }

        const token = await getAngelSession();

        // Angel One Historical API
        // Endpoint: /rest/secure/angelbroking/historical/v1/getCandleData
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        let histResp;
        try {
            histResp = await fetch("https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData", {
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
                    exchange,
                    symboltoken,
                    interval,
                    fromdate,
                    todate
                }),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeoutId);
        }

        const json = await histResp.json();

        if (json.status === true && json.data) {
            return NextResponse.json({ success: true, data: json.data });
        } else {
            throw new Error(json.message || "Historical API Failed");
        }

    } catch (error: any) {
        console.error("Historical API Error:", error);

        // Mock Fallback (Basic Candles)
        // Returns list of [timestamp, open, high, low, close, volume]
        const mockCandles = [];
        let price = 2400;
        const now = new Date();
        for (let i = 0; i < 50; i++) {
            const time = new Date(now.getTime() - (50 - i) * 5 * 60000).toISOString(); // 5 min candles
            const open = price;
            const close = price + (Math.random() * 10 - 5);
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            mockCandles.push([time, open, high, low, close, 1000 + Math.random() * 500]);
            price = close;
        }

        return NextResponse.json({
            success: true,
            source: "MOCK_FAILOVER",
            data: mockCandles
        });
    }
}
