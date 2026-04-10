// src/app/page.tsx
"use client";

import React, { useState } from 'react';
// Note: We import the default export from the component
import HoloChart from './components/Holograph';


export default function Home() {
  const [query, setQuery] = useState("");
  const [chartData, setChartData] = useState([]);
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  setLoading(true);

  try {
    const res = await fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!json.error) {
      setChartData(json.data);
      setConfig(json.config ); // fallback config
    }
  } catch (err) {
    console.error(err);
  }

  setLoading(false);
};

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
       console.log("RAW BACKEND RESPONSE:", JSON.stringify(json.config));
      console.log("muthi",json)
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

      <div className="mb-6">
  <input
    type="file"
    accept=".csv,.json"
    onChange={handleFileUpload}
    className="block w-full text-sm text-gray-400
      file:mr-4 file:py-2 file:px-4
      file:rounded-lg file:border-0
      file:text-sm file:font-semibold
      file:bg-cyan-600 file:text-white
      hover:file:bg-cyan-500"
  />
</div>

      {/* 3D CHART CONTAINER */}
      <div className="w-full max-w-5xl">
        <HoloChart config={config} data={chartData} />
      </div>

    </main>
  );
}