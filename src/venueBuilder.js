import * as THREE from 'three';
import { MATERIALS } from './materials.js';

// Define exact boundary coordinates for the 4 Monitored Zones
export const ZONE_BOUNDS = {
  ZONE_A: { minX: -24, maxX: -11, minZ: -16, maxZ: -2, name: 'Zone A - Platform 1 North', center: [-17.5, 0, -9] },
  ZONE_B: { minX: -9, maxX: +4, minZ: -16, maxZ: -2, name: 'Zone B - Main Ticket Concourse', center: [-2.5, 0, -9] },
  ZONE_C: { minX: -24, maxX: -11, minZ: +1, maxZ: +16, name: 'Zone C - West Corridor', center: [-17.5, 0, 8.5] },
  ZONE_D: { minX: -9, maxX: +4, minZ: +1, maxZ: +16, name: 'Zone D - Main Exit Bottleneck', center: [-2.5, 0, 8.5] }
};

// Helper to create 3D Floating Canvas Badge Sprites
function createBadgeSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Badge background rounded rectangle
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 16);
  ctx.fill();
  ctx.stroke();

  // Badge text
  ctx.fillStyle = colorHex;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(6.5, 1.6, 1.0);
  return sprite;
}

export function buildPublicVenue(scene) {
  const venueGroup = new THREE.Group();
  venueGroup.name = 'PUBLIC_VENUE';

  // 1. MAIN CONCOURSE FLOOR
  const floorGeo = new THREE.PlaneGeometry(32, 36);
  const floorMesh = new THREE.Mesh(floorGeo, MATERIALS.floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(-10, 0, 0);
  floorMesh.receiveShadow = true;
  venueGroup.add(floorMesh);

  // Platform Track Trench (North Edge)
  const trackFloor = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 4), MATERIALS.asphalt);
  trackFloor.position.set(-10, -0.2, -18);
  trackFloor.receiveShadow = true;
  venueGroup.add(trackFloor);

  // Train Rails
  for (let zOffset of [-19, -17]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(32, 0.15, 0.1), MATERIALS.stainlessMetal);
    rail.position.set(-10, 0.08, zOffset);
    venueGroup.add(rail);
  }

  // Train Coach Body (Platform 1)
  const trainBody = new THREE.Mesh(new THREE.BoxGeometry(26, 3.2, 2.8), MATERIALS.darkSteel);
  trainBody.position.set(-11, 1.6, -18.5);
  trainBody.castShadow = true;
  venueGroup.add(trainBody);

  // Train Windows
  for (let x = -22; x <= 0; x += 4) {
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.05), MATERIALS.glass);
    windowMesh.position.set(x, 2.0, -17.05);
    venueGroup.add(windowMesh);
  }

  // Warning Tactile Safety Stripes along Platform Edge
  const stripeMesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 0.8), MATERIALS.warningStripe);
  stripeMesh.rotation.x = -Math.PI / 2;
  stripeMesh.position.set(-10, 0.01, -15.6);
  venueGroup.add(stripeMesh);

  // 2. ZONE BOUNDARY FLOOR MARKERS & 3D FLOATING BADGES
  buildZoneBoundaries(venueGroup);

  // 3. ARCHITECTURAL COLUMNS & OVERHEAD BEAMS
  buildStationArchitecture(venueGroup);

  // 4. FURNITURE, TICKET COUNTERS, TURNSTILES & BENCHES
  buildStationEquipment(venueGroup);

  // 5. DATA COLLECTION HARDWARE (CCTV & IR PEOPLE COUNTERS)
  buildSensorsAndCCTV(venueGroup);

  scene.add(venueGroup);
  return venueGroup;
}

// Architectural dividers between monitored zones + 3D floating badges
function buildZoneBoundaries(group) {
  const zoneConfigs = [
    { id: 'ZONE_A', bounds: ZONE_BOUNDS.ZONE_A, label: 'ZONE A · NORMAL', color: '#10b981', lineMat: MATERIALS.zoneA_Line, overlayMat: MATERIALS.zoneA_Overlay },
    { id: 'ZONE_B', bounds: ZONE_BOUNDS.ZONE_B, label: 'ZONE B · HIGH', color: '#f59e0b', lineMat: MATERIALS.zoneB_Line, overlayMat: MATERIALS.zoneB_Overlay },
    { id: 'ZONE_C', bounds: ZONE_BOUNDS.ZONE_C, label: 'ZONE C · NORMAL', color: '#10b981', lineMat: MATERIALS.zoneC_Line, overlayMat: MATERIALS.zoneC_Overlay },
    { id: 'ZONE_D', bounds: ZONE_BOUNDS.ZONE_D, label: 'ZONE D · CRITICAL', color: '#ef4444', lineMat: MATERIALS.zoneD_Line, overlayMat: MATERIALS.zoneD_Overlay }
  ];

  zoneConfigs.forEach(cfg => {
    const b = cfg.bounds;
    const w = b.maxX - b.minX;
    const d = b.maxZ - b.minZ;
    const cx = (b.minX + b.maxX) / 2;
    const cz = (b.minZ + b.maxZ) / 2;

    // Zone floor patch
    const patchGeo = new THREE.PlaneGeometry(w, d);
    const patchMesh = new THREE.Mesh(patchGeo, cfg.overlayMat);
    patchMesh.rotation.x = -Math.PI / 2;
    patchMesh.position.set(cx, 0.02, cz);
    patchMesh.name = `ZONE_OVERLAY_${cfg.id}`;
    patchMesh.userData = { isZone: true, zoneId: cfg.id };
    group.add(patchMesh);

    // Border line box around zone floor
    const edgesGeo = new THREE.EdgesGeometry(patchGeo);
    const lineMesh = new THREE.LineSegments(edgesGeo, cfg.lineMat);
    lineMesh.rotation.x = -Math.PI / 2;
    lineMesh.position.set(cx, 0.03, cz);
    group.add(lineMesh);

    // 3D Floating Badge Sprite
    const badge = createBadgeSprite(cfg.label, cfg.color);
    badge.position.set(cx, 4.2, cz);
    badge.name = `BADGE_${cfg.id}`;
    badge.userData = { isZone: true, zoneId: cfg.id };
    group.add(badge);
  });

  // Physical Crowd Barriers & Railings
  for (let x = -24; x <= 2; x += 3) {
    if (x >= -13 && x <= -10) continue; // Passage gap between North and South concourse
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1), MATERIALS.stainlessMetal);
    post.position.set(x, 0.55, 0);
    group.add(post);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3), MATERIALS.stainlessMetal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(x + 1.5, 0.8, 0);
    group.add(bar);
  }
}

// Columns & Beams (Clean Brushed Steel)
function buildStationArchitecture(group) {
  const columnPositions = [
    [-22, -12], [-12, -12], [-2, -12],
    [-22, 0],   [-12, 0],   [-2, 0],
    [-22, 14],  [-12, 14],  [-2, 14]
  ];

  columnPositions.forEach(([x, z]) => {
    // Square concrete column base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), MATERIALS.darkConcrete);
    base.position.set(x, 0.2, z);
    group.add(base);

    // Steel main pillar
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.5, 8), MATERIALS.steelBeam);
    col.position.set(x, 3.0, z);
    col.castShadow = true;
    group.add(col);
  });

  // Overhead Beams
  for (let z of [-12, 0, 14]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 0.35), MATERIALS.steelBeam);
    beam.position.set(-12, 5.6, z);
    group.add(beam);
  }

  // Escalators / Stairs in Zone C
  const stairGeo = new THREE.BoxGeometry(4, 3, 6);
  const stairMesh = new THREE.Mesh(stairGeo, MATERIALS.darkConcrete);
  stairMesh.position.set(-22, 1.5, 8);
  stairMesh.rotation.y = Math.PI / 2;
  group.add(stairMesh);

  // Stair Railings
  const railMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 6.2), MATERIALS.stainlessMetal);
  railMesh.position.set(-20.2, 3.2, 8);
  group.add(railMesh);
}

// Ticket Counters, Turnstiles (Zone D Bottleneck), Benches
function buildStationEquipment(group) {
  // 1. TICKET COUNTERS (Zone B)
  const counterBody = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.2, 1.5), MATERIALS.darkConcrete);
  counterBody.position.set(-4, 0.6, -13);
  counterBody.castShadow = true;
  group.add(counterBody);

  const counterGlass = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.0, 0.1), MATERIALS.glass);
  counterGlass.position.set(-4, 1.7, -13);
  group.add(counterGlass);

  // 2. TURNSTILE EXIT GATES (Zone D Bottleneck)
  for (let x = -4; x <= 2; x += 1.8) {
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 1.4), MATERIALS.stainlessMetal);
    gate.position.set(x, 0.55, 15);
    gate.castShadow = true;
    gate.userData = { isInteractive: true, name: 'Turnstile Exit Gate' };
    group.add(gate);

    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7), MATERIALS.stainlessMetal);
    bar.rotation.x = Math.PI / 3;
    bar.position.set(x, 0.8, 15.6);
    group.add(bar);

    const ledMat = (x === -0.4) ? MATERIALS.ledRed : MATERIALS.ledGreen;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), ledMat);
    led.position.set(x, 1.15, 15);
    group.add(led);
  }

  // 3. PASSENGER BENCHES (Zone A & Zone C)
  [[-18, -6], [-18, 4], [-6, -4]].forEach(([x, z]) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 0.6), MATERIALS.darkConcrete);
    bench.position.set(x, 0.22, z);
    bench.castShadow = true;
    group.add(bench);
  });
}

// Monitoring Devices: CCTV Cameras & IR People Counters
function buildSensorsAndCCTV(group) {
  const sensorLocations = [
    { id: 'CCTV_ZONE_A', pos: [-22, 4.2, -12], zone: 'ZONE_A', type: 'CCTV Camera 01' },
    { id: 'CCTV_ZONE_B', pos: [-2, 4.2, -12], zone: 'ZONE_B', type: 'CCTV Camera 02' },
    { id: 'CCTV_ZONE_C', pos: [-22, 4.2, 14], zone: 'ZONE_C', type: 'CCTV Camera 03' },
    { id: 'CCTV_ZONE_D', pos: [-2, 4.2, 14], zone: 'ZONE_D', type: 'CCTV Camera 04 (Bottleneck Monitor)' },
    { id: 'IR_COUNTER_EXIT', pos: [-1, 2.8, 15], zone: 'ZONE_D', type: 'Infrared People Counter Beam' }
  ];

  sensorLocations.forEach(s => {
    const cameraGroup = new THREE.Group();
    cameraGroup.position.set(...s.pos);
    cameraGroup.name = s.id;
    cameraGroup.userData = { isSensor: true, ...s };

    const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), MATERIALS.stainlessMetal);
    mount.rotation.z = Math.PI / 4;
    cameraGroup.add(mount);

    const camBody = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.2), MATERIALS.darkSteel);
    camBody.position.set(0.4, -0.4, 0);
    camBody.rotation.y = Math.PI / 4;
    camBody.castShadow = true;
    cameraGroup.add(camBody);

    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1), MATERIALS.stainlessMetal);
    lens.rotation.z = Math.PI / 2;
    lens.position.set(0.55, -0.4, 0.15);
    cameraGroup.add(lens);

    const ledMat = s.zone === 'ZONE_D' ? MATERIALS.ledRed : MATERIALS.ledGreen;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), ledMat);
    led.position.set(0.35, -0.3, 0.1);
    cameraGroup.add(led);

    group.add(cameraGroup);
  });
}
