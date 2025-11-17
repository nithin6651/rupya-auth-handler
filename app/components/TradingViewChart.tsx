"use client";
import { useEffect } from "react";

export default function TradingViewChart({ symbol = "NSE:NIFTY50" }) {
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.onload = () => {
      new (window as any).TradingView.widget({
        container_id: "chart_box",
        width: "100%",
        height: 600,
        symbol,
        interval: "D",
        theme: "dark",
      });
    };
    document.body.appendChild(s);
  }, [symbol]);

  return <div id="chart_box" />;
}
