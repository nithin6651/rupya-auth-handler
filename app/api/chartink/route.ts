import { NextResponse } from "next/server";

const COOKIE =
  "ci_session=eyJpdiI6IkpEQWxFZS9PcjltOEg5OXQ5eiswTFE9PSIsInZhbHVlIjoia3RWNGFWOGRuYVRWNVJLZ1lSKzN3M3VlOG96S1I4WnliQjhTTjR0UmdSN1RydDFxZ2Y2eUMvVkRJemQrRVB2ZkJqTk5rbHVjY1RZZUpTQnlscTdheUNPN3EvejVKTHhBdURpbExlVW5LVVBaUTBiTFdJQ2FEUityMldFQ1Jtd3kiLCJtYWMiOiI5MDUzZTYwZGFmZGU4Y2VhNzI1ZTRjM2FmMWVhZTZhYzBmZjg3MzNlYTA4NzYzMTE2OTczZGY3ZGQwNzQ3ZGFmIiwidGFnIjoiIn0%3D"; // <-- replace only this

const SCREENER_URL =
  "https://chartink.com/screener/breakout-with-volume-checking-stage";
const PROCESS_URL = "https://chartink.com/screener/process";

function safeSlice(s: string | null, n = 300) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n) + "..." : s;
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch((e) => {
      throw new Error("Invalid JSON payload: " + e);
    });

    if (!payload || !payload.scan_clause) {
      return NextResponse.json({ ok: false, error: "scan_clause missing" }, { status: 400 });
    }

    console.log("Chartink → Received payload keys:", Object.keys(payload));

    // 1) Fetch the screener page to extract CSRF token
    const pageResp = await fetch(SCREENER_URL, {
      method: "GET",
      headers: { Cookie: COOKIE, "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });

    const pageStatus = pageResp.status;
    const pageText = await pageResp.text();

    console.log("Chartink → screener page status:", pageStatus);
    console.log("Chartink → screener page snippet:", safeSlice(pageText, 800));

    if (pageStatus !== 200) {
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to GET screener page (status ${pageStatus})`,
          pageStatus,
          pageSnippet: safeSlice(pageText, 2000),
        },
        { status: 502 }
      );
    }

    // Extract CSRF token
    const csrfMatch = pageText.match(/<meta name="csrf-token" content="([^"]+)" \/>/);
    if (!csrfMatch) {
      // Provide helpful debug: maybe HTML says login/blocked/robot
      return NextResponse.json(
        {
          ok: false,
          error: "CSRF token not found on screener page",
          pageSnippet: safeSlice(pageText, 2000),
        },
        { status: 500 }
      );
    }
    const CSRF = csrfMatch[1];
    console.log("Chartink → extracted CSRF length:", CSRF.length);

    // 2) Build form body including _token
    const form = new URLSearchParams();
    form.append("_token", CSRF);
    Object.entries(payload).forEach(([k, v]) => form.append(k, String(v ?? "")));

    // 3) POST to process endpoint
    const procResp = await fetch(PROCESS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Cookie: COOKIE,
        "X-CSRF-TOKEN": CSRF,
        "X-Requested-With": "XMLHttpRequest",
        Referer: SCREENER_URL,
        Origin: "https://chartink.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: form.toString(),
    });

    const procStatus = procResp.status;
    const procText = await procResp.text();

    console.log("Chartink → process status:", procStatus);
    console.log("Chartink → process snippet:", safeSlice(procText, 800));

    // If Chartink returns non-200, return debug info
    if (procStatus !== 200) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chartink process returned non-200",
          procStatus,
          procSnippet: safeSlice(procText, 4000),
        },
        { status: 502 }
      );
    }

    // Try parse JSON
    try {
      const json = JSON.parse(procText);
      return NextResponse.json({
        ok: true,
        total: json.total ?? 0,
        results: json.data ?? [],
      });
    } catch (e) {
      // If not JSON, return HTML snippet for debugging
      return NextResponse.json(
        {
          ok: false,
          error: "Chartink returned non-json text (possibly blocked or login page)",
          procSnippet: safeSlice(procText, 4000),
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    console.error("Chartink → internal error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
