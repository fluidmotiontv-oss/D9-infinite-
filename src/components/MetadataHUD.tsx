import React, { useState } from 'react';
import { 
  Activity, 
  Cpu, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Hash, 
  Orbit, 
  Target, 
  Compass,
  Code2
} from 'lucide-react';
import { ExhibitItem, MatrixMetrics } from '../types';

interface MetadataHUDProps {
  isOpen: boolean;
  onClose: () => void;
  currentExhibit: ExhibitItem;
  metrics: MatrixMetrics | null;
}

export const MetadataHUD: React.FC<MetadataHUDProps> = ({
  isOpen,
  onClose,
  currentExhibit,
  metrics
}) => {
  const [copied, setCopied] = useState(false);
  const [isFormulaExpanded, setIsFormulaExpanded] = useState(true);

  if (!isOpen) return null;

  const handleCopyMatrix = () => {
    if (!metrics) return;
    const matrixStr = metrics.matrix4x4.map(row => row.map(v => v.toFixed(4)).join('\t')).join('\n');
    const text = `Formation 3D Transformation Matrix [${currentExhibit.title}]:\n${matrixStr}\n\nQuaternion: (${metrics.quaternion.x.toFixed(4)}, ${metrics.quaternion.y.toFixed(4)}, ${metrics.quaternion.z.toFixed(4)}, ${metrics.quaternion.w.toFixed(4)})\nEuler Angles: X=${metrics.eulerDeg.x.toFixed(2)}°, Y=${metrics.eulerDeg.y.toFixed(2)}°, Z=${metrics.eulerDeg.z.toFixed(2)}°`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fps = metrics?.fps || 60;
  const frameTime = metrics?.frameTimeMs || 16.6;

  return (
    <div className="absolute bottom-4 left-4 z-30 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-14rem)] overflow-y-auto glass-panel-glow rounded-2xl p-4 flex flex-col gap-4 text-slate-200 border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-cyan-300">
            Spatial Telemetry HUD
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Live FPS / Render time badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span className="font-bold">{fps} FPS</span>
            <span className="text-[9px] text-slate-500 font-mono">({frameTime.toFixed(1)}ms)</span>
          </div>
          <button
            id="copy-matrix-btn"
            onClick={handleCopyMatrix}
            title="Copy Matrix to Clipboard"
            className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Selected Piece Title & Topology Banner */}
      <div className="flex flex-col gap-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-display text-white">{currentExhibit.title}</span>
          <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">
            {currentExhibit.metrics.harmonicRatio}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-mono leading-relaxed line-clamp-2">
          {currentExhibit.description}
        </p>
      </div>

      {/* Active Mathematical Formula */}
      <div className="flex flex-col gap-1.5 bg-slate-950/80 border border-cyan-500/20 rounded-xl p-2.5">
        <div 
          onClick={() => setIsFormulaExpanded(!isFormulaExpanded)}
          className="flex items-center justify-between cursor-pointer text-[11px] font-mono text-cyan-400 font-semibold"
        >
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            Parametric Equation
          </span>
          {isFormulaExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
        {isFormulaExpanded && (
          <div className="flex flex-col gap-1 mt-1">
            <code className="text-[11px] font-mono bg-black/60 p-2 rounded-lg text-amber-300 border border-slate-800/80 break-words leading-relaxed">
              {currentExhibit.formula}
            </code>
            <p className="text-[10px] text-slate-400 font-mono">
              {currentExhibit.formulaDescription}
            </p>
          </div>
        )}
      </div>

      {/* 4x4 World Transformation Matrix */}
      <div className="flex flex-col gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 font-mono">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-cyan-400" />
            4x4 Transformation Matrix (M = T·R·S)
          </span>
          <span className="text-[9px] text-cyan-400 uppercase">Normalized</span>
        </div>
        {metrics && (
          <div className="grid grid-cols-4 gap-1 p-1.5 rounded-lg bg-black/70 border border-slate-900 text-center text-[10px]">
            {metrics.matrix4x4.map((row, rIdx) =>
              row.map((val, cIdx) => (
                <div 
                  key={`${rIdx}-${cIdx}`}
                  className={`py-1 rounded px-0.5 ${
                    rIdx === cIdx 
                      ? 'text-cyan-300 bg-cyan-950/30 font-semibold' 
                      : (cIdx === 3 ? 'text-amber-300' : 'text-slate-400')
                  }`}
                >
                  {val.toFixed(2)}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Spatial Vector Coordinates (Euler & Quaternion) */}
      {metrics && (
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
          {/* Euler Angles */}
          <div className="flex flex-col gap-1 bg-slate-950/60 border border-slate-800 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" />
              Euler Rotation (XYZ)
            </span>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-red-400">X: {metrics.eulerDeg.x.toFixed(1)}°</span>
              <span className="text-green-400">Y: {metrics.eulerDeg.y.toFixed(1)}°</span>
              <span className="text-blue-400">Z: {metrics.eulerDeg.z.toFixed(1)}°</span>
            </div>
          </div>

          {/* Quaternion */}
          <div className="flex flex-col gap-1 bg-slate-950/60 border border-slate-800 rounded-xl p-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Orbit className="w-3 h-3 text-purple-400" />
              Quaternion (q)
            </span>
            <div className="text-[9px] text-purple-300 truncate">
              ({metrics.quaternion.x.toFixed(2)}, {metrics.quaternion.y.toFixed(2)}, {metrics.quaternion.z.toFixed(2)}, {metrics.quaternion.w.toFixed(2)})
            </div>
          </div>
        </div>
      )}

      {/* Geometry Telemetry & Sync State */}
      {metrics && (
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-900">
              <div className="text-[9px] text-slate-500 uppercase">Vertices</div>
              <div className="text-cyan-300 font-bold">{metrics.verticesCount.toLocaleString()}</div>
            </div>
            <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-900">
              <div className="text-[9px] text-slate-500 uppercase">Triangles</div>
              <div className="text-slate-300 font-bold">{metrics.trianglesCount.toLocaleString()}</div>
            </div>
            <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-900">
              <div className="text-[9px] text-slate-500 uppercase">Draw Calls</div>
              <div className="text-slate-300 font-bold">{metrics.drawCalls}</div>
            </div>
          </div>

          {/* Spatial Synchronizer Bar */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Formation Phase Sync Ratio:</span>
              <span className="text-cyan-400 font-semibold">{metrics.spatialSyncRatio}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 h-full rounded-full transition-all duration-150"
                style={{ width: `${metrics.spatialSyncRatio}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
