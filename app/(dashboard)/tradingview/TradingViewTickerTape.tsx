"use client";
import { useEffect, useRef } from "react";

export default function TradingViewTickerTape() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "NSE:NIFTY", title: "NIFTY 50" },
        { proName: "NSE:BANKNIFTY", title: "BANK NIFTY" },
        { proName: "BSE:SENSEX", title: "SENSEX" }
      ],
      colorTheme: "dark",
      isTransparent: false,
      displayMode: "regular",
      locale: "en"
    });

    if (ref.current) ref.current.appendChild(script);

    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, []);

  return <div ref={ref} style={{ marginBottom: "20px" }} />;
}
