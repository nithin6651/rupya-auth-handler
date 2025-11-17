"use client";

export default function TradingViewDashboard() {
  return (
    <div style={{ padding: "20px", background: "#0d0d0d", minHeight: "100vh" }}>
      <h1 style={{ color: "white", marginBottom: 20 }}>TradingView Market Dashboard</h1>

      {/* MARKET HEATMAP */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: "white" }}>Market Heatmap</h2>
        <iframe
          src="https://www.tradingview.com/heatmap/?color=change&group=sector&country=IN"
          width="100%"
          height="600"
          frameBorder="0"
        ></iframe>
      </div>

      {/* MARKET OVERVIEW */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: "white" }}>Market Overview</h2>
        <script
          type="text/javascript"
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
                    { s: "NSE:NIFTYIT" },
                  ],
                },
              ],
            }),
          }}
        />
      </div>

      {/* SCREENER */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: "white" }}>Stock Screener</h2>
        <script
          type="text/javascript"
          src="https://s3.tradingview.com/external-embedding/embed-widget-screener.js"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              width: "100%",
              height: "600",
              screener_type: "stock",
              defaultColumn: "overview",
              displayCurrency: "INR",
              colorTheme: "dark",
              locale: "en",
            }),
          }}
        />
      </div>

      {/* TECHNICAL ANALYSIS */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ color: "white" }}>Technical Analysis</h2>
        <script
          type="text/javascript"
          src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              symbol: "NSE:RELIANCE",
              interval: "D",
              width: "100%",
              height: "450",
              theme: "dark",
              locale: "en",
            }),
          }}
        />
      </div>

      {/* ADVANCED CHART */}
      <div>
        <h2 style={{ color: "white" }}>Advanced Chart</h2>
        <div id="tv_chart"></div>

        <script
          src="https://s3.tradingview.com/tv.js"
          onLoad={() => {
            new window.TradingView.widget({
              container_id: "tv_chart",
              width: "100%",
              height: 600,
              symbol: "NSE:NIFTY50",
              interval: "D",
              theme: "dark",
              style: "1",
            });
          }}
        ></script>
      </div>
    </div>
  );
}
