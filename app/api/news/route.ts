import { NextResponse } from "next/server";

// ---- Sentiment Detection (simple heuristic) ----
function detectSentiment(text: string) {
  const positive = ["gain", "growth", "rally", "up", "profit", "surge", "green"];
  const negative = ["fall", "drop", "loss", "down", "red", "crash", "fear"];

  let score = 0;

  positive.forEach(w => text.toLowerCase().includes(w) && score++);
  negative.forEach(w => text.toLowerCase().includes(w) && score--);

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

// ---- Basic Stock Symbol Extraction ----
const STOCK_LIST = [
  "TATA", "RELIANCE", "HDFC", "ICICI", "INFY", "SBIN", "WIPRO", "HCL",
  "KOTAK", "ADANI", "ADANIPORTS", "POWERGRID", "ONGC", "MARUTI"
];

function extractStocks(text: string) {
  const upper = text.toUpperCase();
  return STOCK_LIST.filter(sym => upper.includes(sym));
}

// ------------- MAIN API ROUTE -------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category") || "business";
  const q = searchParams.get("q") || ""; 
  const from = searchParams.get("from") || "";
  const page = searchParams.get("page") || "1";

  if (!process.env.NEWS_API_KEY) {
    return NextResponse.json(
      { error: "Missing NEWS_API_KEY in environment variables" },
      { status: 500 }
    );
  }

  // 🔥 Using `/everything` endpoint — gives more results
  const endpoint = "everything";

  const params = new URLSearchParams({
    q: q || category,
    sortBy: "publishedAt",
    page,
    pageSize: "10",
    language: "en"
  });

  if (from) params.append("from", from);

  const url = `https://newsapi.org/v2/${endpoint}?${params.toString()}&apiKey=${process.env.NEWS_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "ok") {
      return NextResponse.json(
        { error: data.message || "NewsAPI error", detail: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalResults: data.totalResults,
      articles: data.articles.map((n: any) => {
        const text = `${n.title ?? ""} ${n.description ?? ""}`;
        return {
          title: n.title ?? "",
          description: n.description ?? "",
          url: n.url ?? "",
          image: n.urlToImage ?? "",
          publishedAt: n.publishedAt ?? "",
          source: n.source?.name ?? "",
          category: category,
          sentiment: detectSentiment(text),
          stocks: extractStocks(text),
        };
      })
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Backend fetch failed", detail: err.toString() },
      { status: 500 }
    );
  }
}
