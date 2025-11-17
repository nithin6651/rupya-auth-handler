"use client";

export default function TVTechnical({ symbol = "NSE:RELIANCE" }) {
  return (
    <div>
      <script
        src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            symbol,
            interval: "D",
            width: "100%",
            height: 450,
            theme: "dark",
          }),
        }}
      />
    </div>
  );
}
