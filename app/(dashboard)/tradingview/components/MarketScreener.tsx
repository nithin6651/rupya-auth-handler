"use client";

import { useEffect, useRef } from "react";

export default function MarketScreener() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.firstChild) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-stock-screener.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "600",
      defaultColumn: "overview",
      defaultScreen: "most_capitalized",
      market: "india",
      colorTheme: "dark",
      locale: "en",
      isTransparent: true,
    });

    ref.current?.appendChild(script);
  }, []);

  return <div ref={ref} className="tradingview-widget-container" />;
}
