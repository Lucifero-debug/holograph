"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo } from "react";

function Bubble({ x, y, size, color, label }) {
  return (
    <group position={[x, y, 0]}>
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, size + 0.2, 0]} fontSize={0.3} color="white">
        {label}
      </Text>
    </group>
  );
}

export default function BubbleChart3D({ data, config }) {
  const { x_axis, y_axis, size_axis } = config;

const normalized = useMemo(() => {
  const yValues = data.map(r => r[y_axis]).filter(v => typeof v === "number" && !isNaN(v));
  const maxY = Math.max(...yValues) || 1;

  // fallback to y_axis if size_axis missing
  const sizeKey = size_axis && data[0]?.[size_axis] !== undefined ? size_axis : y_axis;
  const sizeValues = data.map(r => r[sizeKey]).filter(v => typeof v === "number" && !isNaN(v));
  const maxSize = Math.max(...sizeValues) || 1;

  return data.map((d, i) => {
    const yVal = typeof d[y_axis] === "number" && !isNaN(d[y_axis]) ? d[y_axis] : 0;
    const sVal = typeof d[sizeKey] === "number" && !isNaN(d[sizeKey]) ? d[sizeKey] : 1;

    return {
      x: (i - data.length / 2) * 2,
      y: (yVal / maxY) * 4,
      size: Math.max((sVal / maxSize) * 1.2 + 0.2, 0.1), // never below 0.1
      label: String(d[x_axis] ?? ""),
    };
  });
}, [data, x_axis, y_axis, size_axis]);

  const colors = ["#00ffff", "#ff00ff", "#ffff00", "#00ff88", "#ff6600"];

  return (
    <div className="w-full h-96 bg-gray-900 rounded-xl border border-cyan-500">
      <Canvas camera={{ position: [0, 0, 12] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {normalized.map((b, i) => (
          <Bubble key={i} {...b} color={colors[i % colors.length]} />
        ))}
      </Canvas>
    </div>
  );
}