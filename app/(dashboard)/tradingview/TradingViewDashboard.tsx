// COMPLETE RUPYA DASHBOARD LAYOUT
// Includes:
// - Sidebar
// - Top Navigation Bar
// - Dark / Light Theme Support
// - Fully Styled TradingView Dashboard Container
// NOTE: This file is a layout shell. Your TradingView widgets will be rendered inside <DashboardContent /> below.

"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  BarChart,
  LineChart,
  Menu,
  Settings,
  LogOut,
  Sun,
  Moon,
  MonitorSmartphone,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import TradingViewWrapper from "./TradingViewWrapper";

// Wrap your existing TradingView Dashboard inside this component later
function DashboardContent() {
  return (
    <div className="p-4">
      <TradingViewWrapper />
    </div>
  );
}
export default function RupyaDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState("dark");

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
  }

  return (
    <div
      className={`min-h-screen flex w-full transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-black"
      }`}
    >
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-zinc-950 text-white h-screen p-4 flex flex-col border-r border-zinc-800 transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold"
          >
            {sidebarOpen ? "Rupya" : "R"}
          </motion.div>

          <button
            className="p-2 hover:bg-zinc-800 rounded-md"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* MENU ITEMS */}
        <nav className="flex flex-col gap-3">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" open={sidebarOpen} />
          <SidebarItem icon={<LineChart size={18} />} label="TradingView" open={sidebarOpen} />
          <SidebarItem icon={<BarChart size={18} />} label="Market Data" open={sidebarOpen} />
          <SidebarItem
            icon={<MonitorSmartphone size={18} />}
            label="Screeners"
            open={sidebarOpen}
          />
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <SidebarItem icon={<Settings size={18} />} label="Settings" open={sidebarOpen} />
          <SidebarItem icon={<LogOut size={18} />} label="Logout" open={sidebarOpen} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP NAV */}
        <header
          className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 backdrop-blur-md bg-black/20"
        >
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={toggleTheme} className="flex items-center gap-2">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "dark" ? "Light" : "Dark"} Mode
            </Button>

            <Button variant="outline" className="flex items-center gap-2">
              <MonitorSmartphone size={16} />
              Mobile View
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}

/* Sidebar Item component */
function SidebarItem({ icon, label, open }: any) {
  return (
    <button
      className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 transition ${
        open ? "justify-start" : "justify-center"
      }`}
    >
      {icon}
      {open && <span>{label}</span>}
    </button>
  );
}
