import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { ExhibitItem, EngineParams, MatrixMetrics } from '../types';
import { COLOR_THEMES } from '../data/galleryData';

interface WebGLCanvasProps {
  currentExhibit: ExhibitItem;
  params: EngineParams;
  onMetricsUpdate: (metrics: MatrixMetrics) => void;
  onCanvasReady?: (captureFn: () => string) => void;
}

export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  currentExhibit,
  params,
  onMetricsUpdate,
  onCanvasReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationFrameId = useRef<number | null>(null);
  
  // Orbit Controls & Interaction state
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const isZooming = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  
  // Spherical Coordinates & Target with damping
  const sphericalCoords = useRef({ radius: 20, theta: Math.PI / 4, phi: Math.PI / 3 });
  const targetCoords = useRef({ radius: 20, theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));
  const targetCameraTarget = useRef(new THREE.Vector3(0, 0, 0));
  
  // Inertial velocity
  const velocity = useRef({ theta: 0, phi: 0, panX: 0, panY: 0 });
  
  // Active gesture feedback state
  const [gestureMode, setGestureMode] = useState<'idle' | 'rotating' | 'panning' | 'zooming'>('idle');
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation timing
  const clockRef = useRef(new THREE.Clock());
  const elapsedRef = useRef(0);
  const fpsStatsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 60, frameTime: 16.6 });

  // Main dynamic content group
  const exhibitGroupRef = useRef<THREE.Group | null>(null);
  const helpersGroupRef = useRef<THREE.Group | null>(null);
  const activeParticlesRef = useRef<THREE.Points | null>(null);
  const activeLinesRef = useRef<THREE.LineSegments | THREE.Line | null>(null);
  const activeMeshRef = useRef<THREE.Mesh | THREE.Group | null>(null);
  const customAnimData = useRef<any>({});

  // Capture canvas screenshot
  const captureScreenshot = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return '';
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    return rendererRef.current.domElement.toDataURL('image/png');
  }, []);

  useEffect(() => {
    if (onCanvasReady) {
      onCanvasReady(captureScreenshot);
    }
  }, [onCanvasReady, captureScreenshot]);

  // Set camera view preset
  const setCameraPreset = useCallback((preset: 'top' | 'front' | 'side' | 'iso') => {
    if (!cameraRef.current) return;
    const r = targetCoords.current.radius;
    targetCameraTarget.current.set(0, 0, 0); // Recenter on preset switch
    switch (preset) {
      case 'top':
        targetCoords.current = { radius: r, theta: 0, phi: 0.001 };
        break;
      case 'front':
        targetCoords.current = { radius: r, theta: 0, phi: Math.PI / 2 };
        break;
      case 'side':
        targetCoords.current = { radius: r, theta: Math.PI / 2, phi: Math.PI / 2 };
        break;
      case 'iso':
        targetCoords.current = { radius: r, theta: Math.PI / 4, phi: Math.PI / 3 };
        break;
    }
  }, []);

  // Zoom camera helper (step +/-)
  const zoom3DCamera = useCallback((factor: number) => {
    targetCoords.current.radius = Math.max(3, Math.min(75, targetCoords.current.radius * factor));
    setGestureMode('zooming');
    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => setGestureMode('idle'), 800);
  }, []);

  // Reset camera target helper
  const reset3DCameraTarget = useCallback(() => {
    targetCameraTarget.current.set(0, 0, 0);
  }, []);

  // Expose camera helpers to window for toolbar
  useEffect(() => {
    (window as any).__set3DCameraPreset = setCameraPreset;
    (window as any).__zoom3DCamera = zoom3DCamera;
    (window as any).__reset3DCameraTarget = reset3DCameraTarget;
  }, [setCameraPreset, zoom3DCamera, reset3DCameraTarget]);

  // Update camera position from spherical coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalCoords.current;
    
    // Clamp phi to avoid gimbal flip
    const clampedPhi = Math.max(0.001, Math.min(Math.PI - 0.001, phi));
    
    const x = radius * Math.sin(clampedPhi) * Math.sin(theta) + cameraTarget.current.x;
    const y = radius * Math.cos(clampedPhi) + cameraTarget.current.y;
    const z = radius * Math.sin(clampedPhi) * Math.cos(theta) + cameraTarget.current.z;
    
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(cameraTarget.current);
  };

  // Build helpers (Axes, Ground Grid, Spatial Rings)
  const buildHelpers = (scene: THREE.Scene, themeId: string, showAxes: boolean, showGrid: boolean) => {
    if (helpersGroupRef.current) {
      scene.remove(helpersGroupRef.current);
      helpersGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    const helpersGroup = new THREE.Group();
    helpersGroup.name = 'helpersGroup';
    const theme = COLOR_THEMES[themeId] || COLOR_THEMES.cyan;

    if (showGrid) {
      // Custom Octagonal / Polar grid
      const gridRadius = 14;
      const gridSectors = 8;
      const gridRings = 7;
      const gridMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(theme.threeColors.accent).multiplyScalar(0.4),
        transparent: true,
        opacity: 0.35
      });

      const gridGeo = new THREE.BufferGeometry();
      const gridPositions: number[] = [];

      // Concentric 8-sided rings
      for (let r = 1; r <= gridRings; r++) {
        const radius = (gridRadius / gridRings) * r;
        for (let s = 0; s < gridSectors; s++) {
          const a1 = (s / gridSectors) * Math.PI * 2;
          const a2 = ((s + 1) / gridSectors) * Math.PI * 2;
          gridPositions.push(Math.cos(a1) * radius, -4, Math.sin(a1) * radius);
          gridPositions.push(Math.cos(a2) * radius, -4, Math.sin(a2) * radius);
        }
      }

      // Radial 8-axis spokes
      for (let s = 0; s < gridSectors; s++) {
        const angle = (s / gridSectors) * Math.PI * 2;
        gridPositions.push(0, -4, 0);
        gridPositions.push(Math.cos(angle) * gridRadius, -4, Math.sin(angle) * gridRadius);
      }

      gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
      const gridLines = new THREE.LineSegments(gridGeo, gridMaterial);
      helpersGroup.add(gridLines);

      // Fine standard cartesian plane beneath
      const standardGrid = new THREE.GridHelper(28, 28, theme.threeColors.primary, 0x1e293b);
      standardGrid.position.y = -4.01;
      (standardGrid.material as THREE.Material).transparent = true;
      (standardGrid.material as THREE.Material).opacity = 0.2;
      helpersGroup.add(standardGrid);
    }

    if (showAxes) {
      // Precision 3D Axes with Glowing Stems & Labels
      const axisLen = 6;
      const axesHolder = new THREE.Group();

      const createAxisLine = (dir: THREE.Vector3, color: number) => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          dir.clone().multiplyScalar(axisLen)
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.9 });
        return new THREE.Line(lineGeo, lineMat);
      };

      axesHolder.add(createAxisLine(new THREE.Vector3(1, 0, 0), 0xff3b30)); // X - Red
      axesHolder.add(createAxisLine(new THREE.Vector3(0, 1, 0), 0x34c759)); // Y - Green
      axesHolder.add(createAxisLine(new THREE.Vector3(0, 0, 1), 0x007aff)); // Z - Blue

      // Negative dashed axes
      const createDashedAxis = (dir: THREE.Vector3, color: number) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < axisLen; i += 0.4) {
          pts.push(dir.clone().multiplyScalar(i));
          pts.push(dir.clone().multiplyScalar(i + 0.2));
        }
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 }));
        return mat;
      };

      axesHolder.add(new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(-axisLen,0,0)]),
        new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.3 })
      ));
      axesHolder.add(new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,-axisLen,0)]),
        new THREE.LineBasicMaterial({ color: 0x34c759, transparent: true, opacity: 0.3 })
      ));
      axesHolder.add(new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-axisLen)]),
        new THREE.LineBasicMaterial({ color: 0x007aff, transparent: true, opacity: 0.3 })
      ));

      // Origin point node
      const originGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const originMesh = new THREE.Mesh(originGeo, originMat);
      axesHolder.add(originMesh);

      helpersGroup.add(axesHolder);
    }

    helpersGroupRef.current = helpersGroup;
    scene.add(helpersGroup);
  };

  // Build the dynamic 3D Exhibit Content based on current piece
  const buildExhibitMesh = useCallback((
    exhibit: ExhibitItem,
    currentParams: EngineParams,
    scene: THREE.Scene
  ) => {
    if (exhibitGroupRef.current) {
      scene.remove(exhibitGroupRef.current);
      exhibitGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
    }

    const group = new THREE.Group();
    group.name = 'activeExhibit';
    const theme = COLOR_THEMES[currentParams.colorTheme] || COLOR_THEMES.cyan;
    const mode = currentParams.renderMode;
    const density = currentParams.gridDensity;
    const particleCount = currentParams.particleCount;
    const amp = currentParams.waveAmplitude;

    customAnimData.current = {
      type: exhibit.id,
      phase: 0,
      particles: null,
      customMeshes: []
    };

    // --- EXHIBIT BUILDERS ---
    switch (exhibit.id) {
      // 1. Two-Phase Bernoulli Lemniscate Flow
      case 'bernoulli-flow': {
        const segments = Math.max(300, density * 15);
        const curvePoints1: THREE.Vector3[] = [];
        const curvePoints2: THREE.Vector3[] = [];
        const a = 6;
        const b = 2.2 * amp;

        for (let i = 0; i <= segments; i++) {
          const t = (i / segments) * Math.PI * 2;
          const denom = 1 + Math.sin(t) * Math.sin(t);
          
          // Phase 1
          const x1 = (a * Math.cos(t)) / denom;
          const y1 = b * Math.sin(2 * t);
          const z1 = (a * Math.sin(t) * Math.cos(t)) / denom;
          curvePoints1.push(new THREE.Vector3(x1, y1, z1));

          // Phase 2 (Offset counter-circulating)
          const t2 = t + Math.PI;
          const denom2 = 1 + Math.sin(t2) * Math.sin(t2);
          const x2 = (a * Math.cos(t2)) / denom2;
          const y2 = -b * Math.sin(2 * t2);
          const z2 = (a * Math.sin(t2) * Math.cos(t2)) / denom2;
          curvePoints2.push(new THREE.Vector3(x2, y2, z2));
        }

        const curve1 = new THREE.CatmullRomCurve3(curvePoints1, true);
        const curve2 = new THREE.CatmullRomCurve3(curvePoints2, true);

        // Ribbon / Tube Mesh
        if (mode === 'solid' || mode === 'hybrid' || mode === 'holographic') {
          const tubeGeo1 = new THREE.TubeGeometry(curve1, segments, 0.28, 8, true);
          const tubeGeo2 = new THREE.TubeGeometry(curve2, segments, 0.28, 8, true);
          
          const mat1 = new THREE.MeshStandardMaterial({
            color: theme.threeColors.primary,
            emissive: theme.threeColors.primary,
            emissiveIntensity: mode === 'holographic' ? 0.6 : 0.2,
            wireframe: false,
            transparent: true,
            opacity: mode === 'holographic' ? 0.65 : 0.9,
            roughness: 0.2,
            metalness: 0.8
          });

          const mat2 = new THREE.MeshStandardMaterial({
            color: theme.threeColors.secondary,
            emissive: theme.threeColors.secondary,
            emissiveIntensity: mode === 'holographic' ? 0.6 : 0.2,
            wireframe: false,
            transparent: true,
            opacity: mode === 'holographic' ? 0.65 : 0.9,
            roughness: 0.2,
            metalness: 0.8
          });

          group.add(new THREE.Mesh(tubeGeo1, mat1));
          group.add(new THREE.Mesh(tubeGeo2, mat2));
        }

        if (mode === 'wireframe') {
          const tubeGeo1 = new THREE.TubeGeometry(curve1, segments, 0.4, 6, true);
          const tubeGeo2 = new THREE.TubeGeometry(curve2, segments, 0.4, 6, true);
          const wireMat = new THREE.MeshBasicMaterial({
            color: theme.threeColors.primary,
            wireframe: true,
            transparent: true,
            opacity: 0.8
          });
          group.add(new THREE.Mesh(tubeGeo1, wireMat));
          group.add(new THREE.Mesh(tubeGeo2, wireMat));
        }

        // Particle stream circulating along curve
        const pCount = Math.min(particleCount, 5000);
        const pGeo = new THREE.BufferGeometry();
        const pPositions = new Float32Array(pCount * 3);
        const pColors = new Float32Array(pCount * 3);
        const pOffsets = new Float32Array(pCount);
        const pSpeeds = new Float32Array(pCount);
        const pPhases = new Float32Array(pCount); // 0 or 1 for phase 1 / phase 2

        const col1 = new THREE.Color(theme.threeColors.primary);
        const col2 = new THREE.Color(theme.threeColors.secondary);
        const colAccent = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i < pCount; i++) {
          const phase = i % 2;
          pPhases[i] = phase;
          pOffsets[i] = Math.random();
          pSpeeds[i] = 0.5 + Math.random() * 0.5;

          const baseCol = phase === 0 ? col1 : (Math.random() > 0.3 ? col2 : colAccent);
          pColors[i * 3] = baseCol.r;
          pColors[i * 3 + 1] = baseCol.g;
          pColors[i * 3 + 2] = baseCol.b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

        const pMat = new THREE.PointsMaterial({
          size: 0.18,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(pGeo, pMat);
        group.add(particles);

        // Nexus central core singularity
        const nexusGeo = new THREE.IcosahedronGeometry(0.55, 3);
        const nexusMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: theme.threeColors.accent,
          emissiveIntensity: 1.0,
          wireframe: true
        });
        const nexusMesh = new THREE.Mesh(nexusGeo, nexusMat);
        group.add(nexusMesh);

        customAnimData.current = {
          type: 'bernoulli',
          curve1,
          curve2,
          particles,
          pOffsets,
          pSpeeds,
          pPhases,
          nexusMesh
        };
        break;
      }

      // 2. Möbius Quantum Boundary
      case 'mobius-strip': {
        const uSegs = Math.max(120, density * 6);
        const vSegs = 24;
        const geo = new THREE.BufferGeometry();
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];

        const colPrimary = new THREE.Color(theme.threeColors.primary);
        const colAccent = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i <= uSegs; i++) {
          const u = (i / uSegs) * Math.PI * 2;
          for (let j = 0; j <= vSegs; j++) {
            const v = (j / vSegs) * 2 - 1; // -1 to 1
            const width = 1.6;
            const r = 5 + (v * width * 0.5) * Math.cos(u * 0.5);
            const x = r * Math.cos(u);
            const z = r * Math.sin(u);
            const y = (v * width * 0.5) * Math.sin(u * 0.5) + amp * Math.sin(3 * u);

            positions.push(x, y, z);
            uvs.push(i / uSegs, j / vSegs);

            const vertexCol = colPrimary.clone().lerp(colAccent, j / vSegs);
            colors.push(vertexCol.r, vertexCol.g, vertexCol.b);
          }
        }

        for (let i = 0; i < uSegs; i++) {
          for (let j = 0; j < vSegs; j++) {
            const a = i * (vSegs + 1) + j;
            const b = (i + 1) * (vSegs + 1) + j;
            const c = (i + 1) * (vSegs + 1) + (j + 1);
            const d = i * (vSegs + 1) + (j + 1);

            indices.push(a, b, d);
            indices.push(b, c, d);
          }
        }

        geo.setIndex(indices);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
          wireframe: mode === 'wireframe',
          transparent: true,
          opacity: mode === 'holographic' ? 0.75 : 0.9,
          roughness: 0.3,
          metalness: 0.7
        });

        const mobiusMesh = new THREE.Mesh(geo, mat);
        group.add(mobiusMesh);

        // Normal vectors visualization
        if (params.showNormals || mode === 'hybrid') {
          const normalHelperGeo = new THREE.BufferGeometry();
          const normLines: number[] = [];
          const posAttr = geo.attributes.position;
          const normAttr = geo.attributes.normal;
          
          for (let i = 0; i < posAttr.count; i += 6) {
            const px = posAttr.getX(i);
            const py = posAttr.getY(i);
            const pz = posAttr.getZ(i);
            const nx = normAttr.getX(i) * 0.6;
            const ny = normAttr.getY(i) * 0.6;
            const nz = normAttr.getZ(i) * 0.6;

            normLines.push(px, py, pz, px + nx, py + ny, pz + nz);
          }
          normalHelperGeo.setAttribute('position', new THREE.Float32BufferAttribute(normLines, 3));
          const normMat = new THREE.LineSegments(
            normalHelperGeo,
            new THREE.LineBasicMaterial({ color: theme.threeColors.accent, transparent: true, opacity: 0.6 })
          );
          group.add(normMat);
        }

        customAnimData.current = { type: 'mobius', mesh: mobiusMesh };
        break;
      }

      // 3. Trefoil Torus Knot
      case 'trefoil-knot': {
        const knotGeo = new THREE.TorusKnotGeometry(4.5, 1.1, density * 6, density, 2, 3);
        const knotMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.primary,
          emissive: theme.threeColors.accent,
          emissiveIntensity: mode === 'holographic' ? 0.5 : 0.2,
          wireframe: mode === 'wireframe',
          transparent: true,
          opacity: mode === 'holographic' ? 0.7 : 0.95,
          roughness: 0.2,
          metalness: 0.8
        });

        const knotMesh = new THREE.Mesh(knotGeo, knotMat);
        group.add(knotMesh);

        // Orbiting glowing satellites
        const satCount = 12;
        const satGroup = new THREE.Group();
        for (let i = 0; i < satCount; i++) {
          const satGeo = new THREE.SphereGeometry(0.2, 16, 16);
          const satMat = new THREE.MeshBasicMaterial({ color: theme.threeColors.accent });
          const sat = new THREE.Mesh(satGeo, satMat);
          satGroup.add(sat);
        }
        group.add(satGroup);

        customAnimData.current = { type: 'trefoil', knotMesh, satGroup, satCount };
        break;
      }

      // 4. Formation 8-Torus Vortex
      case 'vortex-dual-torus': {
        const torus1Geo = new THREE.TorusGeometry(4.2, 1.2, density, density * 2);
        const torus2Geo = new THREE.TorusGeometry(4.2, 1.2, density, density * 2);

        const mat1 = new THREE.MeshStandardMaterial({
          color: theme.threeColors.primary,
          emissive: theme.threeColors.primary,
          emissiveIntensity: 0.3,
          wireframe: mode === 'wireframe' || mode === 'hybrid',
          transparent: true,
          opacity: 0.65
        });
        const mat2 = new THREE.MeshStandardMaterial({
          color: theme.threeColors.secondary,
          emissive: theme.threeColors.secondary,
          emissiveIntensity: 0.3,
          wireframe: mode === 'wireframe' || mode === 'hybrid',
          transparent: true,
          opacity: 0.65
        });

        const t1 = new THREE.Mesh(torus1Geo, mat1);
        const t2 = new THREE.Mesh(torus2Geo, mat2);
        t1.position.x = -2.8;
        t2.position.x = 2.8;
        t1.rotation.y = Math.PI / 6;
        t2.rotation.y = -Math.PI / 6;

        group.add(t1);
        group.add(t2);

        // Vortex Particle Whirlpool
        const pCount = Math.min(particleCount, 6000);
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pCol = new Float32Array(pCount * 3);
        const c1 = new THREE.Color(theme.threeColors.primary);
        const c2 = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i < pCount; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const r = 4.2 + 1.2 * Math.cos(v);
          const x = (side * 2.8) + r * Math.cos(u);
          const y = 1.2 * Math.sin(v);
          const z = r * Math.sin(u);

          pPos[i * 3] = x;
          pPos[i * 3 + 1] = y;
          pPos[i * 3 + 2] = z;

          const col = side === -1 ? c1 : c2;
          pCol[i * 3] = col.r;
          pCol[i * 3 + 1] = col.g;
          pCol[i * 3 + 2] = col.b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
        const pMat = new THREE.PointsMaterial({ size: 0.14, vertexColors: true, blending: THREE.AdditiveBlending });
        const particles = new THREE.Points(pGeo, pMat);
        group.add(particles);

        customAnimData.current = { type: 'dualtorus', t1, t2, particles };
        break;
      }

      // 5. 8-Fold Sacred Dimensional Matrix
      case 'octa-matrix': {
        const octaGroup = new THREE.Group();
        const rings = Math.max(4, Math.floor(density / 6));
        const sectors = 8;
        const maxR = 6.5;

        for (let r = 1; r <= rings; r++) {
          const rad = (r / rings) * maxR;
          const ringGeo = new THREE.BufferGeometry();
          const ringPts: number[] = [];

          for (let s = 0; s <= sectors; s++) {
            const angle = (s / sectors) * Math.PI * 2 + (r % 2 === 0 ? 0 : Math.PI / 8);
            ringPts.push(rad * Math.cos(angle), (r % 2 === 0 ? 0.3 : -0.3) * amp, rad * Math.sin(angle));
          }
          ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ringPts, 3));
          const ringMat = new THREE.LineBasicMaterial({
            color: r === rings ? theme.threeColors.accent : theme.threeColors.primary,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
          });
          octaGroup.add(new THREE.Line(ringGeo, ringMat));

          // Nodes at vertices
          for (let s = 0; s < sectors; s++) {
            const angle = (s / sectors) * Math.PI * 2 + (r % 2 === 0 ? 0 : Math.PI / 8);
            const nodeGeo = new THREE.OctahedronGeometry(0.12 + (r / rings) * 0.1, 0);
            const nodeMat = new THREE.MeshBasicMaterial({ color: theme.threeColors.accent });
            const node = new THREE.Mesh(nodeGeo, nodeMat);
            node.position.set(rad * Math.cos(angle), (r % 2 === 0 ? 0.3 : -0.3) * amp, rad * Math.sin(angle));
            octaGroup.add(node);
          }
        }

        // Intersecting Sacred Diagonal chords
        const chordGeo = new THREE.BufferGeometry();
        const chordPts: number[] = [];
        for (let s = 0; s < sectors; s++) {
          const a1 = (s / sectors) * Math.PI * 2;
          const a2 = ((s + 3) / sectors) * Math.PI * 2;
          chordPts.push(maxR * Math.cos(a1), 0, maxR * Math.sin(a1));
          chordPts.push(maxR * Math.cos(a2), 0, maxR * Math.sin(a2));
        }
        chordGeo.setAttribute('position', new THREE.Float32BufferAttribute(chordPts, 3));
        const chordMat = new THREE.LineSegments(
          chordGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.secondary, transparent: true, opacity: 0.5 })
        );
        octaGroup.add(chordMat);

        group.add(octaGroup);
        customAnimData.current = { type: 'octamatrix', octaGroup, rings };
        break;
      }

      // 6. Hyperbolic Octa-Lattice
      case 'hyperbolic-octa': {
        const layers = 9;
        const layerGroup = new THREE.Group();
        const octaMeshes: THREE.LineLoop[] = [];

        for (let l = 0; l < layers; l++) {
          const zOffset = (l - 4) * 1.2;
          const baseRadius = 5.5 - Math.abs(l - 4) * 0.7;
          const geo = new THREE.BufferGeometry();
          const pts: number[] = [];

          for (let s = 0; s < 8; s++) {
            const a = (s / 8) * Math.PI * 2;
            pts.push(baseRadius * Math.cos(a), zOffset, baseRadius * Math.sin(a));
          }
          geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
          const mat = new THREE.LineBasicMaterial({
            color: l === 4 ? theme.threeColors.accent : theme.threeColors.primary,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
          });
          const lineLoop = new THREE.LineLoop(geo, mat);
          layerGroup.add(lineLoop);
          octaMeshes.push(lineLoop);
        }

        // Connecting longitudinal vertical rails
        const railGeo = new THREE.BufferGeometry();
        const railPts: number[] = [];
        for (let s = 0; s < 8; s++) {
          for (let l = 0; l < layers - 1; l++) {
            const z1 = (l - 4) * 1.2;
            const z2 = (l + 1 - 4) * 1.2;
            const r1 = 5.5 - Math.abs(l - 4) * 0.7;
            const r2 = 5.5 - Math.abs(l + 1 - 4) * 0.7;
            const a = (s / 8) * Math.PI * 2;
            railPts.push(r1 * Math.cos(a), z1, r1 * Math.sin(a));
            railPts.push(r2 * Math.cos(a), z2, r2 * Math.sin(a));
          }
        }
        railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPts, 3));
        const railMat = new THREE.LineSegments(
          railGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.secondary, transparent: true, opacity: 0.4 })
        );
        layerGroup.add(railMat);

        group.add(layerGroup);
        customAnimData.current = { type: 'hyperbolicocta', octaMeshes, layerGroup };
        break;
      }

      // 7. Stereographic Coordinate Net
      case 'stereographic-net': {
        const netGroup = new THREE.Group();
        const sphereR = 3.5;

        // Riemann Sphere wireframe
        const sphereGeo = new THREE.SphereGeometry(sphereR, 16, 8);
        const sphereMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.primary,
          wireframe: true,
          transparent: true,
          opacity: 0.35
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.y = sphereR;
        netGroup.add(sphere);

        // Projected Octagonal Coordinate floor plane
        const planeGeo = new THREE.BufferGeometry();
        const planePts: number[] = [];
        const floorY = 0;

        for (let ring = 1; ring <= 6; ring++) {
          const pr = ring * 1.6;
          for (let s = 0; s < 8; s++) {
            const a1 = (s / 8) * Math.PI * 2;
            const a2 = ((s + 1) / 8) * Math.PI * 2;
            planePts.push(pr * Math.cos(a1), floorY, pr * Math.sin(a1));
            planePts.push(pr * Math.cos(a2), floorY, pr * Math.sin(a2));
          }
        }
        planeGeo.setAttribute('position', new THREE.Float32BufferAttribute(planePts, 3));
        const planeLines = new THREE.LineSegments(
          planeGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.accent, transparent: true, opacity: 0.7 })
        );
        netGroup.add(planeLines);

        // Projection rays from North Pole (0, 2*sphereR, 0)
        const raysGeo = new THREE.BufferGeometry();
        const rayPts: number[] = [];
        const northPole = new THREE.Vector3(0, 2 * sphereR, 0);

        for (let s = 0; s < 8; s++) {
          const angle = (s / 8) * Math.PI * 2;
          const target = new THREE.Vector3(6 * Math.cos(angle), floorY, 6 * Math.sin(angle));
          rayPts.push(northPole.x, northPole.y, northPole.z);
          rayPts.push(target.x, target.y, target.z);
        }
        raysGeo.setAttribute('position', new THREE.Float32BufferAttribute(rayPts, 3));
        const rays = new THREE.LineSegments(
          raysGeo,
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
        );
        netGroup.add(rays);

        group.add(netGroup);
        customAnimData.current = { type: 'stereonet', netGroup };
        break;
      }

      // 8. Nodal Flux Resonator
      case 'nodal-flux-resonator': {
        const nodeGroup = new THREE.Group();
        const nodes: THREE.Vector3[] = [];
        const nodeMeshes: THREE.Mesh[] = [];
        const r = 5.2;

        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const pos = new THREE.Vector3(r * Math.cos(angle), 0, r * Math.sin(angle));
          nodes.push(pos);

          const nodeGeo = new THREE.DodecahedronGeometry(0.38, 0);
          const nodeMat = new THREE.MeshStandardMaterial({
            color: theme.threeColors.accent,
            emissive: theme.threeColors.accent,
            emissiveIntensity: 0.8,
            wireframe: mode === 'wireframe'
          });
          const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
          nodeMesh.position.copy(pos);
          nodeGroup.add(nodeMesh);
          nodeMeshes.push(nodeMesh);
        }

        // Dynamic laser connections
        const laserGeo = new THREE.BufferGeometry();
        const laserPts: number[] = [];
        for (let i = 0; i < 8; i++) {
          for (let j = i + 1; j < 8; j++) {
            laserPts.push(nodes[i].x, nodes[i].y, nodes[i].z);
            laserPts.push(nodes[j].x, nodes[j].y, nodes[j].z);
          }
        }
        laserGeo.setAttribute('position', new THREE.Float32BufferAttribute(laserPts, 3));
        const laserLines = new THREE.LineSegments(
          laserGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.primary, transparent: true, opacity: 0.45 })
        );
        nodeGroup.add(laserLines);

        // Traveling flux spark particles
        const pCount = Math.min(particleCount, 3500);
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pCol = new Float32Array(pCount * 3);
        const cPrimary = new THREE.Color(theme.threeColors.primary);
        const cAccent = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i < pCount; i++) {
          const nodeIdx = i % 8;
          pPos[i * 3] = nodes[nodeIdx].x + (Math.random() - 0.5) * 1.5;
          pPos[i * 3 + 1] = nodes[nodeIdx].y + (Math.random() - 0.5) * 1.5;
          pPos[i * 3 + 2] = nodes[nodeIdx].z + (Math.random() - 0.5) * 1.5;

          const col = Math.random() > 0.5 ? cPrimary : cAccent;
          pCol[i * 3] = col.r;
          pCol[i * 3 + 1] = col.g;
          pCol[i * 3 + 2] = col.b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
        const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, blending: THREE.AdditiveBlending }));
        nodeGroup.add(particles);

        group.add(nodeGroup);
        customAnimData.current = { type: 'fluxresonator', nodeGroup, nodeMeshes, nodes, particles };
        break;
      }

      // 9. Multi-Axis Coordinate Gimbal (XYZ + UVW)
      case 'coordinate-gimbal': {
        const gimbalGroup = new THREE.Group();

        // 3 Concentric Gimbal Rings
        const ringRadii = [5.5, 4.2, 3.0];
        const ringColors = [0xff3b30, 0x34c759, 0x007aff];
        const gimbalRings: THREE.Group[] = [];

        ringRadii.forEach((rad, idx) => {
          const ringHolder = new THREE.Group();
          const ringGeo = new THREE.TorusGeometry(rad, 0.08, 16, 64);
          const ringMat = new THREE.MeshStandardMaterial({
            color: ringColors[idx],
            emissive: ringColors[idx],
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.8
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          
          if (idx === 0) ringMesh.rotation.y = Math.PI / 2; // X-plane
          if (idx === 1) ringMesh.rotation.x = Math.PI / 2; // Y-plane
          // idx === 2 is Z-plane

          ringHolder.add(ringMesh);

          // Degree tick notches around the ring
          const tickGeo = new THREE.BufferGeometry();
          const tickPts: number[] = [];
          for (let deg = 0; deg < 360; deg += 15) {
            const radAngle = (deg * Math.PI) / 180;
            const r1 = rad - 0.2;
            const r2 = rad + 0.2;
            if (idx === 0) {
              tickPts.push(0, r1 * Math.cos(radAngle), r1 * Math.sin(radAngle));
              tickPts.push(0, r2 * Math.cos(radAngle), r2 * Math.sin(radAngle));
            } else if (idx === 1) {
              tickPts.push(r1 * Math.cos(radAngle), 0, r1 * Math.sin(radAngle));
              tickPts.push(r2 * Math.cos(radAngle), 0, r2 * Math.sin(radAngle));
            } else {
              tickPts.push(r1 * Math.cos(radAngle), r1 * Math.sin(radAngle), 0);
              tickPts.push(r2 * Math.cos(radAngle), r2 * Math.sin(radAngle), 0);
            }
          }
          tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPts, 3));
          const ticks = new THREE.LineSegments(
            tickGeo,
            new THREE.LineBasicMaterial({ color: ringColors[idx], transparent: true, opacity: 0.6 })
          );
          ringHolder.add(ticks);

          gimbalGroup.add(ringHolder);
          gimbalRings.push(ringHolder);
        });

        // Center Coordinate Tripod Vectors (T, N, B)
        const tripod = new THREE.AxesHelper(2.5);
        gimbalGroup.add(tripod);

        group.add(gimbalGroup);
        customAnimData.current = { type: 'gimbal', gimbalRings, gimbalGroup };
        break;
      }

      // 10. 4D Tesseract Hypercube
      case 'tesseract-slicer': {
        const tesseractGroup = new THREE.Group();

        // 16 4D Vertices: (±1, ±1, ±1, ±1)
        const vertices4D: number[][] = [];
        for (let i = 0; i < 16; i++) {
          vertices4D.push([
            (i & 1 ? 1 : -1) * 2,
            (i & 2 ? 1 : -1) * 2,
            (i & 4 ? 1 : -1) * 2,
            (i & 8 ? 1 : -1) * 2
          ]);
        }

        // 32 Edges connecting vertices with Hamming distance 1
        const edges: [number, number][] = [];
        for (let i = 0; i < 16; i++) {
          for (let j = i + 1; j < 16; j++) {
            let diff = 0;
            for (let k = 0; k < 4; k++) {
              if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
            }
            if (diff === 1) {
              edges.push([i, j]);
            }
          }
        }

        // 16 Vertex Node Spheres
        const nodeMeshes: THREE.Mesh[] = [];
        vertices4D.forEach(() => {
          const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
          const sphereMat = new THREE.MeshStandardMaterial({
            color: theme.threeColors.accent,
            emissive: theme.threeColors.accent,
            emissiveIntensity: 0.8
          });
          const mesh = new THREE.Mesh(sphereGeo, sphereMat);
          tesseractGroup.add(mesh);
          nodeMeshes.push(mesh);
        });

        // 32 Edge connecting lines
        const edgeGeo = new THREE.BufferGeometry();
        const edgePositions = new Float32Array(edges.length * 6);
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
        const edgeMat = new THREE.LineSegments(
          edgeGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.primary, linewidth: 2, transparent: true, opacity: 0.85 })
        );
        tesseractGroup.add(edgeMat);

        group.add(tesseractGroup);
        customAnimData.current = {
          type: 'tesseract',
          vertices4D,
          edges,
          nodeMeshes,
          edgeGeo,
          tesseractGroup
        };
        break;
      }

      // 11. Vector Field Curl & Divergence
      case 'vector-field-divergence': {
        const fieldGroup = new THREE.Group();
        const gridSize = 7;
        const spacing = 1.6;
        const arrows: THREE.ArrowHelper[] = [];

        for (let x = -gridSize; x <= gridSize; x += 2) {
          for (let y = -3; y <= 3; y += 2) {
            for (let z = -gridSize; z <= gridSize; z += 2) {
              const origin = new THREE.Vector3(x * 0.8, y * 0.8, z * 0.8);
              const dir = new THREE.Vector3(
                -origin.z,
                Math.sin(origin.x) * amp,
                origin.x
              ).normalize();
              const arrow = new THREE.ArrowHelper(
                dir,
                origin,
                0.9,
                theme.threeColors.primary,
                0.25,
                0.15
              );
              fieldGroup.add(arrow);
              arrows.push(arrow);
            }
          }
        }

        // Tracing particles streaming along vector field
        const pCount = Math.min(particleCount, 5000);
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pCol = new Float32Array(pCount * 3);
        const c1 = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i < pCount; i++) {
          pPos[i * 3] = (Math.random() - 0.5) * 12;
          pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
          pPos[i * 3 + 2] = (Math.random() - 0.5) * 12;

          pCol[i * 3] = c1.r;
          pCol[i * 3 + 1] = c1.g;
          pCol[i * 3 + 2] = c1.b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
        const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, blending: THREE.AdditiveBlending }));
        fieldGroup.add(particles);

        group.add(fieldGroup);
        customAnimData.current = { type: 'vectorfield', arrows, particles, pCount };
        break;
      }

      // 12. Precision CAD Spatial Plane
      case 'precision-cad-plane': {
        const cadGroup = new THREE.Group();

        // 3 Datum Planes (XY, XZ, YZ)
        const planeSize = 10;
        const planeMatXY = new THREE.MeshBasicMaterial({
          color: 0x007aff,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide
        });
        const planeMatXZ = new THREE.MeshBasicMaterial({
          color: 0x34c759,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide
        });
        const planeMatYZ = new THREE.MeshBasicMaterial({
          color: 0xff3b30,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide
        });

        const pXY = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), planeMatXY);
        const pXZ = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), planeMatXZ);
        pXZ.rotation.x = Math.PI / 2;
        const pYZ = new THREE.Mesh(new THREE.PlaneGeometry(planeSize, planeSize), planeMatYZ);
        pYZ.rotation.y = Math.PI / 2;

        cadGroup.add(pXY);
        cadGroup.add(pXZ);
        cadGroup.add(pYZ);

        // Precision Bounding Extents Box
        const bboxGeo = new THREE.BoxGeometry(8, 6, 8);
        const bboxEdges = new THREE.EdgesGeometry(bboxGeo);
        const bboxLines = new THREE.LineSegments(
          bboxEdges,
          new THREE.LineBasicMaterial({ color: theme.threeColors.accent, linewidth: 2 })
        );
        cadGroup.add(bboxLines);

        // Center CAD Crosshairs
        const crossGeo = new THREE.BufferGeometry();
        const crossPts = [
          -6, 0, 0,  6, 0, 0,
          0, -4, 0,  0, 4, 0,
          0, 0, -6,  0, 0, 6
        ];
        crossGeo.setAttribute('position', new THREE.Float32BufferAttribute(crossPts, 3));
        const cross = new THREE.LineSegments(
          crossGeo,
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
        );
        cadGroup.add(cross);

        group.add(cadGroup);
        customAnimData.current = { type: 'cadplane', cadGroup };
        break;
      }

      // 13. Volumetric Spatial HUD
      case 'volumetric-hud': {
        const hudGroup = new THREE.Group();

        // Multi-ring concentric HUD dial
        const ringConfigs = [
          { r: 5.8, segs: 64, dashed: false, color: theme.threeColors.primary },
          { r: 4.8, segs: 32, dashed: true, color: theme.threeColors.accent },
          { r: 3.6, segs: 16, dashed: false, color: theme.threeColors.secondary },
          { r: 2.2, segs: 8, dashed: true, color: 0xffffff }
        ];

        const ringMeshes: THREE.Line[] = [];
        ringConfigs.forEach((cfg) => {
          const geo = new THREE.BufferGeometry();
          const pts: number[] = [];
          for (let i = 0; i <= cfg.segs; i++) {
            const a = (i / cfg.segs) * Math.PI * 2;
            pts.push(cfg.r * Math.cos(a), 0, cfg.r * Math.sin(a));
          }
          geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
          const mat = new THREE.LineBasicMaterial({
            color: cfg.color,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
          });
          const ring = new THREE.Line(geo, mat);
          hudGroup.add(ring);
          ringMeshes.push(ring);
        });

        // 3D Cylindrical Telemetry Cage
        const cylGeo = new THREE.CylinderGeometry(4.5, 4.5, 4.0, 16, 4, true);
        const cylMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.primary,
          wireframe: true,
          transparent: true,
          opacity: 0.25
        });
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        hudGroup.add(cyl);

        // Tactical Reticle Crosshairs & Brackets
        const reticleGeo = new THREE.BufferGeometry();
        const reticlePts: number[] = [];
        const rLen = 6.2;
        // 4 compass ticks
        reticlePts.push(rLen, 0, 0, rLen - 0.8, 0, 0);
        reticlePts.push(-rLen, 0, 0, -rLen + 0.8, 0, 0);
        reticlePts.push(0, 0, rLen, 0, 0, rLen - 0.8);
        reticlePts.push(0, 0, -rLen, 0, 0, -rLen + 0.8);

        reticleGeo.setAttribute('position', new THREE.Float32BufferAttribute(reticlePts, 3));
        const reticle = new THREE.LineSegments(
          reticleGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.accent, linewidth: 2 })
        );
        hudGroup.add(reticle);

        group.add(hudGroup);
        customAnimData.current = { type: 'volumetrichud', hudGroup, ringMeshes, cyl };
        break;
      }

      // 14. Quantum Node Constellation
      case 'quantum-constellation': {
        const constGroup = new THREE.Group();
        const nodeCount = 36;
        const nodePositions: THREE.Vector3[] = [];
        const nodeSpheres: THREE.Mesh[] = [];

        for (let i = 0; i < nodeCount; i++) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = 3.5 + Math.random() * 3.5;

          const pos = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
          nodePositions.push(pos);

          const sGeo = new THREE.SphereGeometry(0.16, 12, 12);
          const sMat = new THREE.MeshStandardMaterial({
            color: i % 3 === 0 ? theme.threeColors.accent : theme.threeColors.primary,
            emissive: theme.threeColors.accent,
            emissiveIntensity: 0.8
          });
          const sphere = new THREE.Mesh(sGeo, sMat);
          sphere.position.copy(pos);
          constGroup.add(sphere);
          nodeSpheres.push(sphere);
        }

        // Dynamic Proximity Neural Links
        const lineGeo = new THREE.BufferGeometry();
        const linePts: number[] = [];
        const maxDist = 3.8;

        for (let i = 0; i < nodeCount; i++) {
          for (let j = i + 1; j < nodeCount; j++) {
            if (nodePositions[i].distanceTo(nodePositions[j]) < maxDist) {
              linePts.push(nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
              linePts.push(nodePositions[j].x, nodePositions[j].y, nodePositions[j].z);
            }
          }
        }

        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
        const lines = new THREE.LineSegments(
          lineGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.secondary, transparent: true, opacity: 0.45 })
        );
        constGroup.add(lines);

        group.add(constGroup);
        customAnimData.current = { type: 'constellation', constGroup, nodeSpheres, nodePositions };
        break;
      }

      // 15. Cybernetic Depth Scanner
      case 'cyber-depth-scanner': {
        const scanGroup = new THREE.Group();
        const gridSize = 40;
        const terrainGeo = new THREE.PlaneGeometry(12, 12, gridSize, gridSize);
        terrainGeo.rotateX(-Math.PI / 2);

        const posAttr = terrainGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const y = amp * (Math.sin(x * 0.8) * Math.cos(z * 0.8) + 0.5 * Math.sin(x * 1.5 - z * 1.5));
          posAttr.setY(i, y);
        }
        terrainGeo.computeVertexNormals();

        const terrainMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.primary,
          wireframe: mode === 'wireframe' || mode === 'hybrid',
          transparent: true,
          opacity: mode === 'holographic' ? 0.6 : 0.85,
          roughness: 0.3
        });
        const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
        scanGroup.add(terrainMesh);

        // Laser Scanning Sweep Plane
        const laserPlaneGeo = new THREE.PlaneGeometry(13, 4);
        const laserMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.accent,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        });
        const laserPlane = new THREE.Mesh(laserPlaneGeo, laserMat);
        scanGroup.add(laserPlane);

        group.add(scanGroup);
        customAnimData.current = { type: 'depthscanner', scanGroup, laserPlane, terrainMesh };
        break;
      }

      // 16. Cylindrical Orbital Console
      case 'orbital-console': {
        const consoleGroup = new THREE.Group();
        const r = 6.0;
        const h = 3.8;
        const thetaStart = -Math.PI * 0.75;
        const thetaLen = Math.PI * 1.5;

        // Curved screen panel
        const screenGeo = new THREE.CylinderGeometry(r, r, h, 48, 12, true, thetaStart, thetaLen);
        const screenMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.primary,
          wireframe: mode === 'wireframe' || mode === 'hybrid',
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide
        });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        consoleGroup.add(screenMesh);

        // Holographic flight HUD reticles inside console
        const horizonGeo = new THREE.BufferGeometry();
        const hPts = [
          -2.5, 0, 0,  2.5, 0, 0,
          -1.5, 0.5, 0, -1.5, -0.5, 0,
          1.5, 0.5, 0, 1.5, -0.5, 0
        ];
        horizonGeo.setAttribute('position', new THREE.Float32BufferAttribute(hPts, 3));
        const horizon = new THREE.LineSegments(
          horizonGeo,
          new THREE.LineBasicMaterial({ color: theme.threeColors.accent, linewidth: 2 })
        );
        consoleGroup.add(horizon);

        group.add(consoleGroup);
        customAnimData.current = { type: 'orbitalconsole', consoleGroup, screenMesh, horizon };
        break;
      }

      // ==========================================
      // --- CATEGORY: CYBER DRAGON (DRAGON9) ---
      // ==========================================

      // 13. Dragon9 Cybernetic Visage (Full Mecha Dragon Head)
      case 'cyber-dragon-visage': {
        const dragonGroup = new THREE.Group();
        dragonGroup.name = 'dragonVisage';

        // Materials
        const armorMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.ambient,
          emissive: theme.threeColors.primary,
          emissiveIntensity: mode === 'holographic' ? 0.7 : 0.25,
          metalness: 0.9,
          roughness: 0.15,
          wireframe: mode === 'wireframe',
          transparent: true,
          opacity: mode === 'holographic' ? 0.75 : 0.95
        });

        const goldPlateMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.accent,
          emissive: theme.threeColors.accent,
          emissiveIntensity: 0.35,
          metalness: 0.95,
          roughness: 0.1,
          wireframe: mode === 'wireframe',
          transparent: true,
          opacity: mode === 'holographic' ? 0.8 : 1.0
        });

        const eyeGlowMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.primary,
          transparent: true,
          opacity: 0.95
        });

        const wireGlowMat = new THREE.LineBasicMaterial({
          color: theme.threeColors.primary,
          transparent: true,
          opacity: 0.85
        });

        // --- 1. CRANIAL SKULL & SNOUT MESH ---
        // Custom Faceted Low-Poly Dragon Cranium
        const skullGeo = new THREE.ConeGeometry(2.4, 5.5, 6);
        skullGeo.rotateX(Math.PI / 2);
        skullGeo.scale(1.2, 0.7, 1.4);
        skullGeo.translate(0, 0.2, 1.2);
        const skullMesh = new THREE.Mesh(skullGeo, armorMat);
        dragonGroup.add(skullMesh);

        // Wireframe overlay for cyber aesthetic
        const skullWire = new THREE.LineSegments(new THREE.WireframeGeometry(skullGeo), wireGlowMat);
        dragonGroup.add(skullWire);

        // Brow Crest Plates
        const browGeo = new THREE.ConeGeometry(1.6, 3.2, 4);
        browGeo.rotateX(-Math.PI / 3);
        browGeo.scale(1.4, 0.5, 1.0);
        browGeo.translate(0, 1.6, 0.2);
        const browMesh = new THREE.Mesh(browGeo, goldPlateMat);
        dragonGroup.add(browMesh);

        // --- 2. MANDIBLE / LOWER JAW (Kinetic Breathing) ---
        const jawGroup = new THREE.Group();
        jawGroup.name = 'dragonJaw';
        const jawGeo = new THREE.ConeGeometry(1.8, 4.8, 5);
        jawGeo.rotateX(Math.PI / 2);
        jawGeo.scale(1.0, 0.45, 1.2);
        jawGeo.translate(0, -0.6, 1.0);
        const jawMesh = new THREE.Mesh(jawGeo, armorMat);
        jawGroup.add(jawMesh);

        // Dragon Fangs
        const fangGeo = new THREE.ConeGeometry(0.12, 0.7, 4);
        fangGeo.rotateX(Math.PI);
        const leftFang = new THREE.Mesh(fangGeo, goldPlateMat);
        leftFang.position.set(0.7, -0.2, 2.8);
        const rightFang = new THREE.Mesh(fangGeo, goldPlateMat);
        rightFang.position.set(-0.7, -0.2, 2.8);
        jawGroup.add(leftFang, rightFang);
        dragonGroup.add(jawGroup);

        // --- 3. DUAL LOGARITHMIC SPIRAL HORNS ---
        const buildHorn = (isLeft: boolean) => {
          const hornCurvePts: THREE.Vector3[] = [];
          const hornSegments = 36;
          const sign = isLeft ? 1 : -1;

          for (let i = 0; i <= hornSegments; i++) {
            const u = i / hornSegments;
            const theta = u * Math.PI * 1.8;
            const r = 0.8 + Math.pow(u, 1.3) * 2.2;
            const hx = sign * (0.8 + Math.sin(theta) * r * 0.9);
            const hy = 1.0 + Math.pow(u, 1.2) * 4.2;
            const hz = -0.5 - Math.cos(theta) * r * 1.4;
            hornCurvePts.push(new THREE.Vector3(hx, hy, hz));
          }

          const hornCurve = new THREE.CatmullRomCurve3(hornCurvePts);
          const hornGeo = new THREE.TubeGeometry(hornCurve, 32, 0.45, 8, false);
          
          // Taper horn geometry towards the tip
          const pos = hornGeo.attributes.position;
          for (let j = 0; j < pos.count; j++) {
            const zVal = pos.getZ(j);
            const yVal = pos.getY(j);
            const tParam = Math.max(0, Math.min(1, (yVal - 1.0) / 4.2));
            const taper = 1.0 - tParam * 0.75;
            pos.setX(j, pos.getX(j) * taper + (isLeft ? 0.2 : -0.2) * (1 - taper));
          }
          hornGeo.computeVertexNormals();

          const hornMesh = new THREE.Mesh(hornGeo, goldPlateMat);
          const hornWire = new THREE.LineSegments(new THREE.WireframeGeometry(hornGeo), wireGlowMat);
          
          const hGroup = new THREE.Group();
          hGroup.add(hornMesh, hornWire);

          // Glowing energy rings along the horn
          for (let k = 1; k <= 4; k++) {
            const ringPoint = hornCurve.getPoint(k / 5);
            const ringGeo = new THREE.TorusGeometry(0.55 - k * 0.08, 0.05, 8, 16);
            ringGeo.lookAt(hornCurve.getTangent(k / 5));
            const ringMesh = new THREE.Mesh(ringGeo, eyeGlowMat);
            ringMesh.position.copy(ringPoint);
            hGroup.add(ringMesh);
          }

          return hGroup;
        };

        const leftHorn = buildHorn(true);
        const rightHorn = buildHorn(false);
        dragonGroup.add(leftHorn, rightHorn);

        // --- 4. OCULAR HUD SENSOR VISOR & EYES ---
        const eyeGeo = new THREE.SphereGeometry(0.35, 16, 16);
        eyeGeo.scale(1.4, 0.7, 0.8);
        
        const leftEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
        leftEye.position.set(0.95, 0.75, 1.4);
        leftEye.rotation.y = 0.3;
        leftEye.rotation.z = -0.2;

        const rightEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
        rightEye.position.set(-0.95, 0.75, 1.4);
        rightEye.rotation.y = -0.3;
        rightEye.rotation.z = 0.2;

        // HUD Targeting Crosshair Reticles on Eyes
        const reticleGeo = new THREE.RingGeometry(0.45, 0.52, 16);
        const leftReticle = new THREE.Mesh(reticleGeo, eyeGlowMat);
        leftReticle.position.set(1.15, 0.75, 1.6);
        leftReticle.rotation.y = 0.4;

        const rightReticle = new THREE.Mesh(reticleGeo, eyeGlowMat);
        rightReticle.position.set(-1.15, 0.75, 1.6);
        rightReticle.rotation.y = -0.4;

        dragonGroup.add(leftEye, rightEye, leftReticle, rightReticle);

        // --- 5. DUAL FLOWING WHISKER LEMNISCATE RIBBONS ---
        const whiskerLeftPts: THREE.Vector3[] = [];
        const whiskerRightPts: THREE.Vector3[] = [];
        const wCount = 40;
        for (let i = 0; i <= wCount; i++) {
          const u = i / wCount;
          whiskerLeftPts.push(new THREE.Vector3(1.1 + u * 2.5, -0.2 - u * 2.0, 3.2 - u * 5.0));
          whiskerRightPts.push(new THREE.Vector3(-1.1 - u * 2.5, -0.2 - u * 2.0, 3.2 - u * 5.0));
        }
        const whiskerLeftCurve = new THREE.CatmullRomCurve3(whiskerLeftPts);
        const whiskerRightCurve = new THREE.CatmullRomCurve3(whiskerRightPts);
        
        const whiskerGeoL = new THREE.TubeGeometry(whiskerLeftCurve, 32, 0.08, 6, false);
        const whiskerGeoR = new THREE.TubeGeometry(whiskerRightCurve, 32, 0.08, 6, false);
        const whiskerMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.primary,
          emissive: theme.threeColors.primary,
          emissiveIntensity: 0.6,
          wireframe: mode === 'wireframe'
        });
        const whiskerMeshL = new THREE.Mesh(whiskerGeoL, whiskerMat);
        const whiskerMeshR = new THREE.Mesh(whiskerGeoR, whiskerMat);
        dragonGroup.add(whiskerMeshL, whiskerMeshR);

        // --- 6. SPINAL VERTEBRAE CREST PLATES ---
        for (let s = 0; s < 5; s++) {
          const spineGeo = new THREE.ConeGeometry(0.35 - s * 0.04, 1.4 - s * 0.15, 4);
          spineGeo.rotateX(-0.5);
          const spineMesh = new THREE.Mesh(spineGeo, goldPlateMat);
          spineMesh.position.set(0, 1.5 - s * 0.35, -0.8 - s * 1.0);
          dragonGroup.add(spineMesh);
        }

        // --- 7. PARTICLES: DRAGON BREATH & ENERGY AURA ---
        const dParticleCount = Math.min(particleCount, 4000);
        const dpGeo = new THREE.BufferGeometry();
        const dpPos = new Float32Array(dParticleCount * 3);
        const dpColors = new Float32Array(dParticleCount * 3);
        const dpSeeds = new Float32Array(dParticleCount);

        const pCol1 = new THREE.Color(theme.threeColors.primary);
        const pCol2 = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i < dParticleCount; i++) {
          const rad = 2.0 + Math.random() * 4.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;

          dpPos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
          dpPos[i * 3 + 1] = rad * Math.cos(phi);
          dpPos[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);

          const col = Math.random() > 0.4 ? pCol1 : pCol2;
          dpColors[i * 3] = col.r;
          dpColors[i * 3 + 1] = col.g;
          dpColors[i * 3 + 2] = col.b;

          dpSeeds[i] = Math.random() * Math.PI * 2;
        }

        dpGeo.setAttribute('position', new THREE.BufferAttribute(dpPos, 3));
        dpGeo.setAttribute('color', new THREE.BufferAttribute(dpColors, 3));

        const dpMat = new THREE.PointsMaterial({
          size: 0.12,
          vertexColors: true,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending
        });

        const dParticles = new THREE.Points(dpGeo, dpMat);
        dragonGroup.add(dParticles);

        group.add(dragonGroup);
        customAnimData.current = {
          type: 'cyberdragonvisage',
          dragonGroup,
          jawGroup,
          leftEye,
          rightEye,
          leftReticle,
          rightReticle,
          whiskerMeshL,
          whiskerMeshR,
          dParticles,
          dpSeeds
        };
        break;
      }

      // 14. Logarithmic Dragon Horn Spiral
      case 'dragon-spiral-horns': {
        const hornsGroup = new THREE.Group();
        hornsGroup.name = 'dragonHorns';

        const hornMaterial = new THREE.MeshStandardMaterial({
          color: theme.threeColors.primary,
          emissive: theme.threeColors.primary,
          emissiveIntensity: mode === 'holographic' ? 0.6 : 0.2,
          metalness: 0.9,
          roughness: 0.2,
          wireframe: mode === 'wireframe',
          transparent: true,
          opacity: mode === 'holographic' ? 0.7 : 0.95
        });

        const ringMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.accent,
          wireframe: true
        });

        const numHorns = 2;
        const hornRings: THREE.Mesh[] = [];

        for (let h = 0; h < numHorns; h++) {
          const isLeft = h === 0;
          const sign = isLeft ? 1 : -1;
          const curvePts: THREE.Vector3[] = [];
          const segs = Math.max(50, density * 3);

          for (let i = 0; i <= segs; i++) {
            const u = i / segs;
            const theta = u * Math.PI * 3.5;
            const r = 0.5 + Math.pow(u, 1.4) * 3.5;
            const x = sign * (1.2 + Math.sin(theta) * r * 0.95);
            const y = (u - 0.5) * 8.5;
            const z = Math.cos(theta) * r * 1.2;
            curvePts.push(new THREE.Vector3(x, y, z));
          }

          const curve = new THREE.CatmullRomCurve3(curvePts);
          const tubeGeo = new THREE.TubeGeometry(curve, segs, 0.5, 12, false);
          
          // Taper horn towards the top
          const pos = tubeGeo.attributes.position;
          for (let j = 0; j < pos.count; j++) {
            const y = pos.getY(j);
            const normY = Math.max(0, Math.min(1, (y + 4.25) / 8.5));
            const taper = 1.0 - normY * 0.8;
            pos.setX(j, pos.getX(j) * taper);
            pos.setZ(j, pos.getZ(j) * taper);
          }
          tubeGeo.computeVertexNormals();

          const hornMesh = new THREE.Mesh(tubeGeo, hornMaterial);
          hornsGroup.add(hornMesh);

          // Add Fibonacci energy nodes along the horn
          const nodeCount = 9;
          for (let n = 1; n <= nodeCount; n++) {
            const pt = curve.getPoint(n / (nodeCount + 1));
            const nodeGeo = new THREE.TorusGeometry(0.65 - (n / nodeCount) * 0.45, 0.06, 8, 16);
            nodeGeo.lookAt(curve.getTangent(n / (nodeCount + 1)));
            const nodeMesh = new THREE.Mesh(nodeGeo, ringMat);
            nodeMesh.position.copy(pt);
            hornsGroup.add(nodeMesh);
            hornRings.push(nodeMesh);
          }
        }

        // Central Harmonic Spire
        const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, 9, 8);
        const spireMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.accent,
          emissive: theme.threeColors.accent,
          emissiveIntensity: 0.5,
          wireframe: true
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        hornsGroup.add(spire);

        group.add(hornsGroup);
        customAnimData.current = { type: 'dragonhorns', hornsGroup, hornRings };
        break;
      }

      // 15. Fluid Whisker Lemniscate Streams
      case 'dragon-whisker-lemniscate': {
        const whiskerGroup = new THREE.Group();
        whiskerGroup.name = 'dragonWhiskers';

        const ribbonCount = 4;
        const whiskerMeshes: THREE.Mesh[] = [];

        for (let r = 0; r < ribbonCount; r++) {
          const side = r % 2 === 0 ? 1 : -1;
          const tier = Math.floor(r / 2);
          const pts: THREE.Vector3[] = [];
          const segments = 80;

          for (let i = 0; i <= segments; i++) {
            const u = i / segments;
            const tParam = u * Math.PI * 2;
            const x = side * (0.8 + u * 6.0 + Math.sin(tParam * 2) * 0.8 * amp);
            const y = (tier === 0 ? 0.5 : -0.5) + Math.cos(tParam * 3) * 1.2 * amp;
            const z = -u * 9.0 + Math.sin(tParam) * 2.0 * amp;
            pts.push(new THREE.Vector3(x, y, z));
          }

          const curve = new THREE.CatmullRomCurve3(pts);
          const tubeGeo = new THREE.TubeGeometry(curve, segments, 0.15 - tier * 0.04, 8, false);
          const tubeMat = new THREE.MeshStandardMaterial({
            color: side > 0 ? theme.threeColors.primary : theme.threeColors.secondary,
            emissive: side > 0 ? theme.threeColors.primary : theme.threeColors.secondary,
            emissiveIntensity: 0.5,
            wireframe: mode === 'wireframe',
            transparent: true,
            opacity: mode === 'holographic' ? 0.7 : 0.95
          });
          const mesh = new THREE.Mesh(tubeGeo, tubeMat);
          whiskerGroup.add(mesh);
          whiskerMeshes.push(mesh);
        }

        // Particle Stream on Whiskers
        const pCount = Math.min(particleCount, 5000);
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(pCount * 3);
        const pColors = new Float32Array(pCount * 3);
        const pOffsets = new Float32Array(pCount);
        const pSides = new Float32Array(pCount);

        const colPrimary = new THREE.Color(theme.threeColors.primary);
        const colAccent = new THREE.Color(theme.threeColors.accent);

        for (let i = 0; i < pCount; i++) {
          pOffsets[i] = Math.random();
          pSides[i] = Math.random() > 0.5 ? 1 : -1;
          const c = Math.random() > 0.3 ? colPrimary : colAccent;
          pColors[i * 3] = c.r;
          pColors[i * 3 + 1] = c.g;
          pColors[i * 3 + 2] = c.b;
        }

        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

        const pMat = new THREE.PointsMaterial({
          size: 0.14,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });

        const whiskerParticles = new THREE.Points(pGeo, pMat);
        whiskerGroup.add(whiskerParticles);

        group.add(whiskerGroup);
        customAnimData.current = {
          type: 'dragonwhiskers',
          whiskerGroup,
          whiskerMeshes,
          whiskerParticles,
          pOffsets,
          pSides
        };
        break;
      }

      // 16. Mecha Ocular Core & HUD Visor
      case 'dragon-ocular-core': {
        const eyeCoreGroup = new THREE.Group();
        eyeCoreGroup.name = 'dragonOcularCore';

        // Outer Titanium Housing Chassis
        const housingGeo = new THREE.TorusGeometry(4.2, 0.45, 16, 48);
        const housingMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.ambient,
          emissive: theme.threeColors.primary,
          emissiveIntensity: 0.3,
          metalness: 0.9,
          roughness: 0.2,
          wireframe: mode === 'wireframe'
        });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        eyeCoreGroup.add(housing);

        // Hexagonal Iris Shutter Blades (6 Kinetic Blades)
        const irisGroup = new THREE.Group();
        const bladeGeo = new THREE.BufferGeometry();
        const bladeShape = [
          0, 0, 0,
          1.8, 0.8, 0,
          0.6, 2.2, 0
        ];
        bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute(bladeShape, 3));
        bladeGeo.computeVertexNormals();
        const bladeMat = new THREE.MeshStandardMaterial({
          color: theme.threeColors.accent,
          emissive: theme.threeColors.accent,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide,
          metalness: 0.95,
          roughness: 0.1,
          wireframe: mode === 'wireframe'
        });

        const irisBlades: THREE.Mesh[] = [];
        for (let b = 0; b < 6; b++) {
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          const angle = (b / 6) * Math.PI * 2;
          blade.rotation.z = angle;
          blade.position.set(Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, 0);
          irisGroup.add(blade);
          irisBlades.push(blade);
        }
        eyeCoreGroup.add(irisGroup);

        // Central Pupil Light Core (Glowing Sphere + Laser Cones)
        const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.primary,
          transparent: true,
          opacity: 0.9
        });
        const pupilCore = new THREE.Mesh(coreGeo, coreMat);
        eyeCoreGroup.add(pupilCore);

        // Concentric HUD Reticle Target Rings
        const ring1Geo = new THREE.RingGeometry(2.4, 2.5, 32);
        const ring2Geo = new THREE.RingGeometry(3.3, 3.42, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.primary,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const reticle1 = new THREE.Mesh(ring1Geo, ringMat);
        reticle1.position.z = 0.3;
        const reticle2 = new THREE.Mesh(ring2Geo, ringMat);
        reticle2.position.z = 0.5;
        eyeCoreGroup.add(reticle1, reticle2);

        // Laser Projection Cones
        const coneGeo = new THREE.ConeGeometry(2.8, 6.0, 32, 1, true);
        coneGeo.rotateX(Math.PI / 2);
        coneGeo.translate(0, 0, 3.0);
        const coneMat = new THREE.MeshBasicMaterial({
          color: theme.threeColors.primary,
          wireframe: true,
          transparent: true,
          opacity: 0.35
        });
        const laserCone = new THREE.Mesh(coneGeo, coneMat);
        eyeCoreGroup.add(laserCone);

        group.add(eyeCoreGroup);
        customAnimData.current = {
          type: 'dragonocularcore',
          eyeCoreGroup,
          irisGroup,
          irisBlades,
          pupilCore,
          reticle1,
          reticle2,
          laserCone
        };
        break;
      }

      default: {
        // Fallback Octahedron
        const fGeo = new THREE.OctahedronGeometry(4, 2);
        const fMat = new THREE.MeshStandardMaterial({ color: theme.threeColors.primary, wireframe: true });
        group.add(new THREE.Mesh(fGeo, fMat));
        break;
      }
    }

    exhibitGroupRef.current = group;
    scene.add(group);
  }, []);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    sphericalCoords.current.radius = currentExhibit.defaultParams.zoom || 20;
    updateCameraPosition();

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(15, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f3ff, 0.8);
    dirLight2.position.set(-15, -10, -15);
    scene.add(dirLight2);

    // Initial build
    buildHelpers(scene, params.colorTheme, params.showAxes, params.showGrid);
    buildExhibitMesh(currentExhibit, params, scene);

    // Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Mouse / Touch Controls
    const dom = renderer.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      // Check for Pan (Right Click, Middle Click, or Shift+Left Click)
      if (e.button === 2 || e.button === 1 || e.shiftKey) {
        isPanning.current = true;
        isDragging.current = false;
        setGestureMode('panning');
      } else if (e.button === 0) {
        isDragging.current = true;
        isPanning.current = false;
        setGestureMode('rotating');
      }
      velocity.current = { theta: 0, phi: 0, panX: 0, panY: 0 };
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };

      if (isDragging.current) {
        const rotSpeed = 0.006;
        const dTheta = -deltaX * rotSpeed;
        const dPhi = -deltaY * rotSpeed;
        
        targetCoords.current.theta += dTheta;
        targetCoords.current.phi = Math.max(0.001, Math.min(Math.PI - 0.001, targetCoords.current.phi + dPhi));
        
        velocity.current.theta = dTheta;
        velocity.current.phi = dPhi;
        setGestureMode('rotating');
      } else if (isPanning.current && cameraRef.current) {
        // Pan relative to current camera distance and view basis
        const panFactor = sphericalCoords.current.radius * 0.0014;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        cameraRef.current.matrix.extractBasis(right, up, new THREE.Vector3());
        
        targetCameraTarget.current.addScaledVector(right, -deltaX * panFactor);
        targetCameraTarget.current.addScaledVector(up, deltaY * panFactor);
        setGestureMode('panning');
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isPanning.current = false;
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => setGestureMode('idle'), 600);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Smooth exponential zoom scaling
      const zoomFactor = Math.exp(e.deltaY * 0.0012);
      targetCoords.current.radius = Math.max(3, Math.min(75, targetCoords.current.radius * zoomFactor));
      setGestureMode('zooming');
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => setGestureMode('idle'), 600);
    };

    const handleDblClick = (e: MouseEvent) => {
      e.preventDefault();
      // Smoothly recenter camera target back to origin (0, 0, 0)
      targetCameraTarget.current.set(0, 0, 0);
      setGestureMode('panning');
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => setGestureMode('idle'), 800);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // Touch events for mobile
    let touchStartDist = 0;
    let touchStartCenter = { x: 0, y: 0 };
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        isPanning.current = false;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setGestureMode('rotating');
      } else if (e.touches.length === 2) {
        isDragging.current = false;
        isPanning.current = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.sqrt(dx * dx + dy * dy);
        touchStartCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        previousMousePosition.current = touchStartCenter;
        setGestureMode('zooming');
      }
      velocity.current = { theta: 0, phi: 0, panX: 0, panY: 0 };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging.current) {
        const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        
        const dTheta = -deltaX * 0.007;
        const dPhi = -deltaY * 0.007;
        targetCoords.current.theta += dTheta;
        targetCoords.current.phi = Math.max(0.001, Math.min(Math.PI - 0.001, targetCoords.current.phi + dPhi));
        velocity.current.theta = dTheta;
        velocity.current.phi = dPhi;
        setGestureMode('rotating');
      } else if (e.touches.length === 2 && cameraRef.current) {
        // Pinch Zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        
        if (touchStartDist > 0) {
          const pinchFactor = touchStartDist / currentDist;
          targetCoords.current.radius = Math.max(3, Math.min(75, targetCoords.current.radius * (1 + (pinchFactor - 1) * 0.1)));
        }
        touchStartDist = currentDist;

        // Two-finger Pan
        const currentCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
        const deltaCenterX = currentCenter.x - previousMousePosition.current.x;
        const deltaCenterY = currentCenter.y - previousMousePosition.current.y;
        previousMousePosition.current = currentCenter;

        const panFactor = sphericalCoords.current.radius * 0.0015;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        cameraRef.current.matrix.extractBasis(right, up, new THREE.Vector3());
        
        targetCameraTarget.current.addScaledVector(right, -deltaCenterX * panFactor);
        targetCameraTarget.current.addScaledVector(up, deltaCenterY * panFactor);
        setGestureMode('zooming');
      }
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
      isPanning.current = false;
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => setGestureMode('idle'), 600);
    };

    dom.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('dblclick', handleDblClick);
    dom.addEventListener('contextmenu', handleContextMenu);
    dom.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('dblclick', handleDblClick);
      dom.removeEventListener('contextmenu', handleContextMenu);
      dom.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (dom.parentNode) dom.parentNode.removeChild(dom);
      }
    };
  }, []);

  // Sync zoom parameter changes from UI slider
  useEffect(() => {
    if (params.zoom) {
      targetCoords.current.radius = params.zoom;
    }
  }, [params.zoom]);

  // Update exhibit mesh when piece changes or parameters change
  useEffect(() => {
    if (!sceneRef.current) return;
    buildExhibitMesh(currentExhibit, params, sceneRef.current);
  }, [currentExhibit, params.colorTheme, params.renderMode, params.gridDensity, params.particleCount, params.waveAmplitude, buildExhibitMesh]);

  // Update helpers when visibility toggles change
  useEffect(() => {
    if (!sceneRef.current) return;
    buildHelpers(sceneRef.current, params.colorTheme, params.showAxes, params.showGrid);
  }, [params.colorTheme, params.showAxes, params.showGrid]);

  // Main Render Loop
  useEffect(() => {
    let lastRenderTime = performance.now();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);

      const delta = clockRef.current.getDelta();
      const now = performance.now();
      const frameDelta = now - lastRenderTime;
      lastRenderTime = now;

      // FPS tracking
      fpsStatsRef.current.frames++;
      if (now - fpsStatsRef.current.lastTime >= 500) {
        fpsStatsRef.current.fps = Math.round((fpsStatsRef.current.frames * 1000) / (now - fpsStatsRef.current.lastTime));
        fpsStatsRef.current.frameTime = frameDelta;
        fpsStatsRef.current.frames = 0;
        fpsStatsRef.current.lastTime = now;
      }

      if (!params.isPaused) {
        elapsedRef.current += delta * params.loopFrequency * (params.rotationSpeed > 0 ? 1 : 0.5);
      }
      const t = elapsedRef.current;

      // Auto rotation
      if (params.autoRotate && !isDragging.current && !isPanning.current) {
        targetCoords.current.theta += delta * params.rotationSpeed * 0.35;
      }

      // Smooth Orbit Controls Damping & Inertia
      const dampFactor = 0.12;
      sphericalCoords.current.radius += (targetCoords.current.radius - sphericalCoords.current.radius) * dampFactor;
      sphericalCoords.current.theta += (targetCoords.current.theta - sphericalCoords.current.theta) * dampFactor;
      sphericalCoords.current.phi += (targetCoords.current.phi - sphericalCoords.current.phi) * dampFactor;
      cameraTarget.current.lerp(targetCameraTarget.current, dampFactor);

      // Apply inertial velocity decay when mouse is released
      if (!isDragging.current) {
        if (Math.abs(velocity.current.theta) > 0.00005 || Math.abs(velocity.current.phi) > 0.00005) {
          targetCoords.current.theta += velocity.current.theta;
          targetCoords.current.phi = Math.max(0.001, Math.min(Math.PI - 0.001, targetCoords.current.phi + velocity.current.phi));
          velocity.current.theta *= 0.92;
          velocity.current.phi *= 0.92;
        }
      }

      updateCameraPosition();

      // Dynamic animations per exhibit
      const anim = customAnimData.current;
      if (anim && exhibitGroupRef.current && !params.isPaused) {
        // Base group gentle rotation
        exhibitGroupRef.current.rotation.y = t * params.rotationSpeed * 0.3;

        // Specific exhibit animation behaviors
        if (anim.type === 'bernoulli' && anim.curve1 && anim.curve2 && anim.particles) {
          const posAttr = anim.particles.geometry.attributes.position;
          const pOffsets = anim.pOffsets;
          const pSpeeds = anim.pSpeeds;
          const pPhases = anim.pPhases;

          for (let i = 0; i < pOffsets.length; i++) {
            pOffsets[i] = (pOffsets[i] + delta * 0.15 * pSpeeds[i] * params.loopFrequency) % 1.0;
            const curve = pPhases[i] === 0 ? anim.curve1 : anim.curve2;
            const pt = curve.getPointAt(pOffsets[i]);
            posAttr.setXYZ(i, pt.x, pt.y, pt.z);
          }
          posAttr.needsUpdate = true;

          if (anim.nexusMesh) {
            anim.nexusMesh.rotation.x = t * 2;
            anim.nexusMesh.rotation.y = t * 1.5;
            const pulse = 1.0 + 0.15 * Math.sin(t * 4);
            anim.nexusMesh.scale.set(pulse, pulse, pulse);
          }
        } else if (anim.type === 'trefoil' && anim.satGroup) {
          anim.satGroup.children.forEach((sat: THREE.Object3D, i: number) => {
            const frac = (i / anim.satCount + t * 0.1 * params.loopFrequency) % 1.0;
            const u = frac * Math.PI * 2;
            const p = 2, q = 3;
            const r = 4.5 + 1.1 * Math.cos(q * u);
            sat.position.set(
              r * Math.cos(p * u),
              1.1 * Math.sin(q * u),
              r * Math.sin(p * u)
            );
          });
        } else if (anim.type === 'dualtorus') {
          if (anim.t1 && anim.t2) {
            anim.t1.rotation.z = t * 0.8;
            anim.t2.rotation.z = -t * 0.8;
          }
        } else if (anim.type === 'tesseract' && anim.nodeMeshes && anim.edgeGeo) {
          // 4D Rotation in XW and YZ planes
          const theta = t * 0.6 * params.rotationSpeed;
          const phi = t * 0.4 * params.rotationSpeed;
          const cosT = Math.cos(theta), sinT = Math.sin(theta);
          const cosP = Math.cos(phi), sinP = Math.sin(phi);
          const d = 4.2; // 4D camera distance

          const projected3D: THREE.Vector3[] = [];

          anim.vertices4D.forEach((v4: number[], i: number) => {
            // Rotate in XW
            const x1 = v4[0] * cosT - v4[3] * sinT;
            const w1 = v4[0] * sinT + v4[3] * cosT;
            // Rotate in YZ
            const y1 = v4[1] * cosP - v4[2] * sinP;
            const z1 = v4[1] * sinP + v4[2] * cosP;

            // Stereographic perspective projection 4D -> 3D
            const scale = d / (d - w1 * 0.35);
            const p3 = new THREE.Vector3(x1 * scale, y1 * scale, z1 * scale);
            projected3D.push(p3);

            anim.nodeMeshes[i].position.copy(p3);
          });

          const posAttr = anim.edgeGeo.attributes.position;
          anim.edges.forEach((edge: [number, number], i: number) => {
            const p1 = projected3D[edge[0]];
            const p2 = projected3D[edge[1]];
            posAttr.setXYZ(i * 2, p1.x, p1.y, p1.z);
            posAttr.setXYZ(i * 2 + 1, p2.x, p2.y, p2.z);
          });
          posAttr.needsUpdate = true;
        } else if (anim.type === 'gimbal' && anim.gimbalRings) {
          anim.gimbalRings[0].rotation.x = t * 0.5;
          anim.gimbalRings[1].rotation.y = t * 0.7;
          anim.gimbalRings[2].rotation.z = t * 0.9;
        } else if (anim.type === 'hyperbolicocta' && anim.octaMeshes) {
          anim.octaMeshes.forEach((mesh: THREE.LineLoop, i: number) => {
            mesh.rotation.y = (i % 2 === 0 ? 1 : -1) * t * 0.8 * params.loopFrequency;
          });
        } else if (anim.type === 'depthscanner' && anim.laserPlane) {
          const zScan = Math.sin(t * 2 * params.loopFrequency) * 5.5;
          anim.laserPlane.position.z = zScan;
          anim.laserPlane.position.y = 0.5;
        } else if (anim.type === 'volumetrichud' && anim.ringMeshes) {
          anim.ringMeshes.forEach((r: THREE.Line, i: number) => {
            r.rotation.y = (i % 2 === 0 ? 1 : -1) * t * 0.4 * (i + 1);
          });
        } else if (anim.type === 'cyberdragonvisage') {
          // Kinetic Mandible Breathing flex
          if (anim.jawGroup) {
            anim.jawGroup.rotation.x = 0.08 + Math.sin(t * 2.5 * params.loopFrequency) * 0.06;
          }
          // Eye Reticle Target Rotation
          if (anim.leftReticle) anim.leftReticle.rotation.z = t * 1.5;
          if (anim.rightReticle) anim.rightReticle.rotation.z = -t * 1.5;
          // Whiskers fluid motion
          if (anim.whiskerMeshL && anim.whiskerMeshR) {
            anim.whiskerMeshL.rotation.y = Math.sin(t * 3.0 * params.loopFrequency) * 0.12;
            anim.whiskerMeshR.rotation.y = -Math.sin(t * 3.0 * params.loopFrequency) * 0.12;
          }
          // Dragon breath / aura orbital swirl
          if (anim.dParticles && anim.dpSeeds) {
            const pAttr = anim.dParticles.geometry.attributes.position;
            const pCount = pAttr.count;
            for (let i = 0; i < pCount; i++) {
              const seed = anim.dpSeeds[i];
              const r = 2.5 + Math.sin(t * 1.5 + seed) * 1.5;
              const theta = seed + t * 0.8;
              const phi = Math.cos(seed * 2 + t * 0.5) * Math.PI * 0.5 + Math.PI * 0.5;
              pAttr.setXYZ(
                i,
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi) + Math.sin(t * 2 + seed) * 0.5,
                r * Math.sin(phi) * Math.sin(theta) + 1.2
              );
            }
            pAttr.needsUpdate = true;
          }
        } else if (anim.type === 'dragonhorns' && anim.hornRings) {
          anim.hornRings.forEach((ring: THREE.Mesh, i: number) => {
            const s = 1.0 + Math.sin(t * 3.0 + i * 0.5) * 0.18;
            ring.scale.set(s, s, s);
          });
        } else if (anim.type === 'dragonwhiskers' && anim.whiskerParticles && anim.pOffsets) {
          const pAttr = anim.whiskerParticles.geometry.attributes.position;
          const count = pAttr.count;
          for (let i = 0; i < count; i++) {
            let offset = anim.pOffsets[i] + delta * 0.4 * params.loopFrequency;
            if (offset > 1) offset -= 1;
            anim.pOffsets[i] = offset;

            const side = anim.pSides[i];
            const u = offset;
            const tParam = u * Math.PI * 2;
            const px = side * (0.8 + u * 6.0 + Math.sin(tParam * 2 + t * 2) * 0.8 * params.waveAmplitude);
            const py = Math.cos(tParam * 3 + t * 3) * 1.2 * params.waveAmplitude;
            const pz = -u * 9.0 + Math.sin(tParam + t * 2) * 2.0 * params.waveAmplitude;
            pAttr.setXYZ(i, px, py, pz);
          }
          pAttr.needsUpdate = true;
        } else if (anim.type === 'dragonocularcore') {
          // Iris aperture opening / closing
          if (anim.irisBlades) {
            const aperture = 0.5 + Math.sin(t * 2.0 * params.loopFrequency) * 0.35;
            anim.irisBlades.forEach((blade: THREE.Mesh, i: number) => {
              const angle = (i / 6) * Math.PI * 2;
              blade.position.set(
                Math.cos(angle) * (0.4 + aperture * 0.5),
                Math.sin(angle) * (0.4 + aperture * 0.5),
                0
              );
            });
          }
          // Reticle counter rotations
          if (anim.reticle1) anim.reticle1.rotation.z = t * 1.2;
          if (anim.reticle2) anim.reticle2.rotation.z = -t * 0.8;
          // Laser cone oscillation
          if (anim.laserCone) {
            anim.laserCone.rotation.z = t * 0.6;
            const laserScale = 1.0 + Math.sin(t * 4.0) * 0.08;
            anim.laserCone.scale.set(laserScale, laserScale, 1.0);
          }
        }
      }

      // Render Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);

        // Calculate live transformation matrix & metrics for HUD
        if (exhibitGroupRef.current) {
          const m = exhibitGroupRef.current.matrixWorld.elements;
          const matrix4x4 = [
            [m[0], m[4], m[8], m[12]],
            [m[1], m[5], m[9], m[13]],
            [m[2], m[6], m[10], m[14]],
            [m[3], m[7], m[11], m[15]]
          ];

          const euler = exhibitGroupRef.current.rotation;
          const quat = exhibitGroupRef.current.quaternion;
          const cam = cameraRef.current;

          let vertexCount = 0;
          let triangleCount = 0;
          exhibitGroupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              vertexCount += child.geometry.attributes.position?.count || 0;
              if (child.geometry.index) {
                triangleCount += child.geometry.index.count / 3;
              } else {
                triangleCount += (child.geometry.attributes.position?.count || 0) / 3;
              }
            } else if (child instanceof THREE.Points || child instanceof THREE.Line) {
              vertexCount += child.geometry.attributes.position?.count || 0;
            }
          });

          onMetricsUpdate({
            matrix4x4,
            eulerDeg: {
              x: (euler.x * 180) / Math.PI,
              y: (euler.y * 180) / Math.PI,
              z: (euler.z * 180) / Math.PI
            },
            eulerRad: { x: euler.x, y: euler.y, z: euler.z },
            quaternion: { x: quat.x, y: quat.y, z: quat.z, w: quat.w },
            cameraPos: {
              x: cam.position.x,
              y: cam.position.y,
              z: cam.position.z,
              distance: sphericalCoords.current.radius,
              fov: cam.fov
            },
            verticesCount: vertexCount,
            trianglesCount: Math.round(triangleCount),
            drawCalls: rendererRef.current.info.render.calls,
            fps: fpsStatsRef.current.fps,
            frameTimeMs: fpsStatsRef.current.frameTime,
            phaseAngleRad: (t % (Math.PI * 2)),
            spatialSyncRatio: Number((((Math.sin(t) + 1) / 2) * 100).toFixed(1))
          });
        }
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [params.isPaused, params.autoRotate, params.rotationSpeed, params.loopFrequency, onMetricsUpdate]);

  const getCursorClass = () => {
    if (gestureMode === 'panning') return 'cursor-move';
    if (gestureMode === 'zooming') return 'cursor-ns-resize';
    if (gestureMode === 'rotating') return 'cursor-grabbing';
    return 'cursor-grab';
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full ${getCursorClass()} overflow-hidden select-none`}
    >
      {/* 3D Orbit Gesture Active Indicator */}
      {gestureMode !== 'idle' && (
        <div className="absolute top-4 right-4 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(0,243,255,0.3)] backdrop-blur-md text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider uppercase">
            {gestureMode === 'rotating' && '3D ORBIT • ROTATING'}
            {gestureMode === 'panning' && '3D PAN • TRANSLATING TARGET'}
            {gestureMode === 'zooming' && '3D ZOOM • DISTANCE SCALING'}
          </span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">
            r: {sphericalCoords.current.radius.toFixed(1)}u
          </span>
        </div>
      )}
    </div>
  );
};
