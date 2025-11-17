
import TradingViewTickerTape from "./TradingViewTickerTape";
import TradingViewWidget from "./tradingviewwidget";

export default function TradingViewDashboard() {
  return (
    <div>

      <TradingViewTickerTape />

      <h1 style={{ marginBottom: 20 }}>📊 TradingView Dashboard</h1>

      {/* Market Overview */}
      <TradingViewWidget
        widget="market-overview"
        height="550px"
        config={{
          colorTheme: "dark",
          dateRange: "12M",
          showChart: true,
          locale: "en",
          isTransparent: false,
          width: "100%",
          height: "550",
          tabs: [
            {
              title: "Indices",
              symbols: [
                { s: "NSE:NIFTY" },
                { s: "BSE:SENSEX" },
                { s: "NSE:BANKNIFTY" }
              ]
            }
          ]
        }}
      />

      {/* Heatmap */}
      <div style={{ marginTop: "40px" }}>
        <TradingViewWidget
          widget="heatmap"
          height="600px"
          config={{
            dataSource: "INDIA",
            grouping: "sector",
            blockSize: "market_cap_basic",
            colorTheme: "dark",
            locale: "en"
          }}
        />
      </div>

    </div>
  );
}
