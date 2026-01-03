"use client";

import { useEffect, useRef } from "react";

export default function MiniCharts() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.firstChild) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol: "NSE:NIFTY",
      width: "100%",
      height: "220",
      locale: "en",
      dateRange: "12M",
      colorTheme: "dark",
      trendLineColor: "#37a6ef",
      underLineColor: "rgba(55, 166, 239, 0.15)",
      isTransparent: true
    });

    ref.current?.appendChild(script);
  }, []);

  return <div ref={ref} className="tradingview-widget-container" />;
}
