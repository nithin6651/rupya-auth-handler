"use client";

import { useEffect, useRef } from "react";

export default function TradingViewWidget() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "1D",
      showChart: true,
      locale: "en",
      width: "100%",
      height: "600",
      isTransparent: false,
      symbols: [
        { s: "NSE:NIFTY", d: "Nifty 50" },
        { s: "NSE:BANKNIFTY", d: "Bank Nifty" },
        { s: "NSE:RELIANCE", d: "Reliance" },
        { s: "NSE:TCS", d: "TCS" }
      ]
    });

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(script);
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: 600 }} />;
}
