import * as THREE from 'three';

// Helper to generate procedural canvas textures for realism without external image assets

// 1. Concrete / Tile Floor Texture
function createFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base tile bright slate gray
  ctx.fillStyle = '#d1d5db';
  ctx.fillRect(0, 0, 512, 512);

  // Grid tile lines
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 4;
  const tileSize = 64;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Add subtle noise texture for concrete realism
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

// 2. Yellow Platform Edge Warning Tactile Stripe
function createWarningStripeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#eab308'; // Safety yellow
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = '#1e293b'; // Dark stripes
  for (let x = -64; x < 320; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x - 8, 64);
    ctx.lineTo(x - 24, 64);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Server Rack Front Texture with Blinking LED Lights
function createServerRackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 512);

  // Rack units (1U - 4U)
  for (let y = 10; y < 500; y += 36) {
    ctx.fillStyle = '#334155';
    ctx.fillRect(10, y, 236, 30);
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(10, y, 236, 30);

    // Handles
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(15, y + 10, 10, 10);
    ctx.fillRect(231, y + 10, 10, 10);

    // LED status indicators
    const leds = ['#10b981', '#3b82f6', '#10b981', '#f59e0b'];
    leds.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(35 + idx * 14, y + 15, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ventilation grills
    ctx.fillStyle = '#0f172a';
    for (let gx = 95; gx < 220; gx += 8) {
      ctx.fillRect(gx, y + 8, 4, 14);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 4. Digital Screen Texture for Control Room Monitors & Tech Nodes
function createScreenTexture(title, statusText, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext('2d');

  // Screen background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 512, 288);

  // Header bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 44);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title.toUpperCase(), 16, 30);

  // Status badge
  ctx.fillStyle = color;
  ctx.fillRect(370, 8, 126, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(statusText, 380, 27);

  // Grid line chart
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = 30; x < 480; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(x, 250);
    ctx.stroke();
  }
  for (let y = 60; y < 260; y += 40) {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(480, y);
    ctx.stroke();
  }

  // Wave line graph
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  const points = [80, 110, 95, 140, 130, 180, 210, 195, 230, 245];
  points.forEach((val, idx) => {
    const x = 30 + idx * 48;
    const y = 250 - val * 0.8;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Instantiate shared textures
export const floorTexture = createFloorTexture();
export const warningStripeTexture = createWarningStripeTexture();
export const serverRackTexture = createServerRackTexture();

// Material Palette (Realistic Architectural Standards with High Visibility)
export const MATERIALS = {
  // Floor & Concrete
  floor: new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.5,
    metalness: 0.1
  }),
  asphalt: new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.8,
    metalness: 0.1
  }),
  techPad: new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.2
  }),
  concreteWall: new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.7,
    metalness: 0.05
  }),
  darkConcrete: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.6,
    metalness: 0.2
  }),
  warningStripe: new THREE.MeshStandardMaterial({
    map: warningStripeTexture,
    roughness: 0.4,
    metalness: 0.1
  }),

  // Structural Metals & Glass (Lighter metallic grays for clarity)
  steelBeam: new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.3,
    metalness: 0.7
  }),
  stainlessMetal: new THREE.MeshStandardMaterial({
    color: 0xc0c6d0,
    roughness: 0.2,
    metalness: 0.85
  }),
  darkSteel: new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.6
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.9,
    ior: 1.5
  }),
  tintedGlass: new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    transparent: true,
    opacity: 0.65,
    roughness: 0.2,
    metalness: 0.3
  }),

  // Server Racks & Electronics
  serverRackFront: new THREE.MeshStandardMaterial({
    map: serverRackTexture,
    roughness: 0.4,
    metalness: 0.5
  }),
  serverCase: new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.6
  }),

  // Zone Status Floor Boundary Lines (Vibrant & Readable)
  zoneA_Line: new THREE.MeshBasicMaterial({ color: 0x10b981 }), // Green
  zoneB_Line: new THREE.MeshBasicMaterial({ color: 0xf59e0b }), // Amber
  zoneC_Line: new THREE.MeshBasicMaterial({ color: 0x10b981 }), // Green
  zoneD_Line: new THREE.MeshBasicMaterial({ color: 0xef4444 }), // Red

  // Zone Floor Overlays
  zoneA_Overlay: new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  zoneB_Overlay: new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
  zoneC_Overlay: new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
  zoneD_Overlay: new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),

  // Status LEDs
  ledGreen: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
  ledAmber: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
  ledRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  ledBlue: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),

  // Dynamic Monitor Screens
  screenHDFS: new THREE.MeshBasicMaterial({ map: createScreenTexture('HDFS Storage Nodes', '32 / 32 ONLINE', '#10b981') }),
  screenMapReduce: new THREE.MeshBasicMaterial({ map: createScreenTexture('MapReduce Engine', 'BATCH READY', '#38bdf8') }),
  screenStream: new THREE.MeshBasicMaterial({ map: createScreenTexture('5-Min Stream Window', 'STREAMING', '#f59e0b') }),
  screenControlRoom: new THREE.MeshBasicMaterial({ map: createScreenTexture('Zone D Bottleneck', 'ALERT: CRITICAL', '#ef4444') })
};
