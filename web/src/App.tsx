import React, { useState } from 'react';
import { PlanetData } from './types';
import { CELESTIAL_BODIES } from './data/planetsData';
import { SolarSystemCanvas } from './components/3d/SolarSystemCanvas';
import { TopNavbar } from './components/ui/TopNavbar';
import { CenterOverlay } from './components/ui/CenterOverlay';
import { PlanetDetailDrawer } from './components/ui/PlanetDetailDrawer';
import { DashboardControls } from './components/ui/DashboardControls';

export default function App() {
  const [selectedBody, setSelectedBody] = useState<PlanetData | null>(null);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(10);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(3);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 1));
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D Three.js Solar System Canvas */}
      <SolarSystemCanvas
        selectedBody={selectedBody}
        onSelectBody={setSelectedBody}
        timeMultiplier={timeMultiplier}
        isPaused={isPaused}
        zoomLevel={zoomLevel}
      />

      {/* Top Navigation Bar with Telemetry */}
      <TopNavbar onSelectBody={setSelectedBody} selectedBody={selectedBody} />

      {/* Center Overview Title Overlay (Visible when no planet is selected) */}
      <CenterOverlay isVisible={!selectedBody} />

      {/* Right Side Glassmorphic Planet Detail Drawer */}
      <PlanetDetailDrawer
        planet={selectedBody}
        onReturnToSystem={() => setSelectedBody(null)}
      />

      {/* Dashboard Interactive Controls (D-Pad, Zoom slider, Quick jump, Speed controls) */}
      <DashboardControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        timeMultiplier={timeMultiplier}
        onSetTimeMultiplier={setTimeMultiplier}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        onSelectBody={setSelectedBody}
        selectedBody={selectedBody}
      />
    </main>
  );
}
