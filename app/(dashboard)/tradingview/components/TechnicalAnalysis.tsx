"use client";

import { useEffect, useRef } from "react";

export default function TechnicalAnalysis({ symbol = "NSE:NIFTY" }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current?.firstChild) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1D",
      width: "100%",
      height: "450",
      colorTheme: "dark",
      isTransparent: true,
      symbol,
      locale: "en"
    });

    containerRef.current?.appendChild(script);
  }, [symbol]);

  return <div ref={containerRef} className="tradingview-widget-container" />;
}
