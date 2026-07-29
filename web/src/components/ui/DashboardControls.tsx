import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Sliders,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { PlanetData } from '../../types';
import { CELESTIAL_BODIES } from '../../data/planetsData';

interface DashboardControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  timeMultiplier: number;
  onSetTimeMultiplier: (speed: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onSelectBody: (body: PlanetData | null) => void;
  selectedBody: PlanetData | null;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  timeMultiplier,
  onSetTimeMultiplier,
  isPaused,
  onTogglePause,
  onSelectBody,
  selectedBody,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  // Deep space ambient synthesizer using Web Audio API
  const toggleSpaceAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Low frequency space drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2 note

      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      setIsPlayingAudio(true);
    } else {
      if (audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
        setIsPlayingAudio(false);
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        setIsPlayingAudio(true);
      }
    }
  };

  return (
    <>
      {/* Right Side Zoom Slider Control */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center space-y-3 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <button
          onClick={onZoomIn}
          className="p-2 rounded-full bg-white/5 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-all active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Vertical Track Visual */}
        <div className="w-1 h-20 bg-slate-800 rounded-full relative overflow-hidden my-1">
          <div
            className="w-full bg-cyan-400 rounded-full transition-all duration-300"
            style={{ height: `${Math.min(100, Math.max(10, zoomLevel * 20))}%` }}
          />
        </div>

        <button
          onClick={onZoomOut}
          className="p-2 rounded-full bg-white/5 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-all active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-Left Navigation D-Pad Control Puck */}
      <div className="fixed bottom-6 left-6 z-20 flex items-center space-x-4">
        <div className="relative w-24 h-24 rounded-full bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center justify-center p-2">
          {/* Outer Directional Arrows */}
          <button className="absolute top-1 text-slate-400 hover:text-cyan-300 p-1">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button className="absolute bottom-1 text-slate-400 hover:text-cyan-300 p-1">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="absolute left-1 text-slate-400 hover:text-cyan-300 p-1">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="absolute right-1 text-slate-400 hover:text-cyan-300 p-1">
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Inner Puck Center Button */}
          <button
            onClick={() => onSelectBody(null)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center text-cyan-300 hover:scale-105 active:scale-95 transition-all"
            title="Reset System View"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Time Speed & Animation Control Pill */}
        <div style={{ display: 'none' }} className="sm:!flex items-center space-x-2 bg-slate-900/70 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-xl text-xs text-white">
          <button
            onClick={onTogglePause}
            className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 transition-all active:scale-95"
            title={isPaused ? 'Resume Orbit' : 'Pause Orbit'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-1 pl-2 border-l border-white/10">
            {[1, 10, 100, 1000].map((speed) => (
              <button
                key={speed}
                onClick={() => onSetTimeMultiplier(speed)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                  timeMultiplier === speed
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Ambient Audio Toggle */}
          <button
            onClick={toggleSpaceAudio}
            className={`p-2 rounded-xl ml-2 border transition-all ${
              isPlayingAudio
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Toggle Space Ambient Sound"
          >
            {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom-Right Toolbar Icons */}
      <div className="fixed bottom-6 right-6 z-20 flex items-center space-x-2 bg-slate-900/70 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl text-slate-300">
        {/* Quick Jump Buttons for Planets */}
        <div style={{ display: 'none' }} className="md:!flex items-center space-x-1.5 pr-2 border-r border-white/10">
          {CELESTIAL_BODIES.slice(0, 9).map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBody(b)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                selectedBody?.id === b.id
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
            >
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelectBody(null)}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-300 transition-colors"
          title="All System View"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
