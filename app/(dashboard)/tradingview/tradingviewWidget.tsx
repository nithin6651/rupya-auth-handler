"use client";
import { useEffect, useRef } from "react";

export default function TradingViewMarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;

    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "12M",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "600",
      largeChartUrl: "",
      isTransparent: false,
      showSymbolLogo: true,
      symbols: [
        { description: "Reliance", s: "NSE:RELIANCE" },
        { description: "HDFC Bank", s: "NSE:HDFCBANK" },
        { description: "TCS", s: "NSE:TCS" }
      ],
    });

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "600px", borderRadius: 8 }}
    ></div>
  );
}
