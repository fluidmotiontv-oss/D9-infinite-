import React, { useState } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Eye, 
  Layers, 
  Download, 
  Check, 
  Play, 
  Pause,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass
} from 'lucide-react';

interface QuickActionToolbarProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onResetView: () => void;
  onCaptureSnapshot: () => void;
  onSetCameraPreset: (preset: 'top' | 'front' | 'side' | 'iso') => void;
}

export const QuickActionToolbar: React.FC<QuickActionToolbarProps> = ({
  isPaused,
  onTogglePause,
  onResetView,
  onCaptureSnapshot,
  onSetCameraPreset
}) => {
  const [activePreset, setActivePreset] = useState<'top' | 'front' | 'side' | 'iso'>('iso');
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  const handleSnapshot = () => {
    onCaptureSnapshot();
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2000);
  };

  const handlePresetClick = (preset: 'top' | 'front' | 'side' | 'iso') => {
    setActivePreset(preset);
    onSetCameraPreset(preset);
  };

  const handleZoomIn = () => {
    if ((window as any).__zoom3DCamera) {
      (window as any).__zoom3DCamera(0.82);
    }
  };

  const handleZoomOut = () => {
    if ((window as any).__zoom3DCamera) {
      (window as any).__zoom3DCamera(1.22);
    }
  };

  const handleCenterTarget = () => {
    if ((window as any).__reset3DCameraTarget) {
      (window as any).__reset3DCameraTarget();
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel-glow border border-cyan-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      {/* Camera View Angle Buttons */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        <button
          id="preset-iso-btn"
          onClick={() => handlePresetClick('iso')}
          title="Isometric 3D Perspective"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            activePreset === 'iso'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ISO
        </button>
        <button
          id="preset-top-btn"
          onClick={() => handlePresetClick('top')}
          title="Top Plan View"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            activePreset === 'top'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          TOP
        </button>
        <button
          id="preset-front-btn"
          onClick={() => handlePresetClick('front')}
          title="Front Elevation View"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            activePreset === 'front'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          FRONT
        </button>
        <button
          id="preset-side-btn"
          onClick={() => handlePresetClick('side')}
          title="Side Profile View"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
            activePreset === 'side'
              ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,243,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          SIDE
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Interactive Orbit Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
        <button
          id="btn-zoom-in"
          onClick={handleZoomIn}
          title="Zoom In Camera (or scroll up)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all text-xs"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-zoom-out"
          onClick={handleZoomOut}
          title="Zoom Out Camera (or scroll down)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all text-xs"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          id="btn-center-target"
          onClick={handleCenterTarget}
          title="Recenter Coordinate Origin (or 2x click canvas)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all text-xs"
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-6 bg-slate-800" />

      {/* Snapshot Capture */}
      <button
        id="btn-snapshot"
        onClick={handleSnapshot}
        title="Export 4K High-Res WebGL Snapshot"
        className={`p-2 rounded-xl border text-xs font-mono transition-all flex items-center gap-1.5 ${
          snapshotSuccess
            ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 shadow-[0_0_10px_rgba(0,255,136,0.3)]'
            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 hover:border-cyan-500/40'
        }`}
      >
        {snapshotSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Camera className="w-4 h-4" />}
        <span className="hidden sm:inline text-[11px]">{snapshotSuccess ? 'SAVED' : 'SNAP'}</span>
      </button>

      {/* Reset Camera Orbit */}
      <button
        id="btn-reset-view"
        onClick={onResetView}
        title="Reset Camera Coordinates and Orbit Center"
        className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-xs"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Play/Pause Button */}
      <button
        id="btn-quick-play-pause"
        onClick={onTogglePause}
        title={isPaused ? 'Resume Animation' : 'Pause Animation'}
        className={`p-2 rounded-xl border text-xs font-mono transition-all ${
          isPaused
            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
            : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
        }`}
      >
        {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
      </button>
    </div>
  );
};
