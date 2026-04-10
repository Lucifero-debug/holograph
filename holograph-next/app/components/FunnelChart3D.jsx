"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo } from "react";

function FunnelSlice({ radius, height, yPos, color, label, value }) {
  return (
    <group position={[0, yPos, 0]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <Text position={[radius + 0.5, 0, 0]} fontSize={0.3} color="white">
        {label}: {value.toLocaleString()}
      </Text>
    </group>
  );
}

export default function FunnelChart3D({ data, config }) {
  const { x_axis, y_axis } = config;
  const colors = ["#00ffff", "#00ccff", "#0099ff", "#0066ff", "#0033ff"];

  const slices = useMemo(() => {
    const sorted = [...data].sort((a, b) => b[y_axis] - a[y_axis]);
    const maxVal = sorted[0][y_axis];
    let yPos = (sorted.length * 1.2) / 2;

    return sorted.map((d, i) => {
      const radius = (d[y_axis] / maxVal) * 2.5 + 0.3;
      const slice = {
        radius,
        height: 1,
        yPos,
        color: colors[i % colors.length],
        label: String(d[x_axis]),
        value: d[y_axis],
      };
      yPos -= 1.2;
      return slice;
    });
  }, [data, x_axis, y_axis]);

  return (
    <div className="w-full h-96 bg-gray-900 rounded-xl border border-cyan-500">
      <Canvas camera={{ position: [6, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        {slices.map((s, i) => (
          <FunnelSlice key={i} {...s} />
        ))}
      </Canvas>
    </div>
  );
}