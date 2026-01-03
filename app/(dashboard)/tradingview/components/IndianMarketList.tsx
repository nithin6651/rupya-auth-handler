"use client";

import { useEffect, useRef } from "react";

export default function IndianMarketList() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.firstChild) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      width: "100%",
      height: "600",
      locale: "en",
      symbolsGroups: [
        {
          name: "NSE",
          symbols: [
            { name: "NSE:NIFTY", displayName: "Nifty 50" },
            { name: "NSE:BANKNIFTY", displayName: "Bank Nifty" },
            { name: "NSE:RELIANCE", displayName: "Reliance" },
            { name: "NSE:TCS", displayName: "TCS" },
            { name: "NSE:INFY", displayName: "Infosys" },
          ],
        },
        {
          name: "BSE",
          symbols: [
            { name: "BSE:SENSEX", displayName: "Sensex" },
            { name: "BSE:BANK", displayName: "BSE Bankex" },
            { name: "BSE:500325", displayName: "Reliance" },
            { name: "BSE:532540", displayName: "TCS" },
          ],
        },
      ],
    });

    ref.current?.appendChild(script);
  }, []);

  return <div ref={ref} className="tradingview-widget-container" />;
}
