const fs = require('fs');
const path = require('path');

// 1. Read Three.js engine minified code
const threeMinJsPath = path.join(__dirname, 'node_modules', 'three', 'build', 'three.min.js');
const threeJsCode = fs.readFileSync(threeMinJsPath, 'utf8');

// 2. Read OrbitControls implementation or embed it
const orbitControlsCode = `
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
`;

// Read source files from src/ and strip ES module imports/exports
function readSrcFile(filename) {
  let content = fs.readFileSync(path.join(__dirname, 'src', filename), 'utf8');
  // Strip import statements
  content = content.replace(/^import\s+[\s\S]*?;/gm, '');
  // Strip export keywords
  content = content.replace(/^export\s+(default\s+)?/gm, '');
  return content;
}

const crowdDataJs = readSrcFile('crowdData.js');
const materialsJs = readSrcFile('materials.js');
const venueBuilderJs = readSrcFile('venueBuilder.js');
const humanBuilderJs = readSrcFile('humanBuilder.js');
const pipelineBuilderJs = readSrcFile('pipelineBuilder.js');
const sceneJs = readSrcFile('scene.js');
const interactionJs = readSrcFile('interaction.js');
const uiControllerJs = readSrcFile('uiController.js');
const mainJs = readSrcFile('main.js');

// 3. Read style.css content
const cssPath = path.join(__dirname, 'style.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

// Combine JS code into inline script
const combinedJs = `
(function() {
  function showRenderingError(errorMsg) {
    const container = document.getElementById('canvas-container');
    if (container) {
      container.innerHTML = \`
        <div class="fallback-error-overlay">
          <div class="error-box">
            <h2>⚠️ 3D ENGINE INITIALIZATION FAILED</h2>
            <p>The WebGL 3D context could not be created or encountered a fatal hardware error.</p>
            <div class="error-detail">\${errorMsg}</div>
          </div>
        </div>
      \`;
    }
    console.error('3D Engine Fatal Initialization Error:', errorMsg);
  }

  try {
    ${orbitControlsCode}

    // --- CROWD DATA ---
    ${crowdDataJs}

    // --- MATERIALS ---
    ${materialsJs}

    // --- VENUE BUILDER ---
    ${venueBuilderJs}

    // --- HUMAN BUILDER ---
    ${humanBuilderJs}

    // --- PIPELINE BUILDER ---
    ${pipelineBuilderJs}

    // --- SCENE ---
    ${sceneJs}

    // --- INTERACTION ---
    ${interactionJs}

    // --- UI CONTROLLER ---
    ${uiControllerJs}

    // --- MAIN ---
    ${mainJs}

  } catch (err) {
    showRenderingError(err.message || err.toString());
  }
})();
`;

// Assemble final standalone HTML file
const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>THE CROWD SAFETY ENGINE — Real-Time Analytics for Detecting Crowd Congestion</title>
  <style>
${cssCode}
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
        <!-- Rendered dynamically -->
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

        <div class="pipe-step btn-operator-modal-trigger" data-zone="ZONE_D">
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
      🚨 LIVE CROWD ALERT
    </div>
  </div>

  <script>
${threeJsCode}
  </script>
  <script>
${combinedJs}
  </script>
</body>
</html>
`;

const outputPath = path.join(__dirname, 'standalone.html');
fs.writeFileSync(outputPath, standaloneHtml, 'utf8');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'standalone.html'), standaloneHtml, 'utf8');

console.log('Successfully generated modular standalone.html in root and public directories!');
