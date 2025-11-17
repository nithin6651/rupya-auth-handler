"use client";

import TradingViewWidget from "./TradingViewWidget";
import TradingViewTickerTape from "./TradingViewTickerTape";

export default function TradingViewClient() {
  return (
    <div style={{ padding: "24px", background: "#0d0d0d", minHeight: "100vh" }}>
      <h1 style={{ color: "white" }}>TradingView Dashboard</h1>

      <div style={{ marginBottom: 30 }}>
        <TradingViewTickerTape />
      </div>

      <TradingViewWidget />
    </div>
  );
}
