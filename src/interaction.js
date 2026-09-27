import * as THREE from 'three';

export function setupInteraction(scene, camera, renderer, sceneSetup, onSelectObject) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let hoveredObject = null;

  function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let foundTarget = null;

    for (let hit of intersects) {
      let obj = hit.object;
      // Traverse up to find named group or interactive entity
      while (obj && obj !== scene) {
        if (
          obj.userData.isZone ||
          obj.userData.isSensor ||
          obj.userData.isPipelineNode ||
          obj.userData.isInteractive
        ) {
          foundTarget = obj;
          break;
        }
        obj = obj.parent;
      }
      if (foundTarget) break;
    }

    if (foundTarget !== hoveredObject) {
      hoveredObject = foundTarget;
      renderer.domElement.style.cursor = hoveredObject ? 'pointer' : 'default';
    }
  }

  function onClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let clickedTarget = null;

    for (let hit of intersects) {
      let obj = hit.object;
      while (obj && obj !== scene) {
        if (
          obj.userData.isZone ||
          obj.userData.isSensor ||
          obj.userData.isPipelineNode ||
          obj.userData.isInteractive
        ) {
          clickedTarget = obj;
          break;
        }
        obj = obj.parent;
      }
      if (clickedTarget) break;
    }

    if (clickedTarget) {
      const uData = clickedTarget.userData;

      if (uData.isZone) {
        onSelectObject({ type: 'ZONE', id: uData.zoneId });
        focusOnZone(uData.zoneId, sceneSetup);
      } else if (uData.isSensor) {
        onSelectObject({ type: 'SENSOR', id: uData.id, data: uData });
      } else if (uData.isPipelineNode) {
        onSelectObject({ type: 'PIPELINE_NODE', id: uData.nodeId });
        focusOnPipelineNode(uData.nodeId, sceneSetup);
      }
    }
  }

  // Camera smooth focus presets
  function focusOnZone(zoneId, setup) {
    const focusPresets = {
      ZONE_A: { cam: new THREE.Vector3(-17.5, 14.0, 3.0), target: new THREE.Vector3(-17.5, 0.0, -9.0) },
      ZONE_B: { cam: new THREE.Vector3(-2.5, 14.0, 3.0), target: new THREE.Vector3(-2.5, 0.0, -9.0) },
      ZONE_C: { cam: new THREE.Vector3(-17.5, 14.0, 20.0), target: new THREE.Vector3(-17.5, 0.0, 8.5) },
      ZONE_D: { cam: new THREE.Vector3(-2.5, 14.0, 20.0), target: new THREE.Vector3(-2.5, 0.0, 8.5) }
    };

    const target = focusPresets[zoneId];
    if (target) {
      setup.animateCameraTo(target.cam, target.target, 1000);
    }
  }

  function focusOnPipelineNode(nodeId, setup) {
    const focusPresets = {
      HDFS: { cam: new THREE.Vector3(17, 10.0, -2.0), target: new THREE.Vector3(17, 0.0, -11.0) },
      MAPREDUCE: { cam: new THREE.Vector3(17, 10.0, 9.0), target: new THREE.Vector3(17, 0.0, 0.0) },
      STREAM_PROCESSING: { cam: new THREE.Vector3(17, 10.0, 20.0), target: new THREE.Vector3(17, 0.0, 11.0) },
      DASHBOARD: { cam: new THREE.Vector3(-1, 10.0, 31.0), target: new THREE.Vector3(-1, 0.0, 24.0) }
    };

    const target = focusPresets[nodeId];
    if (target) {
      setup.animateCameraTo(target.cam, target.target, 1000);
    }
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', onClick);

  return {
    focusOnZone: (zoneId) => focusOnZone(zoneId, sceneSetup),
    focusOnPipelineNode: (nodeId) => focusOnPipelineNode(nodeId, sceneSetup)
  };
}
