// src/app/page.tsx
"use client";

import React, { useState } from 'react';
// Note: We import the default export from the component
import HoloChart from './components/Holograph';

// Dummy Data
const TEST_CONFIG = {
  type: "bar_chart_3d",
  x_axis: "region",
  y_axis: "sales",
  color_theme: "neon_blue",
  camera_action: "rotate_360"
};

const TEST_DATA= [
  { region: "Asia", sales: 45000 },
  { region: "Europe", sales: 32000 },
  { region: "Americas", sales: 58000 }
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [chartData, setChartData] = useState(TEST_DATA);
  const [config, setConfig] = useState(TEST_CONFIG);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query,   
    }),
  });
      const json = await res.json();
      console.log(json)
      if (!json.error) {
        setConfig(json.config);
        setChartData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white p-8 font-sans">
      
      {/* HEADER */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          HoloGraph AI
        </h1>
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-4 mb-8 w-full max-w-2xl">
        <input 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:outline-none focus:border-cyan-500 transition"
          placeholder="Ask your data..."
        />
        <button 
          onClick={handleAsk}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.5)]"
        >
          {loading ? "SCANNING..." : "GENERATE"}
        </button>
      </div>

      {/* 3D CHART CONTAINER */}
      <div className="w-full max-w-5xl">
        <HoloChart config={config} data={chartData} />
      </div>

    </main>
  );
}