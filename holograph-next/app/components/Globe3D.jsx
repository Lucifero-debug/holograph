// src/components/Globe3D.tsx
"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Text } from "@react-three/drei";
import * as THREE from "three";

// ---------------- REGION → LAT/LON ----------------
const REGION_COORDS = {
  Asia: [34, 100],
  Europe: [54, 15],
  "North America": [40, -100],
  "South America": [-15, -60],
  Africa: [1, 20],
  Australia: [-25, 133],
};

// ---------------- UTILS ----------------
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// ---------------- GLOBE ----------------
function RotatingGlobe() {
  const globeRef = useRef(null);

  useFrame((_, delta) => {
    if (!globeRef.current) return;
    globeRef.current.rotation.y += delta * 0.15;
  });

  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[2.5, 64, 64]} />
      <meshStandardMaterial
        color="#001122"
        emissive="#00f3ff"
        emissiveIntensity={0.35}
        wireframe
      />
    </mesh>
  );
}

// ---------------- DATA POINT ----------------
function GlobePoint({ lat, lon, value, label, maxValue }) {
  const pointRef = useRef(null);

  const radius = 2.55;
  const position = useMemo(
    () => latLonToVector3(lat, lon, radius),
    [lat, lon]
  );

  const size =
    maxValue > 0 ? Math.max(0.08, (value / maxValue) * 0.35) : 0.12;

  useFrame(({ clock }) => {
    if (!pointRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 3) * 0.2;
    pointRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group position={position.toArray()}>
      {/* GLOW POINT */}
      <mesh ref={pointRef}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color="#00f3ff"
          emissive="#00f3ff"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* LABEL (NO depthOffset ❗) */}
      <Text
        position={[0, 0.35, 0]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {label}
      </Text>
    </group>
  );
}

// ---------------- CAMERA ----------------
function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.15;
    camera.position.x = Math.sin(t) * 7;
    camera.position.z = Math.cos(t) * 7;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ---------------- MAIN ----------------
export default function Globe3D({ config, data }) {
  const yKey = config?.y_axis;

  const points = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .filter((d) => REGION_COORDS[d.region])
      .map((d) => {
        const [lat, lon] = REGION_COORDS[d.region];
        return {
          lat,
          lon,
          value: Number(d[yKey]),
          label: `${d.region}: ${Number(d[yKey]).toLocaleString()}`,
        };
      });
  }, [data, yKey]);

  const maxValue =
    points.length > 0
      ? Math.max(...points.map((p) => p.value))
      : 1;

  return (
    <div className="w-full h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20">
      <Canvas camera={{ position: [0, 3, 8], fov: 45 }}>
        {/* LIGHTS */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />

        {/* CAMERA */}
        <CameraRig />

        {/* GLOBE */}
        <RotatingGlobe />

        {/* DATA POINTS */}
        {points.map((p, i) => (
          <GlobePoint
            key={i}
            lat={p.lat}
            lon={p.lon}
            value={p.value}
            label={p.label}
            maxValue={maxValue}
          />
        ))}

        {/* GRID */}
        <Grid
          position={[0, -2.8, 0]}
          args={[20, 20]}
          cellColor="#1a1a1a"
          sectionColor="#00f3ff"
          fadeDistance={15}
        />
      </Canvas>
    </div>
  );
}
