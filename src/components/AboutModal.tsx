import React from 'react';
import { 
  X, 
  Infinity as InfinityIcon, 
  Grid, 
  Boxes, 
  Layers, 
  Sparkles, 
  Activity,
  Compass,
  Cpu
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-panel-glow border border-cyan-500/40 rounded-3xl p-6 md:p-8 flex flex-col gap-6 text-slate-200 shadow-[0_0_50px_rgba(0,243,255,0.2)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
          <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
            <InfinityIcon className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-sky-300">
              Formation Infinity Flow & 3D Coordinates
            </h2>
            <p className="text-xs font-mono text-cyan-400">
              Harmonic Continuous Topologies & Multi-Axis Spatial Synthesis
            </p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm font-mono">
              <InfinityIcon className="w-4 h-4" />
              <span>Two-Phase Infinity Loops</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Non-orientable manifolds and continuous dual-ribbon lemniscates passing through a central nexus without collisions, locked in 9-phase synchronized harmonic ratios.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm font-mono">
              <Grid className="w-4 h-4" />
              <span>8-Fold Octagonal Grids</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Octagonal stereographic coordinate grids based on $45^\circ$ dihedral symmetry ($D_8$), radial polar geodesics, and dynamic Yukawa-screened nodal flux links.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-purple-500/20 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold text-sm font-mono">
              <Boxes className="w-4 h-4" />
              <span>3D WebGL Multi-Axis Frame</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Precision Tait-Bryan Euler angle gimbals, unit quaternion vector trackers, 4D tesseract projection slicers, and sub-millimeter industrial CAD datum frames.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm font-mono">
              <Layers className="w-4 h-4" />
              <span>Holographic Volumetric HUD</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Real-time $4 \times 4$ world transformation matrix calculations, laser scanning depth planes, and floating acoustic wave telemetry circles with 108Hz harmonic drone synthesis.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-rose-500/20 rounded-2xl p-4 flex flex-col gap-2 md:col-span-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm font-mono">
              <Sparkles className="w-4 h-4" />
              <span>Dragon9 Cybernetic Visage & Temporal Nexus</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Parametric biomechanical cyber-dragon head with logarithmic spiral horns, glowing ocular HUD sensor visor, kinetic jawplates, and fluid whisker lemniscate traveling waves synchronized to the Dragon9 54-minute temporal harmonic system.
            </p>
          </div>
        </div>

        {/* Interaction Guide */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 text-xs font-mono text-slate-300">
          <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            Interactive Spatial Controls:
          </span>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li><strong className="text-slate-200">Orbit Camera:</strong> Click and drag with Left Mouse or single touch to rotate spatial coordinate frame.</li>
            <li><strong className="text-slate-200">Pan Spatial Frame:</strong> Right-click and drag with Mouse to pan target origin.</li>
            <li><strong className="text-slate-200">Zoom / Field of View:</strong> Scroll mouse wheel or pinch-to-zoom on touch devices.</li>
            <li><strong className="text-slate-200">Audio Drone:</strong> Click the audio button on the top bar to toggle 108Hz harmonic sine synthesizer.</li>
            <li><strong className="text-slate-200">Live Snapshot:</strong> Click SNAP button on bottom right toolbar to export 4K PNG render.</li>
          </ul>
        </div>

        {/* Close footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-mono text-xs font-semibold shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all"
          >
            ENTER 3D GALLERY
          </button>
        </div>
      </div>
    </div>
  );
};
