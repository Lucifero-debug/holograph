// src/components/GroupedBarChart3D.tsx
"use client";

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Grid } from "@react-three/drei";

// 🎨 Color palette (auto-cycled)
const COLORS = ["#00f3ff", "#ff6ec7", "#ffd166", "#06d6a0", "#8338ec"];

/* ---------------- ROLE HELPERS ---------------- */

function getMetricKey(roles) {
  return Object?.keys(roles).find((k) => roles[k].role === "metric");
}

function getTemporalKeys(roles) {
  return Object.entries(roles)
    .filter(([, v]) => v.role === "temporal")
    .sort((a, b) =>
      (a[1].granularity ?? "medium") < (b[1].granularity ?? "medium") ? 1 : -1
    )
    .map(([k]) => k);
}

function getCategoricalKeys(roles) {
  return Object.keys(roles).filter(
    (k) => roles[k].role === "categorical"
  );
}

/* ---------------- BAR ---------------- */

function Bar({ position, height, color, value }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.5, height, 0.5]} />
        <meshStandardMaterial color={color} emissive={color} />
      </mesh>

      <Text
        position={[0, height + 0.25, 0]}
        fontSize={0.22}
        color={color}
        anchorX="center"
        anchorY="bottom"
      >
        {value.toLocaleString()}
      </Text>
    </group>
  );
}

/* ---------------- MAIN ---------------- */

export default function GroupedBarChart3D({ data, config, roles }) {
      if (!roles || Object.keys(roles).length === 0) {
    console.warn("GroupedBarChart3D: roles not ready");
    return null;
  }
  const metricKey = getMetricKey(roles);

  const temporalKeys = getTemporalKeys(roles);
  const categoricalKeys = getCategoricalKeys(roles);

  // Decide grouping logic dynamically
  const groupKey = temporalKeys[temporalKeys.length - 1] ?? categoricalKeys[0];
  const seriesKey = categoricalKeys.find((k) => k !== groupKey);

  // 🧠 Build grouped structure: group → series → value
  const groupedData = useMemo(() => {
    const map = {};

    data.forEach((row) => {
      const g = row[groupKey];
      const s = row[seriesKey];
      const v = Number(row[metricKey]) || 0;

      if (!map[g]) map[g] = {};
      map[g][s] = v;
    });

    return map;
  }, [data, groupKey, seriesKey, metricKey]);

  const groups = Object.keys(groupedData);
  const series = Array.from(new Set(data.map((d) => d[seriesKey])));

  const maxValue = Math.max(
    ...data.map((d) => Number(d[metricKey]) || 0),
    1
  );

  // 📐 Layout constants
  const GROUP_SPACING = 3.5;
  const BAR_OFFSET = 0.7;

  return (
    <div className="relative w-full h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
      
      {/* 📘 LEGEND */}
      <div className="absolute top-4 right-4 bg-black/70 p-3 rounded-lg space-y-1 z-10">
        {series.map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-white text-sm">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            {s}
          </div>
        ))}
      </div>

      {/* 🎥 3D SCENE */}
      <Canvas camera={{ position: [0, 7, 14], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} />

        <OrbitControls enablePan={false} />

        <Grid
          position={[0, -0.01, 0]}
          args={[30, 30]}
          cellColor="#1a1a1a"
          sectionColor="#00f3ff"
          fadeDistance={20}
        />

        {/* 📊 GROUPED BARS */}
        {groups.map((group, gi) => {
          const baseX =
            (gi - (groups.length - 1) / 2) * GROUP_SPACING;

          return (
            <group key={group}>
              {series.map((s, si) => {
                const value = groupedData[group]?.[s] ?? 0;
                const height = (value / maxValue) * 5;

                return (
                  <Bar
                    key={`${group}-${s}`}
                    position={[
                      baseX +
                        (si - (series.length - 1) / 2) * BAR_OFFSET,
                      0,
                      0,
                    ]}
                    height={Math.max(0.1, height)}
                    color={COLORS[si % COLORS.length]}
                    value={value}
                  />
                );
              })}

              {/* 🏷️ GROUP LABEL */}
              <Text
                position={[baseX, -0.6, 1]}
                fontSize={0.35}
                color="#ffffff"
                anchorX="center"
                anchorY="top"
              >
                {group}
              </Text>
            </group>
          );
        })}
      </Canvas>
    </div>
  );
}
