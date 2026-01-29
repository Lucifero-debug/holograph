// src/components/PieChart3D.tsx
"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// 🎨 Color palette for slices
const COLORS = ["#00f3ff", "#ff4ecd", "#ffd166", "#06d6a0", "#9b5de5"];

// ---------------- PIE SLICE ----------------
const PieSlice = ({
  startAngle,
  angle,
  radius = 3,
  height = 1,
  color,
  label,
  value,
}) => {
  const meshRef = useRef(null);
  const scaleRef = useRef(0.001);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scaleRef.current = Math.min(scaleRef.current + delta * 2, 1);
    meshRef.current.scale.y = scaleRef.current;
  });

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.absarc(0, 0, radius, startAngle, startAngle + angle, false);
    s.lineTo(0, 0);
    return s;
  }, [startAngle, angle, radius]);

  const midAngle = startAngle + angle / 2;

  // 🔥 explode slice slightly outward
  const offset = 0.18;
  const offsetX = Math.cos(midAngle) * offset;
  const offsetZ = Math.sin(midAngle) * offset;

  const animatedHeight = height * scaleRef.current;

  return (
    <group rotation={[-Math.PI / 2.5, 0, 0]}>
      {/* SLICE */}
      <mesh
        ref={meshRef}
        position={[offsetX, 0, offsetZ]}
        scale={[1, 0.001, 1]}
      >
        <extrudeGeometry
          args={[shape, { depth: height, bevelEnabled: false }]}
        />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* LABEL */}
      <Text
        position={[
          Math.cos(midAngle) * (radius + 0.8),
          animatedHeight + 0.35,
          Math.sin(midAngle) * (radius + 0.8),
        ]}
        fontSize={0.28}
        color="white"
        anchorX="center"
        anchorY="middle"
        depthOffset={-1}
      >
        {label}
      </Text>

      {/* VALUE */}
      <Text
        position={[
          Math.cos(midAngle) * (radius + 0.8),
          animatedHeight + 0.65,
          Math.sin(midAngle) * (radius + 0.8),
        ]}
        fontSize={0.22}
        color={color}
        anchorX="center"
        anchorY="middle"
        depthOffset={-1}
      >
        {Number(value).toLocaleString()}
      </Text>
    </group>
  );
};

// ---------------- MAIN ----------------
export default function PieChart3D({ config, data }) {
  const xKey = config?.x_axis;
  const yKey = config?.y_axis;

 const slices = useMemo(() => {
  const filtered = data.filter(
    (d) => Number.isFinite(Number(d[yKey])) && Number(d[yKey]) > 0
  );

  if (filtered.length === 0) return [];

  const total = filtered.reduce(
    (s, d) => s + Number(d[yKey]),
    0
  );

  let currentAngle = 0;

  return filtered.map((d,i) => {
    const value = Number(d[yKey]);
    const angle = Math.max(
      0.0001,
      (value / total) * Math.PI * 2
    );

    const slice = {
      startAngle: currentAngle,
      angle,
      label: d[xKey],
      value,
       color: COLORS[i % COLORS.length],
    };

    currentAngle += angle;
    return slice;
  });
}, [data, xKey, yKey]);


  return (
    <div className="w-full h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
      <Canvas camera={{ position: [0, 7, 9], fov: 45 }}>
        {/* LIGHTS */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} />

        {/* AUTO ROTATION */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.25}
        />

        {/* SLICES */}
        {slices.map((slice, i) => (
          <PieSlice key={i} {...slice} />
        ))}
      </Canvas>
    </div>
  );
}
