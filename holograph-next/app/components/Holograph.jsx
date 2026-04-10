"use client";

import React, { useMemo } from "react";
import BarChart3D from "./BarChart";
import ScatterChart3D from "./ScatterChart3D";
import PieChart3D from "./PieChart";
import Globe3D from "./Globe3D";
import FallbackChart from "./FallbackChart";
import BubbleChart3D from "./BubbleChart3D";
import HeatmapChart3D from "./HeatmapChart3D";
import FunnelChart3D from "./FunnelChart3D";

const CHART_MAP = {
  bar_chart_3d: BarChart3D,
  pie_3d: PieChart3D,
  scatter_3d: ScatterChart3D,
  globe_3d: Globe3D,
  bubble_3d: BubbleChart3D,   // 👈
  heatmap_3d: HeatmapChart3D, // 👈
  funnel_3d: FunnelChart3D,   // 👈
};

function generateInsights(data) {
  if (!data || data.length === 0) return [];

  const keys = Object.keys(data[0]);
  const metricKey = keys.find(k => typeof data[0][k] === "number");
  const categoryKey = keys.find(k => typeof data[0][k] === "string");

  if (!metricKey) return [];

  const total = data.reduce((sum, d) => sum + d[metricKey], 0);
  const avg = Math.round(total / data.length);
  const insights = [
    `Total ${metricKey}: ${total.toLocaleString()}`,
    `Average ${metricKey}: ${avg.toLocaleString()}`,
  ];

  if (categoryKey) {
    const top = [...data].sort((a, b) => b[metricKey] - a[metricKey])[0];
    insights.push(`Top ${categoryKey}: ${top[categoryKey]} (${top[metricKey].toLocaleString()})`);
  }

  return insights;
}

const HoloChart = ({ config, data }) => {
  const insights = useMemo(() => generateInsights(data), [data]);

  if (!data || data.length === 0 || !config?.chart_type) {
    return <FallbackChart />;
  }

  const ChartComponent = CHART_MAP[config.chart_type];

  if (!ChartComponent) {
    console.warn("Unknown chart_type from backend:", config.chart_type);
    return <FallbackChart />;
  }

  return (
    <div className="w-full">
      <div className="mb-6 p-4 bg-gray-900 rounded-xl border border-cyan-500">
        <h2 className="text-cyan-400 font-bold mb-2">AI Insights</h2>
        <ul className="list-disc pl-5 text-gray-300">
          {insights.map((insight, i) => <li key={i}>{insight}</li>)}
        </ul>
      </div>

      <ChartComponent data={data} config={config} />
    </div>
  );
};

export default HoloChart;