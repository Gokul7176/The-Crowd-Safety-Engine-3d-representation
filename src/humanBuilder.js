import * as THREE from 'three';

// Realistic palette for civilian clothing (muted, realistic street attire)
const CLOTHING_COLORS = [
  0x1e293b, // Dark Charcoal Coat
  0x334155, // Navy Blue Jacket
  0x475569, // Slate Gray Suit
  0x0f172a, // Black Parka
  0x78350f, // Brown Leather Jacket
  0x1e3a8a, // Denim Blue
  0x365314, // Olive Green Coat
  0x701a75, // Deep Plum Sweater
  0x854d0e, // Tan Trenchcoat
  0x52525b  // Muted Ash Gray
];

const TROUSER_COLORS = [
  0x0f172a, // Black
  0x1e293b, // Dark Navy
  0x334155, // Blue Jeans
  0x475569, // Charcoal Gray
  0x78350f, // Khaki Brown
  0x27272a  // Dark Denim
];

const SKIN_TONES = [
  0xf87171, 0xfb923c, 0xfcd34d, 0xd97706, 0xb45309, 0x78350f
];

const HAIR_COLORS = [
  0x0f172a, 0x1e1b4b, 0x451a03, 0x78350f, 0x9a3412, 0xd97706
];

// Cache geometry primitives for high performance
const headGeo = new THREE.SphereGeometry(0.13, 8, 8);
const torsoGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.65, 8);
const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.7, 6);
const armGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.6, 6);
const bagGeo = new THREE.BoxGeometry(0.16, 0.22, 0.1);

// Generate a single human mesh group with realistic proportions & random variations
export function createHumanFigure(variationId = 0) {
  const humanGroup = new THREE.Group();

  // Randomize attributes based on seed / variation
  const colorIdx = (variationId * 3) % CLOTHING_COLORS.length;
  const trouserIdx = (variationId * 5) % TROUSER_COLORS.length;
  const skinIdx = (variationId * 7) % SKIN_TONES.length;
  const hairIdx = (variationId * 11) % HAIR_COLORS.length;
  const hasBag = (variationId % 3 === 0);

  const torsoColor = CLOTHING_COLORS[colorIdx];
  const legColor = TROUSER_COLORS[trouserIdx];
  const skinColor = SKIN_TONES[skinIdx];
  const hairColor = HAIR_COLORS[hairIdx];

  const torsoMat = new THREE.MeshStandardMaterial({ color: torsoColor, roughness: 0.7, metalness: 0.1 });
  const legMat = new THREE.MeshStandardMaterial({ color: legColor, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });
  const bagMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

  // 1. Legs
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.09, 0.35, 0);
  leftLeg.castShadow = true;
  humanGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.09, 0.35, 0);
  rightLeg.castShadow = true;
  humanGroup.add(rightLeg);

  // 2. Torso
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.set(0, 1.0, 0);
  torso.castShadow = true;
  humanGroup.add(torso);

  // 3. Arms
  const leftArm = new THREE.Mesh(armGeo, skinMat);
  leftArm.position.set(-0.24, 0.95, 0);
  leftArm.rotation.z = 0.1;
  leftArm.castShadow = true;
  humanGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, skinMat);
  rightArm.position.set(0.24, 0.95, 0);
  rightArm.rotation.z = -0.1;
  rightArm.castShadow = true;
  humanGroup.add(rightArm);

  // 4. Head & Hair
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 1.45, 0);
  head.castShadow = true;
  humanGroup.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), hairMat);
  hair.position.set(0, 1.48, -0.02);
  hair.scale.set(1.02, 0.8, 1.02);
  humanGroup.add(hair);

  // 5. Backpack or Shoulder bag detail
  if (hasBag) {
    const bag = new THREE.Mesh(bagGeo, bagMat);
    bag.position.set(0, 1.0, -0.16);
    bag.castShadow = true;
    humanGroup.add(bag);
  }

  // Scale variation (height range 1.55m to 1.85m)
  const scaleY = 0.9 + (variationId % 10) * 0.025;
  const scaleXZ = 0.88 + (variationId % 7) * 0.03;
  humanGroup.scale.set(scaleXZ, scaleY, scaleXZ);

  // Save reference to limb parts for simple walking animation
  humanGroup.userData = {
    leftLeg, rightLeg, leftArm, rightArm,
    walkOffset: variationId * 0.7,
    speed: 0.4 + (variationId % 5) * 0.1,
    targetZone: null,
    inBottleneck: false
  };

  return humanGroup;
}

// Generate Crowd Clusters for the 4 zones according to density specs
export function populateVenueCrowd(scene, zoneBounds) {
  const crowdMembers = [];

  // Helper to generate random position inside zone box
  function getRandomPosInZone(bounds, margin = 0.8) {
    const x = bounds.minX + margin + Math.random() * (bounds.maxX - bounds.minX - 2 * margin);
    const z = bounds.minZ + margin + Math.random() * (bounds.maxZ - bounds.minZ - 2 * margin);
    return new THREE.Vector3(x, 0, z);
  }

  let varId = 1;

  // ZONE A (NORMAL): Low / Normal density (~18 people)
  for (let i = 0; i < 18; i++) {
    const human = createHumanFigure(varId++);
    const pos = getRandomPosInZone(zoneBounds.ZONE_A);
    human.position.copy(pos);
    human.rotation.y = Math.random() * Math.PI * 2;
    human.userData.zoneId = 'ZONE_A';
    scene.add(human);
    crowdMembers.push(human);
  }

  // ZONE B (HIGH): Moderately dense (~52 people)
  for (let i = 0; i < 52; i++) {
    const human = createHumanFigure(varId++);
    const pos = getRandomPosInZone(zoneBounds.ZONE_B);
    human.position.copy(pos);
    // Orient slightly towards exit/concourse
    human.rotation.y = (Math.random() - 0.5) * 1.5 + Math.PI / 2;
    human.userData.zoneId = 'ZONE_B';
    scene.add(human);
    crowdMembers.push(human);
  }

  // ZONE C (NORMAL): Normal density (~22 people)
  for (let i = 0; i < 22; i++) {
    const human = createHumanFigure(varId++);
    const pos = getRandomPosInZone(zoneBounds.ZONE_C);
    human.position.copy(pos);
    human.rotation.y = Math.random() * Math.PI * 2;
    human.userData.zoneId = 'ZONE_C';
    scene.add(human);
    crowdMembers.push(human);
  }

  // ZONE D (CRITICAL): Very dense / severe congestion (~86 people packed tight at main exit turnstiles)
  for (let i = 0; i < 86; i++) {
    const human = createHumanFigure(varId++);
    // Gridlock clustering towards turnstile exit (Z: 14 to 22, X: 4 to 12)
    const pos = getRandomPosInZone(zoneBounds.ZONE_D, 0.4);
    human.position.copy(pos);
    // Facing turnstile exit gate
    human.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
    human.userData.zoneId = 'ZONE_D';
    human.userData.inBottleneck = true;
    scene.add(human);
    crowdMembers.push(human);
  }

  return crowdMembers;
}

// Animate subtle walking motion for simulation
export function updateCrowdAnimation(crowdMembers, clockTime, isSimulating) {
  crowdMembers.forEach((human) => {
    const uData = human.userData;
    
    if (isSimulating) {
      // Walking leg swing & arm swing
      const speedMult = uData.inBottleneck ? 0.15 : uData.speed;
      const swing = Math.sin(clockTime * 6 * speedMult + uData.walkOffset) * 0.35;
      
      uData.leftLeg.rotation.x = swing;
      uData.rightLeg.rotation.x = -swing;
      uData.leftArm.rotation.x = -swing * 0.8;
      uData.rightArm.rotation.x = swing * 0.8;

      // Subtle forward drift
      if (!uData.inBottleneck) {
        human.position.x += Math.sin(human.rotation.y) * 0.015 * speedMult;
        human.position.z += Math.cos(human.rotation.y) * 0.015 * speedMult;
      } else {
        // Shuffling motion in congested Zone D
        human.position.x += Math.sin(clockTime * 2 + uData.walkOffset) * 0.003;
        human.position.z += Math.cos(clockTime * 2 + uData.walkOffset) * 0.003;
      }
    } else {
      // Idle standing posture
      uData.leftLeg.rotation.x = 0;
      uData.rightLeg.rotation.x = 0;
      uData.leftArm.rotation.x = 0;
      uData.rightArm.rotation.x = 0;
    }
  });
}
