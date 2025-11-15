import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const category = searchParams.get("category") ?? "business";
  const q = searchParams.get("q") ?? "";

  const url = `https://newsapi.org/v2/top-headlines?country=in&category=${category}&q=${q}&apiKey=${process.env.NEWS_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return NextResponse.json({
      articles: data.articles.map((n: any) => ({
        title: n.title,
        description: n.description,
        url: n.url,
        image: n.urlToImage,
        publishedAt: n.publishedAt,
        source: n.source.name,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
