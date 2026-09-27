import * as THREE from 'three';
import { setupScene } from './scene.js';
import { buildPublicVenue, ZONE_BOUNDS } from './venueBuilder.js';
import { populateVenueCrowd, updateCrowdAnimation } from './humanBuilder.js';
import { buildBigDataPipeline } from './pipelineBuilder.js';
import { setupInteraction } from './interaction.js';
import { setupUIController } from './uiController.js';

let isSimulating = true;

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // 1. SETUP THREE.JS SCENE, CAMERA, LIGHTS, CONTROLS
  const sceneSetup = setupScene(container);
  const { scene, camera, renderer, controls } = sceneSetup;

  // 2. BUILD REALISTIC PUBLIC VENUE (RAILWAY STATION CONCOURSE & 4 ZONES)
  const venueGroup = buildPublicVenue(scene);

  // 3. POPULATE VENUE WITH REALISTIC HUMAN CROWD (DENSITY CONTRAST)
  const crowdMembers = populateVenueCrowd(scene, ZONE_BOUNDS);

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
      isSimulating = simState;
    }
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

    // Update OrbitControls & smooth camera tweening
    controls.update();
    sceneSetup.updateTween();

    // Animate subtle crowd walking movement
    updateCrowdAnimation(crowdMembers, elapsedTime, isSimulating);

    // Render Scene
    renderer.render(scene, camera);
  }

  animate();
});
