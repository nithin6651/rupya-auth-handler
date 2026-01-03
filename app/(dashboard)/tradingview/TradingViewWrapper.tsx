"use client";

import TickerTape from "./components/TickerTape";
import MarketOverview from "./components/MarketOverview";
import SymbolOverview from "./components/SymbolOverview";
import TechnicalAnalysis from "./components/TechnicalAnalysis";
import Heatmap from "./components/Heatmap";
import MiniCharts from "./components/Minicharts";
import IndianMarketList from "./components/IndianMarketList";
import MarketScreener from "./components/MarketScreener";

export default function TradingViewWrapper() {
  return (
    <div className="flex flex-col gap-6">
      <TickerTape />
      <MarketOverview />
      <SymbolOverview />
      <TechnicalAnalysis symbol="NSE:NIFTY" />
      <Heatmap />
      <MiniCharts />
      <IndianMarketList />
      <MarketScreener />
    </div>
  );
}
