import { authenticator } from "otplib";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAngelSession() {
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
