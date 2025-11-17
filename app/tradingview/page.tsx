"use client";

import { useEffect } from "react";

export default function TradingViewDashboard() {
  return (
    <div className="min-h-screen bg-[#0B0B0D] p-6 text-white space-y-10">
      <h1 className="text-3xl font-bold">Rupya — TradingView Dashboard</h1>

      {/* HEATMAP */}
      <section>
        <h2 className="text-xl mb-2">Market Heatmap</h2>
        <iframe
          src="https://www.tradingview.com/heatmap/?color=change&group=sector&country=IN"
          width="100%"
          height="600"
          frameBorder="0"
        ></iframe>
      </section>

      {/* MARKET OVERVIEW */}
      <section>
        <h2 className="text-xl mb-2">Market Overview</h2>
        <div id="market_overview"></div>

        <script
          src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              colorTheme: "dark",
              dateRange: "1D",
              showChart: true,
              width: "100%",
              height: "500",
              locale: "en",
              tabs: [
                {
                  title: "Indices",
                  symbols: [
                    { s: "NSE:NIFTY50" },
                    { s: "NSE:NIFTYBANK" },
                    { s: "NSE:NIFTYMIDCAP" },
                  ],
                },
              ],
            }),
          }}
        />
      </section>

      {/* SCREENER */}
      <section>
        <h2 className="text-xl mb-2">Stock Screener (India)</h2>

        <script
          src="https://s3.tradingview.com/external-embedding/embed-widget-screener.js"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              height: 600,
              width: "100%",
              screener_type: "stock",
              defaultColumn: "overview",
              displayCurrency: "INR",
              locale: "en",
              colorTheme: "dark",
            }),
          }}
        />
      </section>

      {/* ADVANCED CHART */}
      <section>
        <h2 className="text-xl mb-2">Nifty50 Chart</h2>
        <div id="tv_chart"></div>

        <TradingViewChart />
      </section>
    </div>
  );
}

function TradingViewChart() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.onload = () => {
      new (window as any).TradingView.widget({
        container_id: "tv_chart",
        width: "100%",
        height: 600,
        symbol: "NSE:NIFTY50",
        interval: "D",
        theme: "dark",
      });
    };
    document.body.appendChild(script);

    return () => script.remove();
  }, []);

  return <div id="tv_chart" />;
}
