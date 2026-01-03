"use client";

import { useEffect, useRef } from "react";

export default function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current?.firstChild) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "NSE:NIFTY", title: "Nifty 50" },
        { proName: "NSE:BANKNIFTY", title: "Bank Nifty" },
        { proName: "NASDAQ:TSLA", title: "Tesla" },
      ],
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "adaptive",
    });

    containerRef.current?.appendChild(script);
  }, []);

  return <div ref={containerRef} className="tradingview-widget-container"></div>;
}
