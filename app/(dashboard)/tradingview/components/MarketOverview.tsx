"use client";

import { useEffect, useRef } from "react";

export default function MarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current?.firstChild) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "12M",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "450",
      showSymbolLogo: true,
      plotLineColorGrowing: "rgba(41, 98, 255, 1)",
      plotLineColorFalling: "rgba(41, 98, 255, 1)",
      gridLineColor: "rgba(240, 243, 250, 0.06)",
      category: "indices",
      symbols: [
        { s: "NSE:NIFTY", d: "Nifty" },
        { s: "NSE:BANKNIFTY", d: "Bank Nifty" },
        { s: "NASDAQ:NDX", d: "NASDAQ 100" },
        { s: "SP:SPX", d: "S&P 500" }
      ],
    });

    containerRef.current?.appendChild(script);
  }, []);

  return <div ref={containerRef} className="tradingview-widget-container" />;
}
