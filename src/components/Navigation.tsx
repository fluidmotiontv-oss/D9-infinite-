import React from 'react';
import { 
  Infinity as InfinityIcon, 
  Grid, 
  Boxes, 
  Layers, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Sliders,
  Activity,
  Compass,
  Info
} from 'lucide-react';
import { GalleryCategory, ExhibitItem } from '../types';
import { CATEGORIES, EXHIBITS } from '../data/galleryData';

interface NavigationProps {
  currentCategory: GalleryCategory;
  onSelectCategory: (cat: GalleryCategory) => void;
  currentExhibit: ExhibitItem;
  onSelectExhibit: (exhibit: ExhibitItem) => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isControlPanelOpen: boolean;
  onToggleControlPanel: () => void;
  isHUDOpen: boolean;
  onToggleHUD: () => void;
  onOpenAboutModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentCategory,
  onSelectCategory,
  currentExhibit,
  onSelectExhibit,
  isAudioActive,
  onToggleAudio,
  isFullscreen,
  onToggleFullscreen,
  isControlPanelOpen,
  onToggleControlPanel,
  isHUDOpen,
  onToggleHUD,
  onOpenAboutModal
}) => {
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Infinity': return <InfinityIcon className="w-4 h-4" />;
      case 'Grid': return <Grid className="w-4 h-4" />;
      case 'Boxes': return <Boxes className="w-4 h-4" />;
      case 'Layers': return <Layers className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      default: return <Compass className="w-4 h-4" />;
    }
  };

  const currentCategoryData = CATEGORIES.find(c => c.id === currentCategory) || CATEGORIES[0];
  const exhibitsInCategory = EXHIBITS.filter(e => e.categoryId === currentCategory);

  return (
    <header className="relative z-30 w-full select-none pointer-events-auto">
      {/* Top Main Navigation Bar */}
      <div className="glass-panel border-b border-cyan-500/20 px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand / Logo Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.25)]">
            <InfinityIcon className="w-6 h-6 animate-pulse" />
            <div className="absolute -inset-0.5 rounded-xl bg-cyan-400/20 blur-sm -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-sky-400">
                FORMATION INFINITY FLOW
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                3D Coordinate System
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-mono tracking-tight">
              Synchronized 9-Phase Geometric Spatial Vector Gallery
            </p>
          </div>
        </div>

        {/* Category Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                onClick={() => {
                  onSelectCategory(cat.id);
                  const firstExhibit = EXHIBITS.find(e => e.categoryId === cat.id);
                  if (firstExhibit) onSelectExhibit(firstExhibit);
                }}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all duration-200 flex items-center gap-2 ${
                  isActive 
                    ? 'text-cyan-200 bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.2)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span style={{ color: isActive ? cat.accentColor : undefined }}>
                  {getCategoryIcon(cat.iconName)}
                </span>
                <span>{cat.name}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-500'}`}>
                  {cat.badge}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls (Audio, Control Drawer, HUD, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Harmonic Audio Synthesizer */}
          <button
            id="toggle-audio-btn"
            onClick={onToggleAudio}
            title={isAudioActive ? 'Mute Harmonic Drone Synthesizer' : 'Enable 108Hz Harmonic Audio Drone'}
            className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-xs font-mono ${
              isAudioActive 
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(0,243,255,0.25)]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {isAudioActive ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xl:inline text-[11px]">{isAudioActive ? '108Hz ON' : 'Audio OFF'}</span>
          </button>

          {/* Toggle HUD */}
          <button
            id="toggle-hud-btn"
            onClick={onToggleHUD}
            title="Toggle Live Metadata HUD"
            className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-xs font-mono ${
              isHUDOpen 
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">HUD</span>
          </button>

          {/* Toggle Control Panel */}
          <button
            id="toggle-controls-btn"
            onClick={onToggleControlPanel}
            title="Toggle Parameter Controls"
            className={`p-2 rounded-lg border transition-all duration-200 flex items-center gap-1.5 text-xs font-mono ${
              isControlPanelOpen 
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Tuning</span>
          </button>

          {/* About / Theory Modal */}
          <button
            id="info-modal-btn"
            onClick={onOpenAboutModal}
            title="Formation Flow Mathematical Principles"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="toggle-fullscreen-btn"
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen Canvas"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Category Tab Selector */}
      <div className="lg:hidden glass-panel border-b border-cyan-500/10 px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                const firstExhibit = EXHIBITS.find(e => e.categoryId === cat.id);
                if (firstExhibit) onSelectExhibit(firstExhibit);
              }}
              className={`px-3 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {getCategoryIcon(cat.iconName)}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Header: Active Category Exhibits Strip */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Exhibits in {currentCategoryData.name}:
          </span>
          <div className="flex items-center gap-1.5">
            {exhibitsInCategory.map((exhibit) => {
              const isSelected = currentExhibit.id === exhibit.id;
              return (
                <button
                  key={exhibit.id}
                  id={`exhibit-btn-${exhibit.id}`}
                  onClick={() => onSelectExhibit(exhibit)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all duration-200 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/25 to-sky-500/20 border border-cyan-400/70 text-cyan-200 shadow-[0_0_10px_rgba(0,243,255,0.2)] font-semibold'
                      : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400 shadow-[0_0_6px_#00f3ff]' : 'bg-slate-600'}`} />
                  <span>{exhibit.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 min-w-max text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
            {currentExhibit.metrics.topologyType}
          </span>
          <span className="text-cyan-400 font-semibold">
            {currentExhibit.metrics.harmonicRatio}
          </span>
        </div>
      </div>
    </header>
  );
};
