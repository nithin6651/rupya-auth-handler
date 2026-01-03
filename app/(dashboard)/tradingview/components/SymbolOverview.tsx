"use client";

import { useEffect, useRef } from "react";

export default function SymbolOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current?.firstChild) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        ["NSE:NIFTY|1D"],
        ["NSE:BANKNIFTY|1D"],
        ["NASDAQ:TSLA|1D"],
      ],
      chartOnly: false,
      width: "100%",
      height: "450",
      colorTheme: "dark",
      gridLineColor: "rgba(240, 243, 250, 0.06)",
      locale: "en",
      isTransparent: true
    });

    containerRef.current?.appendChild(script);
  }, []);

  return <div ref={containerRef} className="tradingview-widget-container" />;
}
