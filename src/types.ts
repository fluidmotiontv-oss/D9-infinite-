export type GalleryCategory = 'infinity-loops' | 'octagonal-grids' | '3d-webgl' | 'holographic-ui' | 'cyber-dragon';

export type RenderMode = 'holographic' | 'wireframe' | 'particles' | 'solid' | 'hybrid';

export type ColorTheme = 'cyan' | 'emerald' | 'amber' | 'violet' | 'titanium';

export interface ExhibitItem {
  id: string;
  categoryId: GalleryCategory;
  title: string;
  subtitle: string;
  description: string;
  formula: string;
  formulaDescription: string;
  defaultParams: {
    rotationSpeed: number;
    gridDensity: number;
    loopFrequency: number;
    particleCount: number;
    waveAmplitude: number;
    zoom: number;
    renderMode: RenderMode;
    colorTheme: ColorTheme;
  };
  metrics: {
    phaseOffset: string;
    topologyType: string;
    coordinateFrame: string;
    harmonicRatio: string;
  };
}

export interface EngineParams {
  rotationSpeed: number; // 0 to 3
  gridDensity: number;   // 4 to 64
  loopFrequency: number; // 0.5 to 6.0
  particleCount: number; // 500 to 15000
  waveAmplitude: number; // 0 to 2
  zoom: number;          // 5 to 50
  renderMode: RenderMode;
  colorTheme: ColorTheme;
  showAxes: boolean;
  showGrid: boolean;
  showParticles: boolean;
  showNormals: boolean;
  isPaused: boolean;
  autoRotate: boolean;
  bloomIntensity: number;
}

export interface MatrixMetrics {
  matrix4x4: number[][];
  eulerDeg: { x: number; y: number; z: number };
  eulerRad: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
  cameraPos: { x: number; y: number; z: number; distance: number; fov: number };
  verticesCount: number;
  trianglesCount: number;
  drawCalls: number;
  fps: number;
  frameTimeMs: number;
  phaseAngleRad: number;
  spatialSyncRatio: number;
}
