import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GalleryCategory, ExhibitItem, EngineParams, MatrixMetrics } from './types';
import { CATEGORIES, EXHIBITS } from './data/galleryData';
import { WebGLCanvas } from './components/WebGLCanvas';
import { Navigation } from './components/Navigation';
import { ControlPanel } from './components/ControlPanel';
import { MetadataHUD } from './components/MetadataHUD';
import { QuickActionToolbar } from './components/QuickActionToolbar';
import { AboutModal } from './components/AboutModal';
import { audioSynth } from './utils/audioSynth';

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<GalleryCategory>('infinity-loops');
  const [currentExhibit, setCurrentExhibit] = useState<ExhibitItem>(EXHIBITS[0]);
  
  const [params, setParams] = useState<EngineParams>({
    rotationSpeed: EXHIBITS[0].defaultParams.rotationSpeed,
    gridDensity: EXHIBITS[0].defaultParams.gridDensity,
    loopFrequency: EXHIBITS[0].defaultParams.loopFrequency,
    particleCount: EXHIBITS[0].defaultParams.particleCount,
    waveAmplitude: EXHIBITS[0].defaultParams.waveAmplitude,
    zoom: EXHIBITS[0].defaultParams.zoom,
    renderMode: EXHIBITS[0].defaultParams.renderMode,
    colorTheme: EXHIBITS[0].defaultParams.colorTheme,
    showAxes: true,
    showGrid: true,
    showParticles: true,
    showNormals: false,
    isPaused: false,
    autoRotate: true,
    bloomIntensity: 1.0
  });

  const [metrics, setMetrics] = useState<MatrixMetrics | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [isHUDOpen, setIsHUDOpen] = useState(true);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const captureFnRef = useRef<(() => string) | null>(null);

  // Switch Category & select first item
  const handleSelectCategory = (category: GalleryCategory) => {
    setCurrentCategory(category);
    const firstInCat = EXHIBITS.find((e) => e.categoryId === category);
    if (firstInCat) {
      handleSelectExhibit(firstInCat);
    }
  };

  // Switch Exhibit & update parameters
  const handleSelectExhibit = (exhibit: ExhibitItem) => {
    setCurrentExhibit(exhibit);
    setParams((prev) => ({
      ...prev,
      rotationSpeed: exhibit.defaultParams.rotationSpeed,
      gridDensity: exhibit.defaultParams.gridDensity,
      loopFrequency: exhibit.defaultParams.loopFrequency,
      particleCount: exhibit.defaultParams.particleCount,
      waveAmplitude: exhibit.defaultParams.waveAmplitude,
      zoom: exhibit.defaultParams.zoom,
      renderMode: exhibit.defaultParams.renderMode,
      colorTheme: exhibit.defaultParams.colorTheme
    }));
  };

  // Update specific engine parameters
  const handleChangeParams = (newParams: Partial<EngineParams>) => {
    setParams((prev) => {
      const updated = { ...prev, ...newParams };
      if (newParams.loopFrequency !== undefined && isAudioActive) {
        audioSynth.updateFrequency(newParams.loopFrequency);
      }
      return updated;
    });
  };

  // Reset to current exhibit defaults
  const handleResetDefaults = () => {
    setParams((prev) => ({
      ...prev,
      ...currentExhibit.defaultParams,
      isPaused: false,
      autoRotate: true
    }));
  };

  // Toggle Audio Synthesizer
  const handleToggleAudio = () => {
    const active = audioSynth.toggle();
    setIsAudioActive(active);
    if (active) {
      audioSynth.updateFrequency(params.loopFrequency);
    }
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Capture Snapshot
  const handleCaptureSnapshot = () => {
    if (captureFnRef.current) {
      const dataUrl = captureFnRef.current();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `formation-${currentExhibit.id}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    }
  };

  // Set Camera Preset Angle
  const handleSetCameraPreset = (preset: 'top' | 'front' | 'side' | 'iso') => {
    if ((window as any).__set3DCameraPreset) {
      (window as any).__set3DCameraPreset(preset);
    }
  };

  // Reset Camera View Orbit
  const handleResetView = () => {
    handleSetCameraPreset('iso');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#040711] text-slate-100 flex flex-col">
      {/* Top and Category Navigation Menu */}
      <Navigation
        currentCategory={currentCategory}
        onSelectCategory={handleSelectCategory}
        currentExhibit={currentExhibit}
        onSelectExhibit={handleSelectExhibit}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isControlPanelOpen={isControlPanelOpen}
        onToggleControlPanel={() => setIsControlPanelOpen(!isControlPanelOpen)}
        isHUDOpen={isHUDOpen}
        onToggleHUD={() => setIsHUDOpen(!isHUDOpen)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
      />

      {/* Main 3D WebGL Canvas Viewport */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Subtle Cybernetic Scanline Overlay */}
        <div className="absolute inset-0 scanline-overlay z-10 opacity-30 pointer-events-none" />

        {/* Dynamic Watermark / Corner Coordinates */}
        <div className="absolute top-3 left-4 z-20 pointer-events-none flex flex-col gap-0.5">
          <div className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            FORMATION ENGINE 9.0 • REAL-TIME 3D WEBGL
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            FRAME COORDINATE: [{currentExhibit.metrics.coordinateFrame}]
          </div>
        </div>

        {/* WebGL Canvas Component */}
        <WebGLCanvas
          currentExhibit={currentExhibit}
          params={params}
          onMetricsUpdate={setMetrics}
          onCanvasReady={(fn) => {
            captureFnRef.current = fn;
          }}
        />

        {/* Live Metadata HUD Overlay (Bottom-Left) */}
        <MetadataHUD
          isOpen={isHUDOpen}
          onClose={() => setIsHUDOpen(false)}
          currentExhibit={currentExhibit}
          metrics={metrics}
        />

        {/* Parameter Control Panel (Top-Right) */}
        <ControlPanel
          isOpen={isControlPanelOpen}
          onClose={() => setIsControlPanelOpen(false)}
          params={params}
          onChangeParams={handleChangeParams}
          onResetDefaults={handleResetDefaults}
        />

        {/* Floating Quick Action Toolbar (Bottom-Right) */}
        <QuickActionToolbar
          isPaused={params.isPaused}
          onTogglePause={() => handleChangeParams({ isPaused: !params.isPaused })}
          onResetView={handleResetView}
          onCaptureSnapshot={handleCaptureSnapshot}
          onSetCameraPreset={handleSetCameraPreset}
        />
      </div>

      {/* Theory & Mathematical Foundations Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </main>
  );
}
