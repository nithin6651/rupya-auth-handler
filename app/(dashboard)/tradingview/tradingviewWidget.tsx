"use client";
import { useEffect, useRef } from "react";

type Props = {
  widget: string;
  config: any;
  height?: string;
};

export default function TradingViewWidget({ widget, config, height = "500px" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear existing scripts (hot reload safe)
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [widget, config]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
