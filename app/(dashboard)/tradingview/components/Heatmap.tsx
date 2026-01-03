"use client";

import { useEffect, useRef } from "react";

export default function Heatmap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.firstChild) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      width: "100%",
      height: "600",
      locale: "en",
    });

    ref.current?.appendChild(script);
  }, []);

  return <div ref={ref} className="tradingview-widget-container" />;
}
