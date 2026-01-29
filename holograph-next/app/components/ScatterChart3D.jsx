// src/components/ScatterChart3D.tsx
"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";

// ---------------- DOT ----------------
const Dot = ({ basePosition, color, label }) => {
  const meshRef = useRef(null);
  const speed = useRef(Math.random() * 0.5 + 0.3);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // subtle floating
    meshRef.current.position.y =
      basePosition[1] +
      Math.sin(clock.elapsedTime * speed.current) * 0.25;
  });

  return (
    <group position={basePosition}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* LABEL */}
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="bottom"
        depthOffset={-1}
      >
        {label}
      </Text>
    </group>
  );
};

function CameraLookAt() {
  useFrame(({ camera }) => {
    camera.lookAt(0, 2, 0);
  });
  return null;
}


// ---------------- MAIN ----------------
export default function ScatterChart3D({ config, data }) {
  const xKey = config?.x_axis;
  const yKey = config?.y_axis;

const points = useMemo(() => {
  if (!data || data.length === 0) return [];

  const values = data.map((d) => Number(d[yKey]));
  const maxValue = Math.max(...values);

  return data.map((item, index) => {
    const x = (index - (data.length - 1) / 2) * 2; // tighter spread
    const y = maxValue > 0 ? (Number(item[yKey]) / maxValue) * 3 + 0.5 : 1;
    const z = 0; // KEEP ZERO for now (important)

    return {
      position: [x, y, z],
      label: `${item[xKey]} : ${Number(item[yKey]).toLocaleString()}`,
    };
  });
}, [data, xKey, yKey]);


  return (
    <div className="w-full h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
  <Canvas camera={{ position: [0, 6, 12], fov: 50 }}>

        {/* LIGHT */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />
        <CameraLookAt />

        {/* CONTROLS */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.25}
        />

        {/* GRID */}
        <Grid
          position={[0, 0, 0]}
          args={[20, 20]}
          cellColor="#1a1a1a"
          sectionColor="#00f3ff"
          fadeDistance={15}
        />

        {/* POINTS */}
        {points.map((p, i) => (
          <Dot key={i} basePosition={p.position} color="#00f3ff" label={p.label} />
        ))}
      </Canvas>
    </div>
  );
}
