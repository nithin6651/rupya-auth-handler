// app/api/chartink/fetch/route.ts
import { NextResponse } from "next/server";

type Body = {
  scanClause?: string;
  page?: number;
  maxRows?: number;
};

const CACHE_TTL_MS = 30 * 1000;
const cache = new Map<string, { ts: number; value: any }>();

function cacheGet(key: string) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() - v.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return v.value;
}
function cacheSet(key: string, value: any) {
  cache.set(key, { ts: Date.now(), value });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const scanClause = body.scanClause || (body as any).scan_clause;
    const page = body.page ?? 1;
    const maxRows = body.maxRows;

    if (!scanClause) {
      return NextResponse.json({ error: "scanClause is required" }, { status: 400 });
    }

    const cacheKey = `ci:${hashKey(scanClause)}:p${page}:m${maxRows ?? 0}`;
    const cached = cacheGet(cacheKey);
    if (cached) return NextResponse.json({ ok: true, ...cached });

    const form = new URLSearchParams();
    form.append("scan_clause", scanClause);
    // Chartink frontend sometimes sends max_rows; include if provided
    if (maxRows) form.append("max_rows", String(maxRows));
    // chartink's UI sometimes uses 'p' for page
    form.append("p", String(page));

    // send headers similar to browser XHR
    const res = await fetch("https://chartink.com/screener/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://chartink.com/screener/",
        "Origin": "https://chartink.com",
      },
      body: form.toString(),
    });

    const text = await res.text();

    // Try parse JSON
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (err) {
      // Chartink sometimes returns HTML if missing fields or blocked.
      // Return helpful debug to client so you can inspect it.
      return NextResponse.json(
        {
          error: "Chartink returned non-json response. See raw for debugging.",
          raw: text.slice(0, 40_000), // limit size
          status: res.status,
        },
        { status: 502 }
      );
    }

    // Normalize if structure present
    const normalized = {
      total: json.total ?? null,
      columns: json.columns ?? null,
      results: json.data ?? [],
    };

    // cache
    cacheSet(cacheKey, normalized);

    return NextResponse.json({ ok: true, ...normalized });
  } catch (err: any) {
    return NextResponse.json({ error: err.toString() }, { status: 500 });
  }
}

function hashKey(s: string) {
  // simple stable hash for cache key
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return (h >>> 0).toString(16);
}
