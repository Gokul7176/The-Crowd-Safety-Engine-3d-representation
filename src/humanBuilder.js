import * as THREE from 'three';

// Realistic palette for civilian clothing (muted, realistic street attire)
const CLOTHING_COLORS = [
  0x1e293b, 0x334155, 0x475569, 0x0f172a, 0x78350f, 0x1e3a8a, 0x365314, 0x701a75, 0x854d0e, 0x52525b
];

const TROUSER_COLORS = [
  0x0f172a, 0x1e293b, 0x334155, 0x475569, 0x78350f, 0x27272a
];

const SKIN_TONES = [
  0xf87171, 0xfb923c, 0xfcd34d, 0xd97706, 0xb45309, 0x78350f
];

const HAIR_COLORS = [
  0x0f172a, 0x1e1b4b, 0x451a03, 0x78350f, 0x9a3412, 0xd97706
];

// Cache geometry primitives
const headGeo = new THREE.SphereGeometry(0.13, 8, 8);
const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.65, 8);
const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.7, 6);
const armGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6);
const bagGeo = new THREE.BoxGeometry(0.16, 0.22, 0.1);

// Waypoint Graph for Safe Pedestrian Navigation
export const WAYPOINTS = {
  ZONE_A: new THREE.Vector3(-17.5, 0, -9),
  ZONE_B: new THREE.Vector3(-2.5, 0, -9),
  ZONE_C: new THREE.Vector3(-17.5, 0, 8.5),
  ZONE_D: new THREE.Vector3(-2.5, 0, 8.5),

  GATE3_EXIT: new THREE.Vector3(-9, 0, 15),
  WEST_EXIT: new THREE.Vector3(-22, 0, 15),
  MAIN_EXIT: new THREE.Vector3(-2.5, 0, 16.5)
};

// Array to store active Security Marshals in 3D
export const MARSHAL_MEMBERS = [];

// Generate a single human figure mesh group
export function createHumanFigure(variationId = 0) {
  const humanGroup = new THREE.Group();

  const colorIdx = (variationId * 3) % CLOTHING_COLORS.length;
  const trouserIdx = (variationId * 5) % TROUSER_COLORS.length;
  const skinIdx = (variationId * 7) % SKIN_TONES.length;
  const hairIdx = (variationId * 11) % HAIR_COLORS.length;
  const hasBag = (variationId % 3 === 0);

  const torsoMat = new THREE.MeshStandardMaterial({ color: CLOTHING_COLORS[colorIdx], roughness: 0.7 });
  const legMat = new THREE.MeshStandardMaterial({ color: TROUSER_COLORS[trouserIdx], roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: SKIN_TONES[skinIdx], roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: HAIR_COLORS[hairIdx], roughness: 0.9 });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  // Legs
  const leftLeg = new THREE.Mesh(legGeo, legMat); leftLeg.position.set(-0.09, 0.35, 0); leftLeg.castShadow = true; humanGroup.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, legMat); rightLeg.position.set(0.09, 0.35, 0); rightLeg.castShadow = true; humanGroup.add(rightLeg);

  // Torso
  const torso = new THREE.Mesh(torsoGeo, torsoMat); torso.position.set(0, 1.0, 0); torso.castShadow = true; humanGroup.add(torso);

  // Arms
  const leftArm = new THREE.Mesh(armGeo, skinMat); leftArm.position.set(-0.24, 0.95, 0); leftArm.rotation.z = 0.1; leftArm.castShadow = true; humanGroup.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, skinMat); rightArm.position.set(0.24, 0.95, 0); rightArm.rotation.z = -0.1; rightArm.castShadow = true; humanGroup.add(rightArm);

  // Head & Hair
  const head = new THREE.Mesh(headGeo, skinMat); head.position.set(0, 1.45, 0); head.castShadow = true; humanGroup.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), hairMat); hair.position.set(0, 1.48, -0.02); hair.scale.set(1.02, 0.8, 1.02); humanGroup.add(hair);

  if (hasBag) {
    const bag = new THREE.Mesh(bagGeo, bagMat); bag.position.set(0, 1.0, -0.16); bag.castShadow = true; humanGroup.add(bag);
  }

  const scaleY = 0.9 + (variationId % 10) * 0.025;
  const scaleXZ = 0.88 + (variationId % 7) * 0.03;
  humanGroup.scale.set(scaleXZ, scaleY, scaleXZ);

  humanGroup.userData = {
    leftLeg, rightLeg, leftArm, rightArm,
    walkOffset: variationId * 0.7,
    speed: 0.02 + (variationId % 5) * 0.005,
    zoneId: 'ZONE_A',
    behaviorState: 'IDLE', // 'IDLE', 'WALK', 'REROUTE_GATE3', 'REROUTE_WEST', 'MARSHAL_RESPONSE'
    inBottleneck: false
  };

  return humanGroup;
}

// Generate Security Marshal character with Hi-Vis Yellow Vest
export function createSecurityMarshal(variationId = 1) {
  const marshalGroup = new THREE.Group();

  const vestMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 }); // Hi-Vis Yellow
  const pantMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 }); // Security Navy
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.6 });

  const leftLeg = new THREE.Mesh(legGeo, pantMat); leftLeg.position.set(-0.09, 0.35, 0); marshalGroup.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, pantMat); rightLeg.position.set(0.09, 0.35, 0); marshalGroup.add(rightLeg);
  const torso = new THREE.Mesh(torsoGeo, vestMat); torso.position.set(0, 1.0, 0); marshalGroup.add(torso);
  const leftArm = new THREE.Mesh(armGeo, skinMat); leftArm.position.set(-0.24, 0.95, 0); marshalGroup.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo, skinMat); rightArm.position.set(0.24, 0.95, 0); marshalGroup.add(rightArm);
  const head = new THREE.Mesh(headGeo, skinMat); head.position.set(0, 1.45, 0); marshalGroup.add(head);

  // Security Cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8), pantMat);
  cap.position.set(0, 1.55, 0.03);
  marshalGroup.add(cap);

  marshalGroup.scale.set(1.0, 1.02, 1.0);
  marshalGroup.userData = {
    leftLeg, rightLeg, leftArm, rightArm,
    isMarshal: true,
    walkOffset: variationId * 0.5,
    speed: 0.015
  };

  return marshalGroup;
}

// Populate initial venue crowd matching simulationState
export function populateVenueCrowd(scene, zoneBounds, simulationState) {
  const crowdMembers = [];
  let varId = 1;

  function getRandomPosInZone(bounds, margin = 0.8) {
    const x = bounds.minX + margin + Math.random() * (bounds.maxX - bounds.minX - 2 * margin);
    const z = bounds.minZ + margin + Math.random() * (bounds.maxZ - bounds.minZ - 2 * margin);
    return new THREE.Vector3(x, 0, z);
  }

  const zoneIds = ['ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_D'];
  zoneIds.forEach(zId => {
    const targetCount = simulationState ? simulationState.zones[zId].count : (zId === 'ZONE_D' ? 86 : zId === 'ZONE_B' ? 52 : zId === 'ZONE_C' ? 22 : 18);
    const bounds = zoneBounds[zId];

    for (let i = 0; i < targetCount; i++) {
      const human = createHumanFigure(varId++);
      const pos = getRandomPosInZone(bounds, zId === 'ZONE_D' ? 0.4 : 0.8);
      human.position.copy(pos);
      human.rotation.y = (zId === 'ZONE_D') ? Math.PI / 2 + (Math.random() - 0.5) * 0.4 : Math.PI * 2 * Math.random();
      human.userData.zoneId = zId;
      human.userData.inBottleneck = (zId === 'ZONE_D');
      scene.add(human);
      crowdMembers.push(human);
    }
  });

  return crowdMembers;
}

// Sync 3D crowd mesh counts dynamically when count changes
export function syncCrowdDensityForZone(zoneId, targetCount, scene, crowdMembers, zoneBounds) {
  const existingInZone = crowdMembers.filter(h => h.userData.zoneId === zoneId && h.parent === scene);
  const currentCount = existingInZone.length;

  if (currentCount < targetCount) {
    // Spawn missing members inside zone
    const bounds = zoneBounds[zoneId] || { minX: -9, maxX: 4, minZ: 1, maxZ: 16 };
    const diff = targetCount - currentCount;
    for (let i = 0; i < diff; i++) {
      const human = createHumanFigure(crowdMembers.length + i + 100);
      const x = bounds.minX + 0.6 + Math.random() * (bounds.maxX - bounds.minX - 1.2);
      const z = bounds.minZ + 0.6 + Math.random() * (bounds.maxZ - bounds.minZ - 1.2);
      human.position.set(x, 0, z);
      human.userData.zoneId = zoneId;
      human.userData.inBottleneck = (zoneId === 'ZONE_D');
      scene.add(human);
      crowdMembers.push(human);
    }
  } else if (currentCount > targetCount) {
    // Remove excess members
    const diff = currentCount - targetCount;
    for (let i = 0; i < diff; i++) {
      const humanToRemove = existingInZone[i];
      scene.remove(humanToRemove);
      const idx = crowdMembers.indexOf(humanToRemove);
      if (idx !== -1) crowdMembers.splice(idx, 1);
    }
  }
}

// Animate subtle walking motion & localized intervention rerouting
export function updateCrowdAnimation(crowdMembers, clockTime, isSimulating, delta, simulationState, scene) {
  if (!crowdMembers) return;

  // 1. Check Marshals Spawn State
  if (simulationState && simulationState.interventions && simulationState.interventions.marshals) {
    if (MARSHAL_MEMBERS.length === 0 && scene) {
      const m1 = createSecurityMarshal(1); m1.position.set(-6, 0, 13); scene.add(m1); MARSHAL_MEMBERS.push(m1);
      const m2 = createSecurityMarshal(2); m2.position.set(0, 0, 13); scene.add(m2); MARSHAL_MEMBERS.push(m2);
      const m3 = createSecurityMarshal(3); m3.position.set(-3, 0, 11); scene.add(m3); MARSHAL_MEMBERS.push(m3);
    }
  } else if (MARSHAL_MEMBERS.length > 0 && scene) {
    MARSHAL_MEMBERS.forEach(m => scene.remove(m));
    MARSHAL_MEMBERS.length = 0;
  }

  // 2. Animate Marshals
  MARSHAL_MEMBERS.forEach(m => {
    const swing = Math.sin(clockTime * 4 + m.userData.walkOffset) * 0.25;
    m.userData.leftLeg.rotation.x = swing;
    m.userData.rightLeg.rotation.x = -swing;
  });

  // 3. Animate Pedestrians
  crowdMembers.forEach((human) => {
    const uData = human.userData;
    if (!uData.leftLeg) return;

    if (isSimulating) {
      const speedMult = uData.inBottleneck ? 0.2 : 0.8;
      const swing = Math.sin(clockTime * 6 * speedMult + uData.walkOffset) * 0.35;
      uData.leftLeg.rotation.x = swing;
      uData.rightLeg.rotation.x = -swing;
      uData.leftArm.rotation.x = -swing * 0.8;
      uData.rightArm.rotation.x = swing * 0.8;

      // Handle localized rerouting interventions ONLY for pedestrians in the selected zone
      if (simulationState && simulationState.interventions.gate3 && uData.zoneId === 'ZONE_D') {
        // Pedestrians in Zone D walk towards Gate 3 exit
        const target = WAYPOINTS.GATE3_EXIT;
        const dir = target.clone().sub(human.position); dir.y = 0;
        const dist = dir.length();
        if (dist > 0.5) {
          dir.normalize();
          human.rotation.y = Math.atan2(dir.x, dir.z);
          human.position.addScaledVector(dir, 0.025);
        } else {
          // Reached Gate 3 exit, reset position back to Platform
          human.position.set(-17.5 + (Math.random() - 0.5) * 4, 0, -10);
        }
      } else if (simulationState && simulationState.interventions.announcement && uData.zoneId === simulationState.selectedZone) {
        // Pedestrians in selected zone walk towards West Corridor exit
        const target = WAYPOINTS.WEST_EXIT;
        const dir = target.clone().sub(human.position); dir.y = 0;
        const dist = dir.length();
        if (dist > 0.5) {
          dir.normalize();
          human.rotation.y = Math.atan2(dir.x, dir.z);
          human.position.addScaledVector(dir, 0.025);
        }
      } else {
        // Normal subtle shuffling inside zone
        human.position.x += Math.sin(clockTime * 1.5 + uData.walkOffset) * 0.002;
        human.position.z += Math.cos(clockTime * 1.5 + uData.walkOffset) * 0.002;
      }
    } else {
      uData.leftLeg.rotation.x = 0; uData.rightLeg.rotation.x = 0;
      uData.leftArm.rotation.x = 0; uData.rightArm.rotation.x = 0;
    }
  });
}
