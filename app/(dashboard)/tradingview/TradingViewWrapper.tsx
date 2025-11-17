"use client";

import dynamic from "next/dynamic";

// Load the TradingView widget only on client
const TradingViewDashboard = dynamic(
  () => import("./TradingViewWidget"),
  { ssr: false }
);

export default function TradingViewWrapper() {
  return <TradingViewDashboard />;
}
