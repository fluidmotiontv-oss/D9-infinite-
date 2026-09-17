import React from 'react';
import { 
  Sliders, 
  RotateCw, 
  Grid, 
  Layers, 
  Sparkles, 
  Palette, 
  Eye, 
  Play, 
  Pause, 
  RefreshCw,
  X,
  Gauge
} from 'lucide-react';
import { EngineParams, RenderMode, ColorTheme } from '../types';
import { COLOR_THEMES } from '../data/galleryData';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  params: EngineParams;
  onChangeParams: (newParams: Partial<EngineParams>) => void;
  onResetDefaults: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isOpen,
  onClose,
  params,
  onChangeParams,
  onResetDefaults
}) => {
  if (!isOpen) return null;

  const renderModes: { id: RenderMode; label: string; desc: string }[] = [
    { id: 'hybrid', label: 'Hybrid Mesh', desc: 'Combined volumetric surface and particle flux' },
    { id: 'holographic', label: 'Holographic', desc: 'Semi-transparent glowing vector manifold' },
    { id: 'wireframe', label: 'Wireframe Matrix', desc: 'Pure topological coordinate lines & vertices' },
    { id: 'particles', label: 'Particle Cloud', desc: 'Discrete synchronized flow particles' },
    { id: 'solid', label: 'Solid Shader', desc: 'High-contrast specular metallic surface' }
  ];

  return (
    <aside className="absolute top-28 right-4 z-40 w-84 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8.5rem)] overflow-y-auto glass-panel-glow rounded-2xl p-4 flex flex-col gap-5 text-slate-200 border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-cyan-200">
            Quantum Parameters
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id="reset-params-btn"
            onClick={onResetDefaults}
            title="Reset to Exhibit Defaults"
            className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors text-xs flex items-center gap-1 font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[10px]">Reset</span>
          </button>
          <button
            id="close-controls-btn"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Play / Pause & Auto-Rotate Switcher */}
      <div className="grid grid-cols-2 gap-2">
        <button
          id="btn-play-pause"
          onClick={() => onChangeParams({ isPaused: !params.isPaused })}
          className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
            params.isPaused
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(255,170,0,0.2)]'
              : 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_10px_rgba(0,243,255,0.2)]'
          }`}
        >
          {params.isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          <span>{params.isPaused ? 'RESUME FLOW' : 'PAUSE TIME'}</span>
        </button>

        <button
          id="btn-toggle-autorotate"
          onClick={() => onChangeParams({ autoRotate: !params.autoRotate })}
          className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all ${
            params.autoRotate
              ? 'bg-sky-500/20 border-sky-400/50 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${params.autoRotate ? 'animate-spin' : ''}`} />
          <span>AUTO-ORBIT</span>
        </button>
      </div>

      {/* Color Spectrum Theme */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            Color Spectrum:
          </span>
          <span className="text-[10px] uppercase font-semibold text-cyan-400">
            {COLOR_THEMES[params.colorTheme]?.name || params.colorTheme}
          </span>
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(COLOR_THEMES) as ColorTheme[]).map((themeKey) => {
            const theme = COLOR_THEMES[themeKey];
            const isSelected = params.colorTheme === themeKey;
            return (
              <button
                key={themeKey}
                id={`theme-btn-${themeKey}`}
                onClick={() => onChangeParams({ colorTheme: themeKey })}
                title={theme.name}
                className={`h-9 rounded-xl border flex flex-col items-center justify-center relative transition-all duration-150 ${
                  isSelected
                    ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105'
                    : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                }`}
                style={{ backgroundColor: theme.background }}
              >
                <div 
                  className="w-3.5 h-3.5 rounded-full" 
                  style={{ backgroundColor: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }} 
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Mode Switcher */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          Render Topology Mode:
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {renderModes.map((rm) => {
            const isSelected = params.renderMode === rm.id;
            return (
              <button
                key={rm.id}
                id={`render-mode-${rm.id}`}
                onClick={() => onChangeParams({ renderMode: rm.id })}
                className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between text-xs font-mono ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200 font-semibold shadow-[0_0_8px_rgba(0,243,255,0.2)]'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-xs">{rm.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{rm.desc}</div>
                </div>
                {isSelected && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f3ff]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className="flex flex-col gap-4 pt-1">
        {/* Rotation Speed */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              Rotation Speed
            </span>
            <span className="text-cyan-400 font-semibold">{params.rotationSpeed.toFixed(2)}x</span>
          </div>
          <input
            id="slider-rotation-speed"
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={params.rotationSpeed}
            onChange={(e) => onChangeParams({ rotationSpeed: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Loop Frequency */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              Loop Frequency (ω)
            </span>
            <span className="text-cyan-400 font-semibold">{params.loopFrequency.toFixed(2)} Hz</span>
          </div>
          <input
            id="slider-loop-frequency"
            type="range"
            min="0.2"
            max="4.0"
            step="0.1"
            value={params.loopFrequency}
            onChange={(e) => onChangeParams({ loopFrequency: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Coordinate Grid Density */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-sky-400" />
              Grid Tessellation
            </span>
            <span className="text-cyan-400 font-semibold">{params.gridDensity} divisions</span>
          </div>
          <input
            id="slider-grid-density"
            type="range"
            min="8"
            max="64"
            step="2"
            value={params.gridDensity}
            onChange={(e) => onChangeParams({ gridDensity: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Particle Stream Count */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Particle Stream Density
            </span>
            <span className="text-cyan-400 font-semibold">{params.particleCount} pts</span>
          </div>
          <input
            id="slider-particle-count"
            type="range"
            min="500"
            max="10000"
            step="500"
            value={params.particleCount}
            onChange={(e) => onChangeParams({ particleCount: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Wave Amplitude */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              Harmonic Amplitude (A)
            </span>
            <span className="text-cyan-400 font-semibold">{params.waveAmplitude.toFixed(2)}</span>
          </div>
          <input
            id="slider-wave-amplitude"
            type="range"
            min="0"
            max="2.0"
            step="0.05"
            value={params.waveAmplitude}
            onChange={(e) => onChangeParams({ waveAmplitude: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Visibility Toggles */}
      <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
        <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Layer Visibility:
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            id="toggle-axes-btn"
            onClick={() => onChangeParams({ showAxes: !params.showAxes })}
            className={`p-2 rounded-lg border text-center transition-all ${
              params.showAxes 
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            3D Axes: {params.showAxes ? 'ON' : 'OFF'}
          </button>
          <button
            id="toggle-grid-btn"
            onClick={() => onChangeParams({ showGrid: !params.showGrid })}
            className={`p-2 rounded-lg border text-center transition-all ${
              params.showGrid 
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            Octa Grid: {params.showGrid ? 'ON' : 'OFF'}
          </button>
          <button
            id="toggle-normals-btn"
            onClick={() => onChangeParams({ showNormals: !params.showNormals })}
            className={`p-2 rounded-lg border text-center transition-all col-span-2 ${
              params.showNormals 
                ? 'bg-purple-500/20 border-purple-400/50 text-purple-200' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            Surface Normal Vectors: {params.showNormals ? 'VISIBLE' : 'HIDDEN'}
          </button>
        </div>
      </div>
    </aside>
  );
};
