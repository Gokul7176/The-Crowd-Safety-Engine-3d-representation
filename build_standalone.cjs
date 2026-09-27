const fs = require('fs');
const path = require('path');

// 1. Read Three.js engine minified code
const threeMinJsPath = path.join(__dirname, 'node_modules', 'three', 'build', 'three.min.js');
const threeJsCode = fs.readFileSync(threeMinJsPath, 'utf8');

// 2. Read style.css content
const cssPath = path.join(__dirname, 'style.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// 3. Define inline application logic
const appJsCode = `
(function() {
  // FALLBACK ERROR HANDLER FOR WEBGL / RENDERING FAILURES
  function showRenderingError(errorMsg) {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.innerHTML = \`
        <div class="fallback-error-overlay">
          <div class="error-box">
            <h2>⚠️ 3D ENGINE INITIALIZATION FAILED</h2>
            <p>The WebGL 3D context could not be created or encountered a fatal hardware error.</p>
            <div class="error-detail">\${errorMsg}</div>
            <p><small>Please check your browser WebGL hardware acceleration settings or graphics drivers.</small></p>
          </div>
        </div>
      \`;
    }
    console.error('3D Engine Fatal Initialization Error:', errorMsg);
  }

  // 1. ORBITCONTROLS INLINED BROWSER IMPLEMENTATION FOR THREE.JS
  if (typeof THREE !== 'undefined' && !THREE.OrbitControls) {
    THREE.OrbitControls = function(camera, domElement) {
      this.camera = camera;
      this.domElement = domElement || document;
      this.enabled = true;
      this.target = new THREE.Vector3(1.5, 0, 3.5);
      this.enableDamping = true;
      this.dampingFactor = 0.05;
      this.minDistance = 6.0;
      this.maxDistance = 110.0;
      this.maxPolarAngle = Math.PI / 2 - 0.02;
      this.minPolarAngle = 0.05;

      var scope = this;
      var isDragging = false;
      var previousMousePosition = { x: 0, y: 0 };
      var spherical = { radius: 40, phi: Math.PI / 4, theta: Math.PI / 4 };

      function updateSphericalFromCamera() {
        var offset = new THREE.Vector3().subVectors(scope.camera.position, scope.target);
        spherical.radius = offset.length();
        spherical.theta = Math.atan2(offset.x, offset.z);
        spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / (spherical.radius || 1))));
      }

      updateSphericalFromCamera();

      this.update = function() {
        if (!scope.enabled) return;
        var offset = new THREE.Vector3();
        offset.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        offset.y = spherical.radius * Math.cos(spherical.phi);
        offset.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        scope.camera.position.copy(scope.target).add(offset);
        scope.camera.lookAt(scope.target);
      };

      function onMouseDown(e) {
        if (!scope.enabled || e.button !== 0) return;
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }

      function onMouseMove(e) {
        if (!isDragging || !scope.enabled) return;
        var deltaX = e.clientX - previousMousePosition.x;
        var deltaY = e.clientY - previousMousePosition.y;

        spherical.theta -= deltaX * 0.005;
        spherical.phi -= deltaY * 0.005;
        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

        previousMousePosition = { x: e.clientX, y: e.clientY };
        scope.update();
      }

      function onMouseUp() { isDragging = false; }

      function onWheel(e) {
        if (!scope.enabled) return;
        e.preventDefault();
        spherical.radius += e.deltaY * 0.05;
        spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
        scope.update();
      }

      this.domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      this.domElement.addEventListener('wheel', onWheel, { passive: false });
    };
  }

  // 2. CENTRAL DATA STORE
  const ZONES = {
    ZONE_A: { id: 'ZONE_A', name: 'Zone A - Platform 1 North', type: 'Platform', status: 'NORMAL', count: 18, capacity: 80, density: 0.18, trend: 'STABLE', color: '#10b981', description: 'Normal platform passenger movement with steady boarding and low crowd accumulation.' },
    ZONE_B: { id: 'ZONE_B', name: 'Zone B - Main Ticket Concourse', type: 'Concourse', status: 'HIGH', count: 52, capacity: 90, density: 0.58, trend: 'INCREASING', color: '#f59e0b', description: 'High passenger inflow from ticket counters. Crowd density is steadily accumulating.' },
    ZONE_C: { id: 'ZONE_C', name: 'Zone C - West Corridor', type: 'Corridor', status: 'NORMAL', count: 22, capacity: 70, density: 0.22, trend: 'STABLE', color: '#10b981', description: 'Normal passenger transit between platform concourse and secondary exit.' },
    ZONE_D: { id: 'ZONE_D', name: 'Zone D - Main Exit Bottleneck', type: 'Turnstile Exit', status: 'CRITICAL', count: 86, capacity: 95, density: 0.91, trend: 'CRITICAL CONGESTION', color: '#ef4444', description: 'CRITICAL CONGESTION! Severe bottleneck at main turnstiles. Immediate intervention required.' }
  };

  const SLIDING_WINDOW = {
    events: [
      { timestamp: '08:16', count: 42, state: 'NORMAL', delta: '+3' },
      { timestamp: '08:17', count: 48, state: 'NORMAL', delta: '+6' },
      { timestamp: '08:18', count: 55, state: 'HIGH', delta: '+7' },
      { timestamp: '08:19', count: 61, state: 'HIGH', delta: '+6' },
      { timestamp: '08:20', count: 86, state: 'CRITICAL', delta: '+25' }
    ],
    latestMinute: 20,
    pushNewEvent: function() {
      this.latestMinute++;
      const minStr = this.latestMinute < 10 ? '0' + this.latestMinute : '' + this.latestMinute;
      const timestamp = '08:' + minStr;
      const lastCount = this.events[this.events.length - 1].count;
      const nextCount = Math.max(65, Math.min(95, lastCount + Math.floor(Math.random() * 7) - 3));
      const delta = nextCount >= lastCount ? '+' + (nextCount - lastCount) : '' + (nextCount - lastCount);
      const state = nextCount > 75 ? 'CRITICAL' : nextCount > 45 ? 'HIGH' : 'NORMAL';

      const droppedEvent = this.events.shift();
      const newEvent = { timestamp, count: nextCount, state, delta };
      this.events.push(newEvent);
      return { droppedEvent, newEvent };
    }
  };

  const PIPELINE_NODES = {
    DATA_SOURCES: { id: 'DATA_SOURCES', title: 'Data Sources (CCTV & IR Counters)', role: 'Real-time Video & Optical Telemetry Capture', tech: 'IP Cameras + LiDAR Entry/Exit Sensors', status: 'ACTIVE', detail: 'Optical people counters and CCTV feeds monitor passengers entering/exiting zones A, B, C, and D.' },
    HDFS: { id: 'HDFS', title: 'HDFS Storage Cluster', role: 'Distributed Storage for Historical Events', tech: 'Hadoop Distributed File System v3.3', status: 'OPTIMAL', detail: 'Stores long-term historical timestamped crowd event logs (/crowd/logs/YYYY/MM/DD) for batch trend analysis.' },
    MAPREDUCE: { id: 'MAPREDUCE', title: 'MapReduce Aggregation Engine', role: 'Batch Processing & Historical Baseline', tech: 'Hadoop MapReduce Parallel Analytics', status: 'READY', detail: 'Processes historical crowd density baselines. Map: (Zone, Count) -> Shuffle: Group by Zone -> Reduce: Average & Peak stats.' },
    STREAM_PROCESSING: { id: 'STREAM_PROCESSING', title: 'Stream Analytics Engine', role: 'Real-Time 5-Minute Sliding Window Analytics', tech: 'Apache Flink / Spark Streaming', status: 'STREAMING', detail: 'Maintains the 5-minute sliding window stream state. Triggers instantaneous alerts when crowd thresholds exceed limits.' },
    DASHBOARD: { id: 'DASHBOARD', title: 'Operations Control Room', role: 'Central Monitoring & Visualization', tech: 'WebGL Digital Twin + Live Telemetry UI', status: 'MONITORING', detail: 'Provides 3D spatial situational awareness and real-time inspector feedback for station master operators.' }
  };

  const ZONE_BOUNDS = {
    ZONE_A: { minX: -24, maxX: -11, minZ: -16, maxZ: -2 },
    ZONE_B: { minX: -9, maxX: +4, minZ: -16, maxZ: -2 },
    ZONE_C: { minX: -24, maxX: -11, minZ: +1, maxZ: +16 },
    ZONE_D: { minX: -9, maxX: +4, minZ: +1, maxZ: +16 }
  };

  // 3. PROCEDURAL CANVAS TEXTURES & MATERIALS
  function createFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d1d5db'; ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 4;
    for (let x = 0; x <= 512; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke(); }
    for (let y = 0; y <= 512; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(12, 12);
    return tex;
  }

  function createBadgeSprite(text, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
    ctx.strokeStyle = colorHex; ctx.lineWidth = 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, 496, 112, 16); else ctx.rect(8, 8, 496, 112);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = colorHex; ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(6.5, 1.6, 1.0);
    return sprite;
  }

  // 4. MAIN SCENE INITIALIZATION WITH STARTUP RENDERING CHECKS
  let scene, camera, renderer, controls;

  try {
    const container = document.getElementById('canvas-container');
    if (!container) throw new Error('#canvas-container element not found in DOM.');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.005);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 300);
    const defaultCamPos = new THREE.Vector3(-2.0, 38.0, 42.0);
    const defaultTargetPos = new THREE.Vector3(1.5, 0.0, 3.5);
    camera.position.copy(defaultCamPos);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.copy(defaultTargetPos);
    controls.update();

    // TEMPORARY STARTUP TEST CUBE VERIFICATION (CONFIRMS RENDERING CONTEXT BEFORE FULL VENUE)
    const testCubeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const testCubeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const testCube = new THREE.Mesh(testCubeGeo, testCubeMat);
    scene.add(testCube);
    renderer.render(scene, camera);
    scene.remove(testCube);

    // Lighting
    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(-25, 45, 25); sun.castShadow = true; scene.add(sun);
    const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x334155, 1.0); scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambient);

    // Shared Materials
    const floorMat = new THREE.MeshStandardMaterial({ map: createFloorTexture(), roughness: 0.5, metalness: 0.1 });
    const darkConcreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.7 });
    const stainlessMat = new THREE.MeshStandardMaterial({ color: 0xc0c6d0, roughness: 0.2, metalness: 0.85 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
    const techPadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

    const zoneMats = {
      ZONE_A: { overlay: new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.18, side: THREE.DoubleSide }) },
      ZONE_B: { overlay: new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.22, side: THREE.DoubleSide }) },
      ZONE_C: { overlay: new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.18, side: THREE.DoubleSide }) },
      ZONE_D: { overlay: new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.28, side: THREE.DoubleSide }) }
    };

    // 5. HUMAN CROWD MODEL GENERATOR
    const clothingColors = [0x1e293b, 0x334155, 0x475569, 0x0f172a, 0x78350f, 0x1e3a8a, 0x365314, 0x52525b];
    const trouserColors = [0x0f172a, 0x1e293b, 0x334155, 0x475569, 0x78350f];
    const skinTones = [0xf87171, 0xfb923c, 0xfcd34d, 0xd97706, 0xb45309];

    function createHuman(seed) {
      const group = new THREE.Group();
      const torsoMat = new THREE.MeshStandardMaterial({ color: clothingColors[seed % clothingColors.length], roughness: 0.7 });
      const legMat = new THREE.MeshStandardMaterial({ color: trouserColors[seed % trouserColors.length], roughness: 0.8 });
      const skinMat = new THREE.MeshStandardMaterial({ color: skinTones[seed % skinTones.length], roughness: 0.6 });

      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.7, 6), legMat);
      leftLeg.position.set(-0.09, 0.35, 0); group.add(leftLeg);
      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.7, 6), legMat);
      rightLeg.position.set(0.09, 0.35, 0); group.add(rightLeg);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.65, 8), torsoMat);
      torso.position.set(0, 1.0, 0); group.add(torso);

      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6), skinMat);
      leftArm.position.set(-0.24, 0.95, 0); group.add(leftArm);
      const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6), skinMat);
      rightArm.position.set(0.24, 0.95, 0); group.add(rightArm);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), skinMat);
      head.position.set(0, 1.45, 0); group.add(head);

      const scaleY = 0.9 + (seed % 10) * 0.025;
      group.scale.set(1.0, scaleY, 1.0);
      group.userData = { leftLeg, rightLeg, leftArm, rightArm, walkOffset: seed * 0.7, inBottleneck: false };
      return group;
    }

    // 6. BUILD PUBLIC VENUE & ZONES
    const venueGroup = new THREE.Group();
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(32, 36), floorMat);
    floorMesh.rotation.x = -Math.PI / 2; floorMesh.position.set(-10, 0, 0); floorMesh.receiveShadow = true;
    venueGroup.add(floorMesh);

    // Train & Track
    const trackFloor = new THREE.Mesh(new THREE.BoxGeometry(32, 0.4, 4), darkConcreteMat);
    trackFloor.position.set(-10, -0.2, -18); venueGroup.add(trackFloor);
    const trainBody = new THREE.Mesh(new THREE.BoxGeometry(26, 3.2, 2.8), darkSteelMat);
    trainBody.position.set(-11, 1.6, -18.5); venueGroup.add(trainBody);

    // 4 Monitored Zones
    const zoneConfigs = [
      { id: 'ZONE_A', bounds: ZONE_BOUNDS.ZONE_A, label: 'ZONE A · NORMAL', color: '#10b981', cx: -17.5, cz: -9 },
      { id: 'ZONE_B', bounds: ZONE_BOUNDS.ZONE_B, label: 'ZONE B · HIGH', color: '#f59e0b', cx: -2.5, cz: -9 },
      { id: 'ZONE_C', bounds: ZONE_BOUNDS.ZONE_C, label: 'ZONE C · NORMAL', color: '#10b981', cx: -17.5, cz: 8.5 },
      { id: 'ZONE_D', bounds: ZONE_BOUNDS.ZONE_D, label: 'ZONE D · CRITICAL', color: '#ef4444', cx: -2.5, cz: 8.5 }
    ];

    zoneConfigs.forEach(cfg => {
      const patchGeo = new THREE.PlaneGeometry(13, 14);
      const patch = new THREE.Mesh(patchGeo, zoneMats[cfg.id].overlay);
      patch.rotation.x = -Math.PI / 2; patch.position.set(cfg.cx, 0.02, cfg.cz);
      patch.userData = { isZone: true, zoneId: cfg.id };
      venueGroup.add(patch);

      const badge = createBadgeSprite(cfg.label, cfg.color);
      badge.position.set(cfg.cx, 4.2, cfg.cz);
      badge.userData = { isZone: true, zoneId: cfg.id };
      venueGroup.add(badge);
    });

    // Columns
    [[-22, -12], [-12, -12], [-2, -12], [-22, 0], [-12, 0], [-2, 0], [-22, 14], [-12, 14], [-2, 14]].forEach(([x, z]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.5, 8), steelMat);
      col.position.set(x, 3.0, z); venueGroup.add(col);
    });

    // Turnstiles
    for (let x = -4; x <= 2; x += 1.8) {
      const gate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 1.4), stainlessMat);
      gate.position.set(x, 0.55, 15); venueGroup.add(gate);
    }

    scene.add(venueGroup);

    // 7. POPULATE CROWD
    const crowdMembers = [];
    let varSeed = 1;

    function spawnCrowdInZone(zoneId, count, bounds, isBottleneck = false) {
      for (let i = 0; i < count; i++) {
        const human = createHuman(varSeed++);
        const x = bounds.minX + 0.8 + Math.random() * (bounds.maxX - bounds.minX - 1.6);
        const z = bounds.minZ + 0.8 + Math.random() * (bounds.maxZ - bounds.minZ - 1.6);
        human.position.set(x, 0, z);
        human.rotation.y = Math.random() * Math.PI * 2;
        human.userData.zoneId = zoneId;
        human.userData.inBottleneck = isBottleneck;
        scene.add(human);
        crowdMembers.push(human);
      }
    }

    spawnCrowdInZone('ZONE_A', 18, ZONE_BOUNDS.ZONE_A);
    spawnCrowdInZone('ZONE_B', 52, ZONE_BOUNDS.ZONE_B);
    spawnCrowdInZone('ZONE_C', 22, ZONE_BOUNDS.ZONE_C);
    spawnCrowdInZone('ZONE_D', 86, ZONE_BOUNDS.ZONE_D, true);

    // 8. BUILD BIG DATA PIPELINE NODES
    const pipelineGroup = new THREE.Group();
    const techPad = new THREE.Mesh(new THREE.PlaneGeometry(16, 36), techPadMat);
    techPad.rotation.x = -Math.PI / 2; techPad.position.set(17, 0.01, 0); pipelineGroup.add(techPad);

    function buildTechNode(nodeId, title, colorHex, zPos) {
      const node = new THREE.Group();
      node.position.set(17, 0, zPos);
      node.userData = { isPipelineNode: true, nodeId };
      const base = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.3, 9.0), darkConcreteMat);
      base.position.set(0, 0.15, 0); node.add(base);
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(7.0, 3.2, 7.0), darkSteelMat);
      bldg.position.set(0, 1.75, 0); node.add(bldg);
      const badge = createBadgeSprite(title, colorHex);
      badge.position.set(0, 4.8, 0); node.add(badge);
      pipelineGroup.add(node);
    }

    buildTechNode('HDFS', '💾 HDFS STORAGE', '#10b981', -11);
    buildTechNode('MAPREDUCE', '⚙️ MAPREDUCE AGGREGATOR', '#38bdf8', 0);
    buildTechNode('STREAM_PROCESSING', '⚡ STREAM ENGINE (5-MIN WINDOW)', '#f59e0b', 11);

    // Control Room
    const ctrlNode = new THREE.Group();
    ctrlNode.position.set(-1, 0, 24);
    ctrlNode.userData = { isPipelineNode: true, nodeId: 'DASHBOARD' };
    const ctrlBase = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.3, 8.0), darkConcreteMat);
    ctrlBase.position.set(0, 0.15, 0); ctrlNode.add(ctrlBase);
    const ctrlBldg = new THREE.Mesh(new THREE.BoxGeometry(12.0, 3.2, 6.0), darkSteelMat);
    ctrlBldg.position.set(0, 1.75, 0); ctrlNode.add(ctrlBldg);
    const ctrlBadge = createBadgeSprite('🖥️ OPERATIONS CONTROL ROOM', '#ef4444');
    ctrlBadge.position.set(0, 4.8, 0); ctrlNode.add(ctrlBadge);
    pipelineGroup.add(ctrlNode);

    scene.add(pipelineGroup);

    // 9. RAYCASTING INTERACTION & CAMERA FOCUS
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let cameraTween = null;
    let activeSelection = { type: 'ZONE', id: 'ZONE_D' };

    function animateCameraTo(targetPos, lookTarget, durationMs = 1200) {
      const startPos = camera.position.clone();
      const startLook = controls.target.clone();
      const startTime = performance.now();
      cameraTween = {
        update: function() {
          const elapsed = performance.now() - startTime;
          const progress = Math.min(1.0, elapsed / durationMs);
          const ease = 1 - Math.pow(1 - progress, 3);
          camera.position.lerpVectors(startPos, targetPos, ease);
          controls.target.lerpVectors(startLook, lookTarget, ease);
          controls.update();
          if (progress >= 1.0) cameraTween = null;
        }
      };
    }

    function focusZone(zoneId) {
      const presets = {
        ZONE_A: { cam: new THREE.Vector3(-17.5, 14.0, 3.0), target: new THREE.Vector3(-17.5, 0.0, -9.0) },
        ZONE_B: { cam: new THREE.Vector3(-2.5, 14.0, 3.0), target: new THREE.Vector3(-2.5, 0.0, -9.0) },
        ZONE_C: { cam: new THREE.Vector3(-17.5, 14.0, 20.0), target: new THREE.Vector3(-17.5, 0.0, 8.5) },
        ZONE_D: { cam: new THREE.Vector3(-2.5, 14.0, 20.0), target: new THREE.Vector3(-2.5, 0.0, 8.5) }
      };
      if (presets[zoneId]) animateCameraTo(presets[zoneId].cam, presets[zoneId].target);
    }

    function focusNode(nodeId) {
      const presets = {
        HDFS: { cam: new THREE.Vector3(17, 10.0, -2.0), target: new THREE.Vector3(17, 0.0, -11.0) },
        MAPREDUCE: { cam: new THREE.Vector3(17, 10.0, 9.0), target: new THREE.Vector3(17, 0.0, 0.0) },
        STREAM_PROCESSING: { cam: new THREE.Vector3(17, 10.0, 20.0), target: new THREE.Vector3(17, 0.0, 11.0) },
        DASHBOARD: { cam: new THREE.Vector3(-1, 10.0, 31.0), target: new THREE.Vector3(-1, 0.0, 24.0) }
      };
      if (presets[nodeId]) animateCameraTo(presets[nodeId].cam, presets[nodeId].target);
    }

    renderer.domElement.addEventListener('click', function(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      for (let hit of intersects) {
        let obj = hit.object;
        while (obj && obj !== scene) {
          if (obj.userData.isZone) {
            activeSelection = { type: 'ZONE', id: obj.userData.zoneId };
            focusZone(obj.userData.zoneId); renderInspector(); return;
          }
          if (obj.userData.isPipelineNode) {
            activeSelection = { type: 'PIPELINE_NODE', id: obj.userData.nodeId };
            focusNode(obj.userData.nodeId); renderInspector(); return;
          }
          obj = obj.parent;
        }
      }
    });

    // 10. UI RENDERER & EVENT LISTENERS
    const inspectorContent = document.getElementById('inspector-content');

    function renderInspector() {
      if (!inspectorContent) return;
      if (activeSelection.type === 'ZONE') {
        const zone = ZONES[activeSelection.id];
        const statusClass = zone.status.toLowerCase();
        inspectorContent.innerHTML = \`
          <div class="inspector-card">
            <div class="card-header">
              <span class="badge \${statusClass}">\${zone.status}</span>
              <span class="type-tag">\${zone.type}</span>
            </div>
            <h3 class="zone-title">\${zone.name}</h3>
            <p class="zone-desc">\${zone.description}</p>
            <div class="stat-grid">
              <div class="stat-box"><span class="stat-label">Current Count</span><span class="stat-val \${statusClass}">\${zone.count} <small>people</small></span></div>
              <div class="stat-box"><span class="stat-label">Capacity Limit</span><span class="stat-val">\${zone.capacity} <small>max</small></span></div>
              <div class="stat-box"><span class="stat-label">Crowd Density</span><span class="stat-val">\${zone.density} <small>p/m²</small></span></div>
              <div class="stat-box"><span class="stat-label">Trend (5-Min)</span><span class="stat-val trend">\${zone.trend}</span></div>
            </div>
            <div class="window-section">
              <div class="section-title"><span>LATEST 5-MINUTE SLIDING WINDOW</span><button id="btn-step-window" class="btn-micro">+ STEP EVENT</button></div>
              <div id="sliding-window-list" class="window-list"></div>
            </div>
            <button id="btn-operator-action" class="btn-primary-action \${zone.status === 'CRITICAL' ? 'pulse-alert' : ''}">
              \${zone.status === 'CRITICAL' ? '⚠️ EXECUTE OPERATOR INTERVENTION' : 'VIEW OPERATOR WORKFLOW'}
            </button>
          </div>
        \`;
        renderSlidingWindowList();
      } else if (activeSelection.type === 'PIPELINE_NODE') {
        const node = PIPELINE_NODES[activeSelection.id];
        inspectorContent.innerHTML = \`
          <div class="inspector-card">
            <div class="card-header"><span class="badge green">\${node.status}</span><span class="type-tag">Big Data Pipeline</span></div>
            <h3 class="zone-title">\${node.title}</h3>
            <p class="zone-desc">\${node.detail}</p>
            <div class="stat-grid">
              <div class="stat-box"><span class="stat-label">Role</span><span class="stat-val text-sm">\${node.role}</span></div>
              <div class="stat-box"><span class="stat-label">Technology</span><span class="stat-val text-sm">\${node.tech}</span></div>
            </div>
          </div>
        \`;
      }
    }

    function renderSlidingWindowList() {
      const listEl = document.getElementById('sliding-window-list');
      if (!listEl) return;
      listEl.innerHTML = SLIDING_WINDOW.events.map((ev, idx) => {
        const isLatest = idx === SLIDING_WINDOW.events.length - 1;
        const stateClass = ev.state.toLowerCase();
        return \`
          <div class="window-item \${isLatest ? 'latest-event' : ''}">
            <span class="win-time">\${ev.timestamp}</span>
            <span class="win-bar"><span class="win-fill \${stateClass}" style="width: \${Math.min(100, (ev.count / 95) * 100)}%"></span></span>
            <span class="win-count \${stateClass}">\${ev.count}</span>
            <span class="win-delta">\${ev.delta}</span>
            \${isLatest ? '<span class="latest-tag">LATEST</span>' : ''}
          </div>
        \`;
      }).join('');
    }

    // Quick Nav Handlers
    document.querySelectorAll('.btn-zone-nav').forEach(btn => {
      btn.addEventListener('click', function() {
        const zoneId = this.dataset.zone;
        activeSelection = { type: 'ZONE', id: zoneId };
        focusZone(zoneId); renderInspector();
      });
    });

    document.querySelectorAll('.btn-node-nav').forEach(btn => {
      btn.addEventListener('click', function() {
        const nodeId = this.dataset.node;
        activeSelection = { type: 'PIPELINE_NODE', id: nodeId };
        focusNode(nodeId); renderInspector();
      });
    });

    document.getElementById('btn-reset-view').addEventListener('click', function() {
      animateCameraTo(defaultCamPos, defaultTargetPos);
    });

    let isSimulating = true;
    document.getElementById('btn-toggle-sim').addEventListener('click', function() {
      isSimulating = !isSimulating;
      this.innerHTML = isSimulating ? '<span class="status-dot green"></span> SIMULATION: RUNNING' : '<span class="status-dot gray"></span> SIMULATION: PAUSED';
    });

    document.addEventListener('click', function(e) {
      if (e.target.closest('#btn-step-window')) {
        const result = SLIDING_WINDOW.pushNewEvent();
        ZONES.ZONE_D.count = result.newEvent.count;
        ZONES.ZONE_D.status = result.newEvent.state;
        renderInspector();
        showToast('New Stream Event Arrived (' + result.newEvent.timestamp + ' -> ' + result.newEvent.count + ' people). Window advanced!');
      }
      if (e.target.closest('#btn-operator-action')) {
        openModal();
      }
      if (e.target.closest('.modal-close')) {
        closeModal();
      }
    });

    function openModal() {
      const modal = document.getElementById('operator-modal');
      const modalBody = document.getElementById('operator-modal-body');
      modal.classList.add('visible');
      modalBody.innerHTML = \`
        <div class="critical-banner">
          <h4>🚨 LIVE CROWD ALERT: ZONE D (CRITICAL CONGESTION)</h4>
          <p>Turnstile exit queue reached 86 passengers. Instant intervention available:</p>
        </div>
        <div class="intervention-options">
          <div class="option-card">
            <div class="opt-info"><strong>OPEN AUXILIARY GATE 3</strong><p>Unlocks secondary side exit corridor.</p></div>
            <button class="btn-action-execute" onclick="window.execAction('OPEN_GATE')">EXECUTE</button>
          </div>
          <div class="option-card">
            <div class="opt-info"><strong>DEPLOY CROWD MARSHALS</strong><p>Dispatches 4 station security personnel.</p></div>
            <button class="btn-action-execute" onclick="window.execAction('MARSHALS')">EXECUTE</button>
          </div>
        </div>
      \`;
    }

    function closeModal() {
      document.getElementById('operator-modal').classList.remove('visible');
    }

    window.execAction = function(act) {
      if (act === 'OPEN_GATE') {
        ZONES.ZONE_D.count = 45; ZONES.ZONE_D.status = 'HIGH';
        showToast('✅ Auxiliary Gate 3 Opened! Zone D count reduced to 45.');
      } else {
        ZONES.ZONE_D.count = 58;
        showToast('👮 Crowd Marshals Deployed.');
      }
      closeModal(); renderInspector();
    };

    function showToast(msg) {
      const toast = document.getElementById('alert-toast');
      toast.textContent = msg; toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 3500);
    }

    // 11. ANIMATION & RESIZE LOOP
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      controls.update();
      if (cameraTween) cameraTween.update();

      if (isSimulating) {
        crowdMembers.forEach(human => {
          const swing = Math.sin(elapsedTime * 6 + human.userData.walkOffset) * 0.35;
          human.userData.leftLeg.rotation.x = swing;
          human.userData.rightLeg.rotation.x = -swing;
          human.userData.leftArm.rotation.x = -swing * 0.8;
          human.userData.rightArm.rotation.x = swing * 0.8;
        });
      }

      renderer.render(scene, camera);
    }

    window.addEventListener('resize', function() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    renderInspector();
    animate();
  } catch (err) {
    showRenderingError(err.message || err.toString());
  }
})();
`;

// Additional Fallback CSS
const extraCss = `
.fallback-error-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(9, 13, 22, 0.95);
  z-index: 999;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.error-box {
  background: #1e293b;
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 28px;
  max-width: 540px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(239, 68, 68, 0.4);
}
.error-box h2 { color: #ef4444; font-size: 18px; margin-bottom: 12px; }
.error-box p { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
.error-detail {
  background: #090d16;
  border: 1px solid #334155;
  color: #fca5a5;
  font-family: monospace;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  word-break: break-all;
  margin-bottom: 16px;
}
`;

// Assemble final single standalone HTML file
const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THE CROWD SAFETY ENGINE — Real-Time Analytics for Detecting Crowd Congestion (Fully Self-Contained Offline Visual Aid)</title>
  
  <style>
${cssCode}
${extraCss}
  </style>
</head>
<body>
  <div id="app">
    <!-- 3D WEBGL VIEWPORT CONTAINER -->
    <div id="canvas-container"></div>

    <!-- HEADER BAR -->
    <header class="header-bar">
      <div class="brand-section">
        <div class="brand-icon">🚆</div>
        <div class="brand-titles">
          <h1>THE CROWD SAFETY ENGINE</h1>
          <p>Real-Time Analytics for Detecting Crowd Congestion</p>
        </div>
      </div>

      <div class="seminar-pill">
        <span class="status-dot green"></span>
        <span>23IT711 · Big Data Analytics | Gokul SV (2303717620521019) | Coimbatore Institute of Technology</span>
      </div>
    </header>

    <!-- FLOATING TOP NAVIGATION QUICK BAR -->
    <nav class="nav-control-bar">
      <button id="btn-reset-view" class="nav-btn active">
        <span>🎥 RESET VIEW</span>
      </button>

      <button class="nav-btn btn-zone-nav" data-zone="ZONE_A">
        <span class="status-dot green"></span> ZONE A (NORMAL)
      </button>

      <button class="nav-btn btn-zone-nav" data-zone="ZONE_B">
        <span class="status-dot amber"></span> ZONE B (HIGH)
      </button>

      <button class="nav-btn btn-zone-nav" data-zone="ZONE_C">
        <span class="status-dot green"></span> ZONE C (NORMAL)
      </button>

      <button class="nav-btn btn-zone-nav critical-btn" data-zone="ZONE_D">
        <span class="status-dot red"></span> ZONE D (CRITICAL)
      </button>

      <button class="nav-btn btn-node-nav" data-node="HDFS">
        <span>💾 HDFS</span>
      </button>

      <button class="nav-btn btn-node-nav" data-node="MAPREDUCE">
        <span>⚙️ MAPREDUCE</span>
      </button>

      <button class="nav-btn btn-node-nav" data-node="STREAM_PROCESSING">
        <span>⚡ STREAM ENGINE</span>
      </button>

      <button class="nav-btn btn-node-nav" data-node="DASHBOARD">
        <span>🖥️ CONTROL ROOM</span>
      </button>

      <button id="btn-toggle-sim" class="nav-btn active">
        <span class="status-dot green"></span> LIVE SIMULATION
      </button>
    </nav>

    <!-- RIGHT SIDEBAR INSPECTOR -->
    <aside class="sidebar-inspector">
      <div class="inspector-header">
        <h2>TRANSPORT / CROWD DATA INSPECTOR</h2>
        <span class="status-dot green"></span>
      </div>
      <div id="inspector-content" class="inspector-body">
        <!-- Rendered dynamically by inline script -->
      </div>
    </aside>

    <!-- BOTTOM PIPELINE BAR -->
    <footer class="pipeline-bar">
      <div class="pipeline-title">END-TO-END BIG DATA PIPELINE</div>
      <div class="pipeline-flow">
        <div class="pipe-step btn-node-nav" data-node="DATA_SOURCES">
          <span>📷 SENSORS</span>
        </div>
        <span class="pipe-arrow">→</span>

        <div class="pipe-step btn-node-nav" data-node="HDFS">
          <span>💾 HDFS LOGS</span>
        </div>
        <span class="pipe-arrow">→</span>

        <div class="pipe-step btn-node-nav" data-node="MAPREDUCE">
          <span>⚙️ MAPREDUCE</span>
        </div>
        <span class="pipe-arrow">→</span>

        <div class="pipe-step btn-node-nav" data-node="STREAM_PROCESSING">
          <span>⚡ STREAM ANALYTICS</span>
        </div>
        <span class="pipe-arrow">→</span>

        <div class="pipe-step btn-node-nav" data-node="DASHBOARD">
          <span>🖥️ CONTROL ROOM</span>
        </div>
        <span class="pipe-arrow">→</span>

        <div class="pipe-step btn-zone-nav" data-zone="ZONE_D">
          <span class="status-dot red"></span> <span>OPERATOR ACTION</span>
        </div>
      </div>
    </footer>

    <!-- OPERATOR RESPONSE MODAL -->
    <div id="operator-modal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>OPERATOR INTERVENTION WORKFLOW</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div id="operator-modal-body" class="modal-body">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>

    <!-- ALERT TOAST -->
    <div id="alert-toast" class="alert-toast">
      🚨 LIVE CROWD ALERT: Zone D Bottleneck Critical!
    </div>
  </div>

  <!-- EMBEDDED THREE.JS ENGINE RUNTIME (100% OFFLINE, ZERO INTERNET/CDN/SERVER DEPENDENCY) -->
  <script>
${threeJsCode}
  </script>

  <!-- APPLICATION LOGIC & INLINED ORBITCONTROLS -->
  <script>
${appJsCode}
  </script>
</body>
</html>
`;

const outputPath = path.join(__dirname, 'standalone.html');
fs.writeFileSync(outputPath, standaloneHtml, 'utf8');

console.log('Successfully compiled 100% self-contained standalone.html! File size:', fs.statSync(outputPath).size, 'bytes.');
