// src/components/Holograph.tsx
"use client";

import React, { useMemo } from "react";
import BarChart3D from "./BarChart";
import GroupedBarChart3D from "./GroupedBarChart3D";
import ScatterChart3D from "./ScatterChart3D";
import PieChart3D from "./PieChart";
import Globe3D from "./Globe3D";
import FallbackChart from "./FallbackChart";
import FacetedGroupedBars from "./FacetedGroupedBars";

/* ---------------- ROLE INFERENCE ---------------- */
function inferColumnRoles(data) {
  if (!data || data.length === 0) return {};

  const sample = data[0];
  const roles = {};

  Object.keys(sample).forEach((key) => {
    const values = data.map((d) => d[key]);
    const unique = new Set(values).size;

    // ---------- TEMPORAL (YEAR-LIKE) ----------
    if (
      values.every((v) => typeof v === "number") &&
      values.every((v) => v > 1900 && v < 2100)
    ) {
      roles[key] = { role: "temporal", granularity: "high" };
      return;
    }

    // ---------- TEMPORAL (QUARTER-LIKE) ----------
    if (
      values.every((v) => typeof v === "string") &&
      values.some((v) => /^Q[1-4]$/.test(v))
    ) {
      roles[key] = { role: "temporal", granularity: "medium" };
      return;
    }

    // ---------- METRIC ----------
    if (values.every((v) => typeof v === "number")) {
      roles[key] = { role: "metric" };
      return;
    }

    // ---------- CATEGORICAL ----------
    if (unique < data.length) {
      roles[key] = {
        role: "categorical",
        granularity: unique <= 5 ? "high" : "medium",
      };
      return;
    }

    roles[key] = { role: "identifier" };
  });

  return roles;
}




function chooseStrategy(roles, chartType) {
  const counts = { metric: 0, temporal: 0, categorical: 0 };

  Object.values(roles).forEach((v) => {
    if (counts[v.role] !== undefined) counts[v.role]++;
  });

  if (counts.metric !== 1) return "FALLBACK";

  if (chartType === "bar_chart_3d") {
    if (counts.temporal >= 2 || counts.categorical >= 2) {
      return "FACET_GROUPED_BAR";
    }
    if (counts.temporal === 1 && counts.categorical >= 1) {
      return "GROUPED_BAR";
    }
    return "BAR";
  }

  return chartType?.toUpperCase();
}



const HoloChart = ({ config, data }) => {
  const roles = useMemo(() => inferColumnRoles(data || []), [data]);
  const strategy = useMemo(
    () => chooseStrategy(roles, config?.chart_type),
    [roles, config]
  );

  if (!config || !data || data.length === 0) {
    return <FallbackChart />;
  }

  switch (strategy) {
    case "GROUPED_BAR":
      console.log("GROUPED_BAR")
      return <GroupedBarChart3D data={data} config={config} roles={roles} />;

    case "BAR":
      console.log("BAR")
      return <BarChart3D data={data} config={config} />;

    case "PIE_3D":
      console.log("PIE_3D")
      return <PieChart3D data={data} config={config} />;

    case "SCATTER_3D":
      console.log("SCATTER_3D")
      return <ScatterChart3D data={data} config={config} />;

    case "GLOBE_3D":
      console.log("GLOBE_3D")
      return <Globe3D data={data} config={config} />;

case "FACET_GROUPED_BAR":
  console.log("FACET_GROUPED_BAR")
  return (
    <FacetedGroupedBars
      data={data}
      config={config}
      roles={roles}
    />
  );



    default:
      console.log("Fallback")
      return <FallbackChart />;
  }
};

export default HoloChart;
