import * as THREE from 'three';
import { setupScene } from './scene.js';
import { buildPublicVenue, ZONE_BOUNDS, updateGate3Visual } from './venueBuilder.js';
import { populateVenueCrowd, updateCrowdAnimation } from './humanBuilder.js';
import { buildBigDataPipeline } from './pipelineBuilder.js';
import { setupInteraction } from './interaction.js';
import { setupUIController } from './uiController.js';
import { simulationState, getZoneMetrics } from './crowdData.js';

function showRenderingError(errorMsg) {
  const container = document.getElementById('canvas-container');
  if (container) {
    container.innerHTML = `
      <div class="fallback-error-overlay">
        <div class="error-box">
          <h2>⚠️ 3D ENGINE INITIALIZATION FAILED</h2>
          <p>The WebGL 3D context could not be created or encountered a fatal hardware error.</p>
          <div class="error-detail">${errorMsg}</div>
        </div>
      </div>
    `;
  }
  console.error('3D Engine Fatal Initialization Error:', errorMsg);
}

function initApp() {
  try {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. SETUP THREE.JS SCENE, CAMERA, LIGHTS, CONTROLS
    const sceneSetup = setupScene(container);
    const { scene, camera, renderer, controls } = sceneSetup;

    // 2. BUILD REALISTIC PUBLIC VENUE (RAILWAY STATION CONCOURSE & 4 ZONES)
    const venueGroup = buildPublicVenue(scene);

    // 3. POPULATE VENUE WITH REALISTIC HUMAN CROWD
    const crowdMembers = populateVenueCrowd(scene, ZONE_BOUNDS, simulationState);

    // 4. BUILD BIG DATA INFRASTRUCTURE PIPELINE FACILITIES
    const pipelineGroup = buildBigDataPipeline(scene);

    // 5. SETUP UI CONTROLLER & EVENT LISTENERS
    let interactionHandler;
    const uiController = setupUIController(
      {
        focusOnZone: (id) => interactionHandler && interactionHandler.focusOnZone(id),
        focusOnPipelineNode: (id) => interactionHandler && interactionHandler.focusOnPipelineNode(id)
      },
      sceneSetup,
      (simState) => {
        simulationState.isSimulating = simState;
      },
      scene,
      crowdMembers,
      ZONE_BOUNDS
    );

    // 6. SETUP 3D INTERACTION & RAYCASTING
    interactionHandler = setupInteraction(scene, camera, renderer, sceneSetup, (selection) => {
      uiController.handleSelectObject(selection);
    });

    // 7. MAIN RENDER & ANIMATION LOOP
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Update OrbitControls & smooth camera tweening
      controls.update();
      sceneSetup.updateTween();

      // Update 3D Gate 3 Open/Closed Visual
      updateGate3Visual(simulationState.interventions.gate3, venueGroup);

      // Animate crowd movement & localized intervention rerouting
      updateCrowdAnimation(crowdMembers, elapsedTime, simulationState.isSimulating, delta, simulationState, scene);

      // Render Scene
      renderer.render(scene, camera);
    }

    animate();
  } catch (err) {
    showRenderingError(err.message || String(err));
    console.error(err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
