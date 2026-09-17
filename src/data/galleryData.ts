import { ExhibitItem, GalleryCategory } from '../types';

export interface CategoryMetadata {
  id: GalleryCategory;
  name: string;
  tagline: string;
  badge: string;
  iconName: string;
  accentColor: string;
  description: string;
}

export const CATEGORIES: CategoryMetadata[] = [
  {
    id: 'infinity-loops',
    name: 'Infinity Loops',
    tagline: 'Two-Phase Harmonic Continuous Flows',
    badge: 'LEM-∞',
    iconName: 'Infinity',
    accentColor: '#00f3ff',
    description: 'Dynamic non-orientable manifolds and counter-circulating two-phase fluid lemniscates with synchronized harmonic phase modulation.'
  },
  {
    id: 'octagonal-grids',
    name: 'Octagonal Grids',
    tagline: '8-Fold Isometric Dimensional Matrix',
    badge: 'OCT-8',
    iconName: 'Grid',
    accentColor: '#00ff88',
    description: 'Octagonal stereographic coordinate webs, sacred dimensional lattices, and nodal flux junctions with dynamic radial vector fields.'
  },
  {
    id: '3d-webgl',
    name: '3D WebGL Canvas',
    tagline: 'Multi-Axis Precision Coordinate System',
    badge: 'XYZ-3D',
    iconName: 'Boxes',
    accentColor: '#c084fc',
    description: 'Gimbal spatial transformation frames, Euler rotation arcs, 4D-to-3D tesseract projections, and precision Euclidean coordinate planes.'
  },
  {
    id: 'holographic-ui',
    name: 'Holographic UI',
    tagline: 'Volumetric HUD & Quantum Spatial Telemetry',
    badge: 'HUD-HOLO',
    iconName: 'Layers',
    accentColor: '#ffaa00',
    description: 'Floating laser-guided volumetric interfaces, sonic wave rings, cylindrical telemetry consoles, and spatial point cloud sweeps.'
  },
  {
    id: 'cyber-dragon',
    name: 'Cyber Dragon',
    tagline: 'Dragon9 Biomechanical Visage & Temporal Nexus',
    badge: 'D9-NEXUS',
    iconName: 'Sparkles',
    accentColor: '#f43f5e',
    description: 'Biomechanical cyber-dragon visage with logarithmic horns, glowing ocular HUD sensor visor, kinetic jawplates, and Dragon9 54-minute temporal harmonic resonance.'
  }
];

export const EXHIBITS: ExhibitItem[] = [
  // --- Category: Infinity Loops ---
  {
    id: 'bernoulli-flow',
    categoryId: 'infinity-loops',
    title: 'Two-Phase Bernoulli Lemniscate',
    subtitle: 'Counter-circulating dual ribbon particle vortex',
    description: 'A two-phase continuous infinity stream where two counter-rotating particle streams pass through the central nexus without collision, governed by the parametric Lemniscate of Bernoulli with harmonic Z-axis undulating waves.',
    formula: 'x(t) = a·cos(t) / (1 + sin²(t)),  y(t) = a·sin(t)·cos(t) / (1 + sin²(t)),  z(t) = b·sin(2t + φ)',
    formulaDescription: 'Parametric Bernoulli manifold extended into 3-space with continuous differential harmonic wave modulation.',
    defaultParams: {
      rotationSpeed: 0.8,
      gridDensity: 24,
      loopFrequency: 1.5,
      particleCount: 4200,
      waveAmplitude: 0.85,
      zoom: 18,
      renderMode: 'hybrid',
      colorTheme: 'cyan'
    },
    metrics: {
      phaseOffset: 'Δφ = π / 2 (90°)',
      topologyType: 'Genus-1 Non-Self-Intersecting',
      coordinateFrame: 'Cartesian + Orthogonal Frenet-Serret',
      harmonicRatio: '2 : 3 Harmonic Lock'
    }
  },
  {
    id: 'mobius-strip',
    categoryId: 'infinity-loops',
    title: 'Möbius Quantum Boundary',
    subtitle: 'Non-orientable single-surface twisted continuum',
    description: 'A single continuous topological surface with a half-twist that creates a continuous loop with only one boundary and one side. Normal vector ribbons propagate infinitely along the surface.',
    formula: 'x(u,v) = [1 + (v/2)·cos(u/2)]·cos(u),  y(u,v) = [1 + (v/2)·cos(u/2)]·sin(u),  z(u,v) = (v/2)·sin(u/2)',
    formulaDescription: 'Standard parametric Möbius embedding in ℝ³ with continuous normal vector rotation.',
    defaultParams: {
      rotationSpeed: 0.6,
      gridDensity: 32,
      loopFrequency: 1.0,
      particleCount: 3600,
      waveAmplitude: 0.5,
      zoom: 16,
      renderMode: 'holographic',
      colorTheme: 'cyan'
    },
    metrics: {
      phaseOffset: 'Euler Characteristic χ = 0',
      topologyType: 'Non-Orientable 2-Manifold',
      coordinateFrame: 'Parametric Ribbon (u ∈ [0, 2π], v ∈ [-1, 1])',
      harmonicRatio: '1 : 2 Half-Twist Parity'
    }
  },
  {
    id: 'trefoil-knot',
    categoryId: 'infinity-loops',
    title: 'Harmonic Trefoil Torus Knot',
    subtitle: 'Tri-symmetric (2,3) prime closed manifold',
    description: 'The simplest non-trivial knot, winding around a virtual torus twice longitudinally and three times latitudinally. Emits pulsing energy nodes that oscillate along its continuous perimeter.',
    formula: 'x(t) = sin(t) + 2·sin(2t),  y(t) = cos(t) - 2·cos(2t),  z(t) = -sin(3t)',
    formulaDescription: 'Standard (p=2, q=3) Toroidal prime knot parametrization with harmonic spline tube wrapping.',
    defaultParams: {
      rotationSpeed: 0.9,
      gridDensity: 36,
      loopFrequency: 2.0,
      particleCount: 5000,
      waveAmplitude: 1.0,
      zoom: 20,
      renderMode: 'wireframe',
      colorTheme: 'violet'
    },
    metrics: {
      phaseOffset: 'C3 Rotational Symmetry',
      topologyType: 'Prime Knot 3₁',
      coordinateFrame: 'Toroidal Coordinate Frame (r, θ, φ)',
      harmonicRatio: 'p/q = 2 / 3'
    }
  },
  {
    id: 'vortex-dual-torus',
    categoryId: 'infinity-loops',
    title: 'Formation 8-Torus Vortex',
    subtitle: 'Dual interconnected synchronized toroidal loops',
    description: 'Two interlocking toroidal vortex rings that transfer energy flux symmetrically through their shared central singularity, producing the iconic Formation Infinity Flow geometry.',
    formula: 'R(t, θ) = [R₀ + r·cos(θ)]·e^(i·t) ⊗ [R₀ + r·cos(θ)]·e^(-i·(t + π/2))',
    formulaDescription: 'Coupled dual-torus Hamiltonian phase space oscillator with zero-divergence field lines.',
    defaultParams: {
      rotationSpeed: 1.1,
      gridDensity: 28,
      loopFrequency: 2.5,
      particleCount: 6500,
      waveAmplitude: 1.2,
      zoom: 22,
      renderMode: 'particles',
      colorTheme: 'cyan'
    },
    metrics: {
      phaseOffset: 'Coupled Phase Synchronization 1.618',
      topologyType: 'Interlinked Genus-2 Bitorus',
      coordinateFrame: 'Dual Cylindrical Bipolar',
      harmonicRatio: 'Φ Golden Ratio Modulation'
    }
  },

  // --- Category: Octagonal Grids ---
  {
    id: 'octa-matrix',
    categoryId: 'octagonal-grids',
    title: '8-Fold Sacred Dimensional Matrix',
    subtitle: 'Radial polar lattice with octagonal coordinate rings',
    description: 'An 8-fold isometric grid coordinate system based on 45-degree angle increments, intersecting concentric rings, and dynamically pulsing nodal intersection hubs.',
    formula: 'r_k(θ) = R_k / cos(θ - k·π/4),  k ∈ {0, 1, 2, ..., 7}',
    formulaDescription: 'Regular octagonal polar isocurves with dynamic spatial resonance nodes.',
    defaultParams: {
      rotationSpeed: 0.4,
      gridDensity: 40,
      loopFrequency: 1.0,
      particleCount: 3000,
      waveAmplitude: 0.6,
      zoom: 19,
      renderMode: 'wireframe',
      colorTheme: 'emerald'
    },
    metrics: {
      phaseOffset: 'D8 Dihedral Symmetry (45° sectors)',
      topologyType: 'Planar Tessellation Matrix',
      coordinateFrame: 'Polar-Octagonal (r, 8θ)',
      harmonicRatio: '1 : √2 Octagonal Modulus'
    }
  },
  {
    id: 'hyperbolic-octa',
    categoryId: 'octagonal-grids',
    title: 'Hyperbolic Octa-Lattice',
    subtitle: 'Multi-layered nested octagons on alternate harmonic axes',
    description: 'Nested concentric octagons suspended in 3D space that rotate with alternating differential velocity, creating a dynamic kaleidoscopic coordinate corridor.',
    formula: 'z_n = h·n,  r_n(t) = r_base · (1 + 0.2·sin(ω·t + n·π/8)),  rot_n = (-1)ⁿ · Ω·t',
    formulaDescription: 'Axial-stacked geometric progression with alternating chirality rotation.',
    defaultParams: {
      rotationSpeed: 0.7,
      gridDensity: 32,
      loopFrequency: 1.6,
      particleCount: 4500,
      waveAmplitude: 0.9,
      zoom: 22,
      renderMode: 'holographic',
      colorTheme: 'emerald'
    },
    metrics: {
      phaseOffset: 'Alternating Chirality [CW / CCW]',
      topologyType: 'Volumetric Extruded Octatope',
      coordinateFrame: 'Cylindrical-Octagonal (r, θ, z)',
      harmonicRatio: '8-Phase Wave Transmission'
    }
  },
  {
    id: 'stereographic-net',
    categoryId: 'octagonal-grids',
    title: 'Stereographic Coordinate Net',
    subtitle: 'Spherical-to-planar octagonal conformal projection',
    description: 'A conformal stereographic projection of an 8-segmented Riemann sphere onto a 3D coordinate floor, preserving angles while dynamically projecting coordinate grid tangents.',
    formula: 'X = 2x / (1 - z),  Y = 2y / (1 - z),  where x² + y² + z² = 1',
    formulaDescription: 'Conformal mapping from S² unit sphere to ℝ² plane with octagonal geodesic divisions.',
    defaultParams: {
      rotationSpeed: 0.5,
      gridDensity: 48,
      loopFrequency: 1.2,
      particleCount: 5200,
      waveAmplitude: 0.4,
      zoom: 24,
      renderMode: 'hybrid',
      colorTheme: 'emerald'
    },
    metrics: {
      phaseOffset: 'Conformal Angle Preservation',
      topologyType: 'S² → ℝ² Riemann Sphere Map',
      coordinateFrame: 'Stereographic Projective',
      harmonicRatio: '8 Meridian Ribs & 8 Latitudes'
    }
  },
  {
    id: 'nodal-flux-resonator',
    categoryId: 'octagonal-grids',
    title: 'Nodal Flux Resonator',
    subtitle: 'Dynamic proximity laser web & vector field currents',
    description: 'Eight primary generator nodes arrayed in an octagonal ring with dynamic secondary flux particles that bridge and laser-link according to proximity thresholds.',
    formula: 'E_ij = k / ||p_i - p_j||² · exp(-||p_i - p_j|| / λ)',
    formulaDescription: 'Yukawa-screened potential connectivity matrix over 8-pole resonant constellation.',
    defaultParams: {
      rotationSpeed: 0.85,
      gridDensity: 24,
      loopFrequency: 2.2,
      particleCount: 6000,
      waveAmplitude: 1.1,
      zoom: 21,
      renderMode: 'particles',
      colorTheme: 'emerald'
    },
    metrics: {
      phaseOffset: 'Dynamic Delaunay Proximity Graph',
      topologyType: 'Dynamic Complete Octa-Graph K8',
      coordinateFrame: 'Nodal Barycentric Matrix',
      harmonicRatio: '28 Interconnecting Flux Lines'
    }
  },

  // --- Category: 3D WebGL Canvas ---
  {
    id: 'coordinate-gimbal',
    categoryId: '3d-webgl',
    title: 'Multi-Axis Coordinate Gimbal',
    subtitle: 'Precision XYZ + UVW 3-axis Euler gimbal frame',
    description: 'Interactive 3D Euclidean frame featuring precision coordinate axes (Red-X, Green-Y, Blue-Z), nested gimbal rotational rings, live Euler angle protractors, and dynamic tangent-normal-binormal (TNB) vectors.',
    formula: 'R = R_z(γ) · R_y(β) · R_x(α),  q = [cos(θ/2), v·sin(θ/2)]',
    formulaDescription: 'Tait-Bryan Euler rotation matrix composition with unit quaternion vector interpolation.',
    defaultParams: {
      rotationSpeed: 0.5,
      gridDensity: 20,
      loopFrequency: 1.0,
      particleCount: 2800,
      waveAmplitude: 0.3,
      zoom: 16,
      renderMode: 'wireframe',
      colorTheme: 'titanium'
    },
    metrics: {
      phaseOffset: 'SO(3) Special Orthogonal Group',
      topologyType: '3-Axis Gimbal Manifold',
      coordinateFrame: 'Right-Handed Euclidean ℝ³',
      harmonicRatio: 'XYZ Orthogonality 90.000°'
    }
  },
  {
    id: 'tesseract-slicer',
    categoryId: '3d-webgl',
    title: '4D Tesseract Hypercube',
    subtitle: 'Rotational 4D-to-3D hypercube projection slicer',
    description: 'A four-dimensional hypercube (8-cell / tesseract) rotating simultaneously in the XW and YZ planes, rendered via perspective projection into 3D space with 16 vertices and 32 edges.',
    formula: 'x₃_i = x₄_i / (d - w_i),  for i ∈ {x, y, z}',
    formulaDescription: '4D rotation matrix SO(4) projected stereographically into Euclidean 3D space.',
    defaultParams: {
      rotationSpeed: 0.75,
      gridDensity: 16,
      loopFrequency: 1.4,
      particleCount: 3200,
      waveAmplitude: 0.7,
      zoom: 18,
      renderMode: 'holographic',
      colorTheme: 'violet'
    },
    metrics: {
      phaseOffset: 'Double Rotation in SO(4) [XW + YZ]',
      topologyType: '4D Regular Polychoron (16 Vertices)',
      coordinateFrame: 'Hyper-Euclidean ℝ⁴ → ℝ³',
      harmonicRatio: '32 Edge Tensor Links'
    }
  },
  {
    id: 'vector-field-divergence',
    categoryId: '3d-webgl',
    title: 'Vector Field Curl & Divergence',
    subtitle: 'Dynamic 3D vector arrows & stream velocity field',
    description: 'A 3D mathematical vector field illustrating curl and divergence around multiple vortex poles, with glowing velocity arrows and streamline trace particles.',
    formula: 'V(x,y,z) = [-y/(x²+y²+1), x/(x²+y²+1), sin(z)·cos(√(x²+y²))]',
    formulaDescription: 'Continuous Navier-Stokes inspired vortex field with non-zero curl: ∇ × V ≠ 0.',
    defaultParams: {
      rotationSpeed: 0.6,
      gridDensity: 28,
      loopFrequency: 1.8,
      particleCount: 7000,
      waveAmplitude: 1.0,
      zoom: 22,
      renderMode: 'particles',
      colorTheme: 'violet'
    },
    metrics: {
      phaseOffset: 'Helmholtz-Hodge Decomposition',
      topologyType: '3D Vector Potential Tensor',
      coordinateFrame: 'Differential Vector Stream ℝ³',
      harmonicRatio: '∇·V Divergence Flux Balanced'
    }
  },
  {
    id: 'precision-cad-plane',
    categoryId: '3d-webgl',
    title: 'Precision CAD Spatial Plane',
    subtitle: 'Datum points, bounding extents & sub-millimeter ticks',
    description: 'Industrial 3D design coordinate plane equipped with sub-graduated metric grids, spatial datum crosshairs, dynamic coordinate dimension callouts, and snap-plane guides.',
    formula: 'G(u,v) = ∑ [δ(u - k·Δ) + δ(v - m·Δ)] · (1 + 0.5·rect(k,m))',
    formulaDescription: 'Orthogonal metric coordinate grid with major and minor sub-millimeter tick arrays.',
    defaultParams: {
      rotationSpeed: 0.3,
      gridDensity: 50,
      loopFrequency: 0.8,
      particleCount: 2200,
      waveAmplitude: 0.2,
      zoom: 17,
      renderMode: 'wireframe',
      colorTheme: 'titanium'
    },
    metrics: {
      phaseOffset: 'ISO 10303 STEP Coordinate Standard',
      topologyType: 'Euclidean Datum Reference Frame',
      coordinateFrame: 'Cartesian Metric (X, Y, Z, Origin at 0,0,0)',
      harmonicRatio: 'Major / Minor Ratio 10 : 1'
    }
  },

  // --- Category: Holographic UI ---
  {
    id: 'volumetric-hud',
    categoryId: 'holographic-ui',
    title: 'Volumetric Spatial HUD',
    subtitle: 'Floating holographic reticles, dial gauges & sonic rings',
    description: 'Sci-fi inspired spatial interface containing concentric rotating HUD reticles, cylindrical data cylinders, live targeting brackets, and pulsating acoustic wave rings.',
    formula: 'R_ring(θ, t) = R_base · [1 + 0.15·sin(m·θ - ω·t)] · [1 + 0.1·cos(n·θ + 2ω·t)]',
    formulaDescription: 'Multi-frequency circular harmonic waveform with counter-rotating targeting crosshairs.',
    defaultParams: {
      rotationSpeed: 0.9,
      gridDensity: 32,
      loopFrequency: 2.0,
      particleCount: 4800,
      waveAmplitude: 0.8,
      zoom: 19,
      renderMode: 'holographic',
      colorTheme: 'amber'
    },
    metrics: {
      phaseOffset: 'Triple Concentric HUD Gimbal Rings',
      topologyType: 'Projected Volumetric Cylinder',
      coordinateFrame: 'Spatial Spherical Holographic (r, θ, φ)',
      harmonicRatio: '360° Circular Reticle Index'
    }
  },
  {
    id: 'quantum-constellation',
    categoryId: 'holographic-ui',
    title: 'Quantum Node Constellation',
    subtitle: 'Floating 3D holographic neural telemetry network',
    description: 'A 3D spatial network of holographic data beacons interconnected by luminous telemetry arcs, with data packets flowing along gravitational geodesics.',
    formula: 'P_k(t) = P_0k + A·[sin(ω_k·t), cos(ω_k·t), sin(2ω_k·t + φ_k)]',
    formulaDescription: 'Stochastic harmonic orbital nodes with dynamic nearest-neighbor bezier spline links.',
    defaultParams: {
      rotationSpeed: 0.7,
      gridDensity: 24,
      loopFrequency: 1.5,
      particleCount: 5500,
      waveAmplitude: 1.1,
      zoom: 23,
      renderMode: 'particles',
      colorTheme: 'amber'
    },
    metrics: {
      phaseOffset: '64 Holographic Node Beacons',
      topologyType: 'Spatial Telemetry Mesh',
      coordinateFrame: 'Barycentric Graph Embedding',
      harmonicRatio: '128 Synaptic Laser Data Links'
    }
  },
  {
    id: 'cyber-depth-scanner',
    categoryId: 'holographic-ui',
    title: 'Cybernetic Depth Scanner',
    subtitle: 'Laser sweep grid & 3D topographic point cloud',
    description: 'A high-frequency green/amber laser scanning plane slicing through a dynamic 3D topographic terrain, generating elevation contour slices and spatial coordinates in real time.',
    formula: 'Z(x,y,t) = A·sin(k_x·x + ω·t)·cos(k_y·y + ω·t) + B·sin(2k_x·x - 3k_y·y)',
    formulaDescription: '2D spatial Fourier surface sliced by traveling vertical laser plane z = Z_scan(t).',
    defaultParams: {
      rotationSpeed: 0.5,
      gridDensity: 44,
      loopFrequency: 1.3,
      particleCount: 8000,
      waveAmplitude: 1.4,
      zoom: 25,
      renderMode: 'hybrid',
      colorTheme: 'amber'
    },
    metrics: {
      phaseOffset: 'Traveling LiDAR Laser Intercept Plane',
      topologyType: 'Parametric 3D Topographic Mesh',
      coordinateFrame: 'Elevation Contour Slicing (X, Y, Z)',
      harmonicRatio: 'Scan Rate 60 Hz Synchronized'
    }
  },
  {
    id: 'orbital-console',
    categoryId: 'holographic-ui',
    title: 'Cylindrical Orbital Console',
    subtitle: '360° curved holographic flight telemetry display',
    description: 'A 360-degree curved volumetric holographic console featuring curved digital monitors, live frequency oscilloscopes, artificial horizon pitch ladders, and spatial vector gauges.',
    formula: 'C(θ, z) = [R·cos(θ), R·sin(θ), z],  θ ∈ [-3π/4, 3π/4],  z ∈ [-H/2, H/2]',
    formulaDescription: 'Cylindrical holographic projection manifold with embedded 2D telemetry vector widgets.',
    defaultParams: {
      rotationSpeed: 0.4,
      gridDensity: 36,
      loopFrequency: 1.0,
      particleCount: 4000,
      waveAmplitude: 0.5,
      zoom: 20,
      renderMode: 'holographic',
      colorTheme: 'amber'
    },
    metrics: {
      phaseOffset: '270° Panoramic Field of View',
      topologyType: 'Curved Volumetric HUD Screen',
      coordinateFrame: 'Cylindrical Console Frame',
      harmonicRatio: '16 Live Telemetry Gauges'
    }
  },

  // --- Category: Cyber Dragon (Dragon9 Nexus) ---
  {
    id: 'cyber-dragon-visage',
    categoryId: 'cyber-dragon',
    title: 'Dragon9 Cybernetic Visage',
    subtitle: 'Biomechanical face, faceted titanium armor plates & glowing ocular sensor visor',
    description: 'A full 3D cyber-dragon head constructed with precision low-poly titanium jawplates, faceted cranial crests, dual illuminated optic sensor arrays, and kinetic breathing exhaust ports that sync with the Dragon9 temporal cycle.',
    formula: 'S(u, v, t) = CranialMesh(u,v) + BiomechArmor(u,v) · [1 + 0.15·sin(ω_D9·t)]',
    formulaDescription: 'Parametric cranial topology with kinematic mandibular displacement and synchronized 54-minute harmonic pulse.',
    defaultParams: {
      rotationSpeed: 0.7,
      gridDensity: 32,
      loopFrequency: 1.5,
      particleCount: 5000,
      waveAmplitude: 0.9,
      zoom: 20,
      renderMode: 'hybrid',
      colorTheme: 'cyan'
    },
    metrics: {
      phaseOffset: 'Dragon9 54-Minute Phase Lock',
      topologyType: 'Biomechanical Cranial Manifold',
      coordinateFrame: 'Cephalic Euler Matrix (Yaw, Pitch, Roll)',
      harmonicRatio: '9-Phase Synchronized Nexus'
    }
  },
  {
    id: 'dragon-spiral-horns',
    categoryId: 'cyber-dragon',
    title: 'Logarithmic Dragon Horn Spiral',
    subtitle: 'Dual Golden-Ratio bio-crystalline horns with energy nodes',
    description: 'Symmetric curved horns following logarithmic 3D spirals with golden-ratio taper, ribbed energy rings, and hyper-dense particle sparks coursing down the spine.',
    formula: 'r(θ) = a·e^(b·θ),  x = r·cos(θ), y = r·sin(θ), z = c·θ^1.2',
    formulaDescription: '3D logarithmic horn manifold with Fibonacci-spaced nodal energy emitters.',
    defaultParams: {
      rotationSpeed: 0.8,
      gridDensity: 28,
      loopFrequency: 2.0,
      particleCount: 4500,
      waveAmplitude: 0.8,
      zoom: 18,
      renderMode: 'wireframe',
      colorTheme: 'amber'
    },
    metrics: {
      phaseOffset: 'Fibonacci Logarithmic Helices',
      topologyType: 'Bilateral Tapered Conical Horns',
      coordinateFrame: 'Helical Cylindrical (r, θ, z)',
      harmonicRatio: 'Φ Golden Ratio Scale 1.618'
    }
  },
  {
    id: 'dragon-whisker-lemniscate',
    categoryId: 'cyber-dragon',
    title: 'Fluid Whisker Lemniscate Streams',
    subtitle: 'Dynamic undulating whisker ribbons with two-phase temporal flow',
    description: 'Twin flowing sensory dragon whiskers extending from the muzzle, generating continuous harmonic Bernoulli ribbon waves that undulate in real-time with kinetic particle trails.',
    formula: 'W(s, t) = MuzzleAnchor + [A·s·cos(ω·t - k·s), B·s·sin(ω·t - k·s), C·s^1.5·sin(2ω·t)]',
    formulaDescription: 'Propagating traveling wave whiskers with non-linear damping and spatial turbulence.',
    defaultParams: {
      rotationSpeed: 0.9,
      gridDensity: 36,
      loopFrequency: 2.4,
      particleCount: 6200,
      waveAmplitude: 1.3,
      zoom: 22,
      renderMode: 'particles',
      colorTheme: 'violet'
    },
    metrics: {
      phaseOffset: 'Bernoulli Dual-Stream Whiskers',
      topologyType: 'Continuous Frenet-Serret Ribbon',
      coordinateFrame: 'Muzzle Relative Tangent Frame',
      harmonicRatio: '2-Phase Fluid Wave Propagation'
    }
  },
  {
    id: 'dragon-ocular-core',
    categoryId: 'cyber-dragon',
    title: 'Mecha Ocular Core & HUD Visor',
    subtitle: 'Concentric cybernetic eye lenses with scanning laser targeting reticles',
    description: 'Close-up volumetric spatial focal core of the dragon\'s cybernetic optical sensory apparatus, complete with iris shutter blades, laser rangefinder cones, and orbital telemetry rings.',
    formula: 'Iris(r, θ, t) = R_iris(t) · [cos(6θ + φ(t)), sin(6θ + φ(t)), 0] ⊗ LaserReticle(t)',
    formulaDescription: 'Hexagonal aperture blade kinematics with 108Hz phase-locked laser scanning telemetry.',
    defaultParams: {
      rotationSpeed: 0.5,
      gridDensity: 40,
      loopFrequency: 1.2,
      particleCount: 4200,
      waveAmplitude: 0.6,
      zoom: 16,
      renderMode: 'holographic',
      colorTheme: 'emerald'
    },
    metrics: {
      phaseOffset: 'Hexagonal Shutter Telemetry',
      topologyType: 'Volumetric Ocular Lens Array',
      coordinateFrame: 'Polar Reticle Coordinate System',
      harmonicRatio: '108Hz Optical Scanner Lock'
    }
  }
];

export const COLOR_THEMES: Record<string, {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glow: string;
  threeColors: {
    primary: number;
    secondary: number;
    accent: number;
    ambient: number;
  };
}> = {
  cyan: {
    id: 'cyan',
    name: 'Quantum Cyan',
    primary: '#00f3ff',
    secondary: '#0066ff',
    accent: '#38bdf8',
    background: '#040b17',
    glow: 'rgba(0, 243, 255, 0.4)',
    threeColors: {
      primary: 0x00f3ff,
      secondary: 0x0066ff,
      accent: 0x38bdf8,
      ambient: 0x021024
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Neural Emerald',
    primary: '#00ff88',
    secondary: '#059669',
    accent: '#a3e635',
    background: '#02120b',
    glow: 'rgba(0, 255, 136, 0.4)',
    threeColors: {
      primary: 0x00ff88,
      secondary: 0x10b981,
      accent: 0xa3e635,
      ambient: 0x02170e
    }
  },
  amber: {
    id: 'amber',
    name: 'Solar Plasma',
    primary: '#ffaa00',
    secondary: '#ff3366',
    accent: '#fbbf24',
    background: '#140803',
    glow: 'rgba(255, 170, 0, 0.4)',
    threeColors: {
      primary: 0xffaa00,
      secondary: 0xff3366,
      accent: 0xfbbf24,
      ambient: 0x1c0c04
    }
  },
  violet: {
    id: 'violet',
    name: 'Amethyst Void',
    primary: '#c084fc',
    secondary: '#6366f1',
    accent: '#ec4899',
    background: '#0f051d',
    glow: 'rgba(192, 132, 252, 0.4)',
    threeColors: {
      primary: 0xc084fc,
      secondary: 0x818cf8,
      accent: 0xec4899,
      ambient: 0x130724
    }
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Pure',
    primary: '#ffffff',
    secondary: '#94a3b8',
    accent: '#38bdf8',
    background: '#07090e',
    glow: 'rgba(255, 255, 255, 0.4)',
    threeColors: {
      primary: 0xffffff,
      secondary: 0x94a3b8,
      accent: 0x38bdf8,
      ambient: 0x0c0f17
    }
  }
};
