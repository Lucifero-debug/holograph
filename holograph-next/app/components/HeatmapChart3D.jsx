"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo } from "react";

function Cell({ x, z, height, color, label }) {
  const safeHeight = isNaN(height) || height <= 0 ? 0.1 : height;

  return (
    <group position={[x, safeHeight / 2, z]}>
      <mesh>
        <boxGeometry args={[0.9, safeHeight, 0.9]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, safeHeight / 2 + 0.3, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
      >
        {label}
      </Text>
    </group>
  );
}

function getHeatColor(ratio) {
  // blue → cyan → green → yellow → red
  const r = Math.round(255 * ratio);
  const b = Math.round(255 * (1 - ratio));
  return `rgb(${r}, 100, ${b})`;
}

export default function HeatmapChart3D({ data, config }) {
  const { x_axis, y_axis } = config;

const cells = useMemo(() => {
  if (!data || data.length === 0) return [];

  const yValues = data
    .map(d => parseFloat(d[y_axis]))
    .filter(v => !isNaN(v));

  if (yValues.length === 0) return [];

  const maxVal = Math.max(...yValues) || 1;

  return data.map((d, i) => {
    const val = parseFloat(d[y_axis]);
    const safeVal = isNaN(val) ? 0 : val;
    const ratio = safeVal / maxVal;

    return {
      x: (i - data.length / 2) * 1.2,
      z: 0,
      height: Math.max(ratio * 4, 0.1), // never 0 or NaN
      color: getHeatColor(ratio),
      label: String(d[x_axis] ?? ""),
    };
  });
}, [data, x_axis, y_axis]);

  return (
    <div className="w-full h-96 bg-gray-900 rounded-xl border border-cyan-500">
      <Canvas camera={{ position: [0, 6, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {cells.map((c, i) => (
          <Cell key={i} {...c} />
        ))}
      </Canvas>
    </div>
  );
}