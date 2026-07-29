import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { PlanetData } from '../../types';
import { CELESTIAL_BODIES } from '../../data/planetsData';
import { Sun } from './Sun';
import { Planet } from './Planet';
import { OrbitRing } from './OrbitRing';
import { SpaceBackground } from './SpaceBackground';

interface CameraControllerProps {
  selectedBody: PlanetData | null;
  zoomLevel: number;
}

const CameraController: React.FC<CameraControllerProps> = ({ selectedBody, zoomLevel }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const desiredCamPos = useRef(new THREE.Vector3(0, 32, 55));

  useEffect(() => {
    if (selectedBody) {
      if (selectedBody.id === 'sun') {
        targetPos.current.set(0, 0, 0);
        desiredCamPos.current.set(0, 8, 18);
      } else {
        // Position camera close to planet distance
        const dist = selectedBody.distanceFromSunAU;
        targetPos.current.set(dist, 0, 0);
        desiredCamPos.current.set(dist + selectedBody.radius * 3.5, selectedBody.radius * 2, selectedBody.radius * 4.5);
      }
    } else {
      // Default Solar System view
      targetPos.current.set(0, 0, 0);
      desiredCamPos.current.set(0, 35 - zoomLevel * 2, 55 - zoomLevel * 3);
    }
  }, [selectedBody, zoomLevel]);

  useFrame((_, delta) => {
    if (controlsRef.current) {
      // Smooth lerp for camera focus
      controlsRef.current.target.lerp(targetPos.current, delta * 3);
      camera.position.lerp(desiredCamPos.current, delta * 3);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      maxDistance={140}
      minDistance={4}
      maxPolarAngle={Math.PI / 1.8}
    />
  );
};

interface SolarSystemCanvasProps {
  selectedBody: PlanetData | null;
  onSelectBody: (body: PlanetData | null) => void;
  timeMultiplier: number;
  isPaused: boolean;
  zoomLevel: number;
}

export const SolarSystemCanvas: React.FC<SolarSystemCanvasProps> = ({
  selectedBody,
  onSelectBody,
  timeMultiplier,
  isPaused,
  zoomLevel,
}) => {
  const sunData = CELESTIAL_BODIES.find((b) => b.id === 'sun')!;
  const planetBodies = CELESTIAL_BODIES.filter((b) => b.type !== 'star' && b.id !== 'moon');

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden select-none">
      <Canvas
        shadows
        camera={{ position: [0, 35, 55], fov: 45, near: 0.1, far: 1000 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onPointerDown={(e) => {
          // Deselect when clicking background space
          if (e.target === e.currentTarget) {
            onSelectBody(null);
          }
        }}
      >
        <color attach="background" args={['#020617']} />

        <CameraController selectedBody={selectedBody} zoomLevel={zoomLevel} />
        <SpaceBackground />

        {/* Orbit Lines for all Planets */}
        {planetBodies.map((planet) => (
          <OrbitRing key={`orbit-${planet.id}`} radius={planet.distanceFromSunAU} />
        ))}

        {/* Sun in Center */}
        <Sun
          data={sunData}
          isSelected={selectedBody?.id === 'sun'}
          onSelect={onSelectBody}
        />

        {/* Planets */}
        {planetBodies.map((planet) => (
          <Planet
            key={planet.id}
            data={planet}
            timeMultiplier={timeMultiplier}
            isPaused={isPaused}
            isSelected={selectedBody?.id === planet.id}
            onSelect={onSelectBody}
          />
        ))}

        {/* Photorealistic Post-Processing Effects: Sun Bloom & Glow */}
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.85}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

