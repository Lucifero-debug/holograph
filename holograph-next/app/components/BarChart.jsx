// src/components/BarChart3D.tsx
"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Environment, Text } from "@react-three/drei";

// ---------------- BAR ----------------
const Bar = ({ position, height, color, label, value }) => {
  const meshRef = useRef(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.scale.y = Math.min(
      meshRef.current.scale.y + delta * 2,
      1
    );
  });

  return (
    <group position={position}>
      {/* BAR */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        scale={[1, 0.001, 1]}
      >
        <boxGeometry args={[0.8, height, 0.8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* X-AXIS LABEL */}
      <Text
        position={[0, -0.4, 0.6]}
        fontSize={0.28}
        color="white"
        anchorX="center"
        anchorY="top"
        depthOffset={-1}

      >
        {label}
      </Text>

      {/* VALUE LABEL */}
      <Text
        position={[0, height + 0.4, 0]}
        fontSize={0.28}
        color={color}
        anchorX="center"
        anchorY="bottom"
        depthOffset={-1}

      >
{Number(value).toFixed(1)}

      </Text>
    </group>
  );
};

// ---------------- MAIN ----------------
export default function BarChart3D({ config, data }) {
  const theme = {
    primary: "#00f3ff",
    secondary: "#0066ff",
    grid: "#1a1a1a",
  };

  const xKey = config?.x_axis;
  const yKey = config?.y_axis;

const processedData = useMemo(() => {
  if (!data || data.length === 0) return [];

  const values = data.map(d => Number(d[yKey]));
  const maxValue = Math.max(...values);

  return data.map((item, index) => {
    const rawValue = Number(item[yKey]);
    const height = maxValue > 0 ? (rawValue / maxValue) * 6 : 0.1;
    const xPos = (index - (data.length - 1) / 2) * 1.5;

    return {
      x: xPos,
      height,
      label: String(item[xKey]),
      value: rawValue
    };
  });
}, [data, xKey, yKey]);


  return (
    <div className="w-full h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
    <Canvas camera={{ position: [8, 6, 8], fov: 45 }}>

        {/* LIGHTS */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        <spotLight
          position={[-10, 10, -10]}
          intensity={2}
          color={theme.secondary}
        />

        {/* CONTROLS */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.5}
        />

        {/* BARS */}
        <group>
          {processedData.map((d, i) => (
            <Bar
              key={i}
              position={[d.x, 0, 0]}
              height={d.height}
              color={theme.primary}
              label={d.label}
              value={d.value}
            />
          ))}
        </group>

        {/* GRID */}
        <Grid
          position={[0, -0.01, 0]}
          args={[20, 20]}
          cellColor={theme.grid}
          sectionColor={theme.primary}
          fadeDistance={15}
        />

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
