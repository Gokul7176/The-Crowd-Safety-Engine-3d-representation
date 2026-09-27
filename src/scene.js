import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function setupScene(container) {
  // 1. SCENE CREATION
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a); // Dark Navy Canvas Background
  scene.fog = new THREE.FogExp2(0x0f172a, 0.005);

  // 2. CAMERA CREATION (Default 3/4 Elevated Overview Perspective Centered for UI Layout)
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 300);

  // Default camera angle position showing complete system cleanly
  const defaultCamPos = new THREE.Vector3(-2.0, 38.0, 42.0);
  const defaultTargetPos = new THREE.Vector3(1.5, 0.0, 3.5);

  camera.position.copy(defaultCamPos);

  // 3. RENDERER CREATION
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Clear container before appending
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Ensure domElement fills container
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.display = 'block';

  // 4. ORBIT CONTROLS
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't clip below ground
  controls.minDistance = 6.0;
  controls.maxDistance = 110.0;
  controls.target.copy(defaultTargetPos);
  controls.update();

  // 5. LIGHTING SYSTEM (Bright, Clear Visibility)
  // Main Directional Sun Light
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
  sunLight.position.set(-25, 45, 25);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 1.0;
  sunLight.shadow.camera.far = 120;
  sunLight.shadow.camera.left = -40;
  sunLight.shadow.camera.right = 40;
  sunLight.shadow.camera.top = 40;
  sunLight.shadow.camera.bottom = -40;
  sunLight.shadow.bias = -0.0003;
  scene.add(sunLight);

  // Hemisphere Light (Sky Blue + Ground Warm Fill)
  const hemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x334155, 1.0);
  scene.add(hemiLight);

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Interior Facility Accent Point Lights
  const hdfsLight = new THREE.PointLight(0x38bdf8, 2.0, 18);
  hdfsLight.position.set(17, 4, -11);
  scene.add(hdfsLight);

  const mrLight = new THREE.PointLight(0x38bdf8, 2.0, 18);
  mrLight.position.set(17, 4, 0);
  scene.add(mrLight);

  const streamLight = new THREE.PointLight(0xf59e0b, 2.0, 18);
  streamLight.position.set(17, 4, 11);
  scene.add(streamLight);

  const ctrlLight = new THREE.PointLight(0xef4444, 2.0, 18);
  ctrlLight.position.set(-1, 4, 24);
  scene.add(ctrlLight);

  // 6. SMOOTH CAMERA ANIMATION / TWEENING
  let cameraTween = null;

  function animateCameraTo(targetPos, lookTarget, durationMs = 1200) {
    const startPos = camera.position.clone();
    const startLook = controls.target.clone();
    const startTime = performance.now();

    cameraTween = {
      update: () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1.0, elapsed / durationMs);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.target.lerpVectors(startLook, lookTarget, ease);
        controls.update();

        if (progress >= 1.0) cameraTween = null;
      }
    };
  }

  function resetView() {
    animateCameraTo(defaultCamPos, defaultTargetPos, 1200);
  }

  // Handle Resize
  function handleResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', handleResize);
  setTimeout(handleResize, 100);

  return {
    scene,
    camera,
    renderer,
    controls,
    defaultCamPos,
    defaultTargetPos,
    animateCameraTo,
    resetView,
    updateTween: () => {
      if (cameraTween) cameraTween.update();
    }
  };
}
