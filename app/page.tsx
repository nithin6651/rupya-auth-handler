export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0B0D] text-white p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold">Rupya</h1>
        <p className="text-gray-400 mt-4 text-lg">
          Your Intelligent Trading Dashboard — Portfolio, Analytics, Screeners & More.
        </p>

        <div className="mt-10 grid gap-6">
          <a href="/tradingview" className="p-6 rounded-xl bg-[#151518] hover:bg-[#1E1E22]">
            <h2 className="text-2xl font-semibold">TradingView Dashboard →</h2>
            <p className="text-gray-400 mt-2">Heatmap, Screener, Advanced Charts</p>
          </a>

          <a href="/dashboard" className="p-6 rounded-xl bg-[#151518] hover:bg-[#1E1E22]">
            <h2 className="text-2xl font-semibold">Portfolio & Orders →</h2>
            <p className="text-gray-400 mt-2">Your Upstox-linked real-time data</p>
          </a>

          <a href="/screeners" className="p-6 rounded-xl bg-[#151518] hover:bg-[#1E1E22]">
            <h2 className="text-2xl font-semibold">Custom Screeners →</h2>
            <p className="text-gray-400 mt-2">Your saved strategies & results</p>
          </a>
        </div>
      </div>
    </main>
  );
}
