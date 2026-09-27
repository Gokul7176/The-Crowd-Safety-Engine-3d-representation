import * as THREE from 'three';
import { MATERIALS } from './materials.js';

// Helper to create 3D Floating Canvas Badge Sprites
function createBadgeSprite(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 16);
  ctx.fill();
  ctx.stroke();

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

export function buildBigDataPipeline(scene) {
  const pipelineGroup = new THREE.Group();
  pipelineGroup.name = 'BIG_DATA_PIPELINE';

  // Ground Tech Pad Foundation
  const padGeo = new THREE.PlaneGeometry(16, 36);
  const padMesh = new THREE.Mesh(padGeo, MATERIALS.techPad);
  padMesh.rotation.x = -Math.PI / 2;
  padMesh.position.set(17, 0.01, 0);
  padMesh.receiveShadow = true;
  pipelineGroup.add(padMesh);

  // 1. HDFS SERVER ROOM BUILDING (Storage Zone)
  buildHDFSNode(pipelineGroup);

  // 2. MAPREDUCE AGGREGATION NODE (Batch Analytics Zone)
  buildMapReduceNode(pipelineGroup);

  // 3. STREAM PROCESSING ENGINE NODE (Real-Time Windowing Zone)
  buildStreamNode(pipelineGroup);

  // 4. OPERATIONS CONTROL ROOM (Dashboard & Operator Response)
  buildControlRoomNode(pipelineGroup);

  // 5. INTER-NODE DATA FLOW PIPELINE CONDUITS & CABLES
  buildPipelineConduits(pipelineGroup);

  scene.add(pipelineGroup);
  return pipelineGroup;
}

// 1. HDFS Server Room (Realistic Data Center Facility)
function buildHDFSNode(group) {
  const hdfsGroup = new THREE.Group();
  hdfsGroup.position.set(17, 0, -11);
  hdfsGroup.name = 'HDFS_NODE';
  hdfsGroup.userData = { isPipelineNode: true, nodeId: 'HDFS' };

  // Building Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.3, 9.0), MATERIALS.darkConcrete);
  base.position.set(0, 0.15, 0);
  base.receiveShadow = true;
  hdfsGroup.add(base);

  // Glass Wall Enclosure
  const glassWall1 = new THREE.Mesh(new THREE.BoxGeometry(8.8, 3.2, 0.1), MATERIALS.glass);
  glassWall1.position.set(0, 1.75, 4.4);
  hdfsGroup.add(glassWall1);

  const glassWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 8.8), MATERIALS.glass);
  glassWall2.position.set(-4.4, 1.75, 0);
  hdfsGroup.add(glassWall2);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.3, 9.2), MATERIALS.darkSteel);
  roof.position.set(0, 3.5, 0);
  hdfsGroup.add(roof);

  // Server Racks Array inside Server Room
  for (let x of [-2.4, 0, 2.4]) {
    for (let z of [-2.0, 1.0]) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 1.0), MATERIALS.serverCase);
      rack.position.set(x, 1.6, z);
      rack.castShadow = true;
      hdfsGroup.add(rack);

      const rackFront = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.5), MATERIALS.serverRackFront);
      rackFront.position.set(x, 1.6, z + 0.51);
      hdfsGroup.add(rackFront);
    }
  }

  // Display Monitor Screen for Historical Log Preview
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.45), MATERIALS.screenHDFS);
  screen.position.set(0, 2.2, 4.46);
  hdfsGroup.add(screen);

  // 3D Floating Badge
  const badge = createBadgeSprite('💾 HDFS STORAGE', '#10b981');
  badge.position.set(0, 4.8, 0);
  hdfsGroup.add(badge);

  group.add(hdfsGroup);
}

// 2. MapReduce Aggregation Processing Unit
function buildMapReduceNode(group) {
  const mrGroup = new THREE.Group();
  mrGroup.position.set(17, 0, 0);
  mrGroup.name = 'MAPREDUCE_NODE';
  mrGroup.userData = { isPipelineNode: true, nodeId: 'MAPREDUCE' };

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.3, 9.0), MATERIALS.darkConcrete);
  base.position.set(0, 0.15, 0);
  base.receiveShadow = true;
  mrGroup.add(base);

  // Compute Blade Modules
  const nodeNames = ['MAP WORKER 1', 'MAP WORKER 2', 'SHUFFLE & REDUCE'];
  nodeNames.forEach((name, idx) => {
    const x = -2.6 + idx * 2.6;
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 2.8), MATERIALS.steelBeam);
    cabinet.position.set(x, 1.4, 0);
    cabinet.castShadow = true;
    mrGroup.add(cabinet);

    const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), MATERIALS.ledBlue);
    led.position.set(x, 2.4, 1.3);
    mrGroup.add(led);
  });

  // Central MapReduce Interactive Monitor Screen
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.8), MATERIALS.screenMapReduce);
  screen.position.set(0, 2.2, 4.46);
  mrGroup.add(screen);

  // Roof Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.3, 9.2), MATERIALS.steelBeam);
  frame.position.set(0, 3.5, 0);
  mrGroup.add(frame);

  // 3D Floating Badge
  const badge = createBadgeSprite('⚙️ MAPREDUCE AGGREGATOR', '#38bdf8');
  badge.position.set(0, 4.8, 0);
  mrGroup.add(badge);

  group.add(mrGroup);
}

// 3. Stream Analytics Processing Engine
function buildStreamNode(group) {
  const streamGroup = new THREE.Group();
  streamGroup.position.set(17, 0, 11);
  streamGroup.name = 'STREAM_NODE';
  streamGroup.userData = { isPipelineNode: true, nodeId: 'STREAM_PROCESSING' };

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.3, 9.0), MATERIALS.darkConcrete);
  base.position.set(0, 0.15, 0);
  base.receiveShadow = true;
  streamGroup.add(base);

  // Tower Body
  const tower = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.2, 4.0), MATERIALS.darkSteel);
  tower.position.set(0, 1.75, 0);
  tower.castShadow = true;
  streamGroup.add(tower);

  // Display Panel showing Real-Time Sliding Window
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.0), MATERIALS.screenStream);
  screen.position.set(0, 2.1, 2.01);
  streamGroup.add(screen);

  // Active Stream Pulse Rings
  const ringGeo = new THREE.TorusGeometry(2.4, 0.07, 8, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  ringMesh.position.set(0, 3.6, 0);
  streamGroup.add(ringMesh);

  // 3D Floating Badge
  const badge = createBadgeSprite('⚡ STREAM ENGINE (5-MIN WINDOW)', '#f59e0b');
  badge.position.set(0, 4.8, 0);
  streamGroup.add(badge);

  group.add(streamGroup);
}

// 4. Operations Control Room & Master Dashboard
function buildControlRoomNode(group) {
  const ctrlGroup = new THREE.Group();
  ctrlGroup.position.set(-1, 0, 24);
  ctrlGroup.name = 'CONTROL_ROOM_NODE';
  ctrlGroup.userData = { isPipelineNode: true, nodeId: 'DASHBOARD' };

  // Room Floor
  const base = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.3, 8.0), MATERIALS.darkConcrete);
  base.position.set(0, 0.15, 0);
  base.receiveShadow = true;
  ctrlGroup.add(base);

  // Glass Wall
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(13.8, 3.2, 0.1), MATERIALS.tintedGlass);
  frontGlass.position.set(0, 1.75, -3.9);
  ctrlGroup.add(frontGlass);

  // Operator Console
  const desk = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.85, 1.6), MATERIALS.darkSteel);
  desk.position.set(0, 0.58, 0);
  desk.castShadow = true;
  ctrlGroup.add(desk);

  // Monitor Wall
  for (let idx of [-2.6, 0, 2.6]) {
    const mon = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.25), MATERIALS.screenControlRoom);
    mon.position.set(idx, 1.8, -3.8);
    ctrlGroup.add(mon);
  }

  // Chair
  const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 8), MATERIALS.steelBeam);
  chair.position.set(0, 0.4, 1.5);
  ctrlGroup.add(chair);

  // 3D Floating Badge
  const badge = createBadgeSprite('🖥️ OPERATIONS CONTROL ROOM', '#ef4444');
  badge.position.set(0, 4.8, 0);
  ctrlGroup.add(badge);

  group.add(ctrlGroup);
}

// 5. Pipeline Conduits & Flow Cables
function buildPipelineConduits(group) {
  const pipelinePaths = [
    [new THREE.Vector3(4, 0.2, -11), new THREE.Vector3(12, 0.2, -11)],
    [new THREE.Vector3(17, 0.2, -6.5), new THREE.Vector3(17, 0.2, -4.5)],
    [new THREE.Vector3(17, 0.2, 4.5), new THREE.Vector3(17, 0.2, 6.5)],
    [new THREE.Vector3(17, 0.2, 11), new THREE.Vector3(17, 0.2, 24), new THREE.Vector3(6, 0.2, 24)]
  ];

  pipelinePaths.forEach(pts => {
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dist = p1.distanceTo(p2);
      
      const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 8);
      const pipeMesh = new THREE.Mesh(pipeGeo, MATERIALS.darkSteel);
      
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      pipeMesh.position.copy(mid);
      pipeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
      group.add(pipeMesh);
    }
  });
}
