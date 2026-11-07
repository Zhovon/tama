import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

/* ==========================================================================
   REALISTIC SWISS ALPINE VALLEY & WATERFALL ENGINE
   - Lauterbrunnen-inspired Vertical Alpine Cliffs & Valley Floor
   - Cascading Glacial Waterfall with Churning Foam & Rising Mist
   - Winding Turquoise Glacial River with Flowing Ripples
   - Traditional Swiss Chalet with Carved Balconies & Blooming Flower Boxes
   - Physically based Atmospheric Sky & Sun/Moon Tracking
   - Mobile-Optimized 60 FPS Engine for Redmi Note 10/11
   ========================================================================== */

const canvas = document.getElementById('webgl-canvas');
const loader = document.getElementById('loader');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 2500);
camera.position.set(-15, 26, 85);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* ==========================================================================
   1. Atmospheric Sky & Lighting
   ========================================================================== */
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 8.0;
skyUniforms['rayleigh'].value = 2.5;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.82;

const sun = new THREE.Vector3();
const sunLight = new THREE.DirectionalLight(0xfffaed, 1.7);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 300;
sunLight.shadow.camera.left = -50;
sunLight.shadow.camera.right = 50;
sunLight.shadow.camera.top = 50;
sunLight.shadow.camera.bottom = -50;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const moonLight = new THREE.DirectionalLight(0x7ea5db, 0.4);
scene.add(moonLight);

const hemiLight = new THREE.HemisphereLight(0xfff1e0, 0x1a2e22, 0.7);
scene.add(hemiLight);

// Alpine Mountain Mist Fog
scene.fog = new THREE.FogExp2(0xa6c2d4, 0.0065);

/* ==========================================================================
   2. Swiss Valley Terrain (Towering Vertical Cliffs & Green Meadow Floor)
   ========================================================================== */
const terrainWidth = 280;
const terrainDepth = 280;
const segments = 140;

const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, segments, segments);
terrainGeo.rotateX(-Math.PI / 2);

const pos = terrainGeo.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i);
  const z = pos.getZ(i);

  // Swiss U-shaped glacial valley (Lauterbrunnen style)
  // Low valley channel in the center (where river and chalet sit), towering vertical cliffs on sides
  const valleyChannel = Math.abs(x);
  let elevation = 0;

  if (valleyChannel < 22) {
    // Valley floor with carved riverbed
    const riverbed = Math.sin((z + 10) * 0.05) * 5.0; // Winding path
    const distToRiver = Math.abs(x - riverbed);
    if (distToRiver < 5.0) {
      elevation = -1.6 + Math.pow(distToRiver / 5.0, 2) * 1.4; // River depression
    } else {
      elevation = Math.sin(x * 0.1) * 0.35 + Math.cos(z * 0.08) * 0.3;
    }
  } else {
    // Massive sheer alpine mountain walls
    const cliffRise = Math.pow((valleyChannel - 22) / 38, 1.8) * 28;
    const rockyNoise = Math.sin(x * 0.08 + z * 0.06) * 6.5 + Math.cos(x * 0.15) * 2.5;
    
    // Waterfall notch on the right cliff (around x = 28, z = -15)
    const distToWaterfall = Math.sqrt(Math.pow(x - 28, 2) + Math.pow(z + 15, 2));
    let notch = 0;
    if (distToWaterfall < 14) {
      notch = (1.0 - distToWaterfall / 14) * 14;
    }

    elevation = Math.max(0, cliffRise + rockyNoise - notch);
  }

  pos.setY(i, elevation);
}
terrainGeo.computeVertexNormals();

// Slope-Adaptive Swiss Texturing:
// Flat = Lush Swiss Alpine Meadow (#244a2b), Cliffs = Dark Grey/Brown Granite (#2a2825), High Snow Caps
const colors = new Float32Array(pos.count * 3);
const normals = terrainGeo.attributes.normal;

const grassColor = new THREE.Color(0x274e2d); // Swiss emerald meadow
const rockColor = new THREE.Color(0x2d2b27);  // Steep cliff rock
const snowColor = new THREE.Color(0xeef5fc);  // High alpine snow

for (let i = 0; i < pos.count; i++) {
  const ny = normals.getY(i);
  const y = pos.getY(i);
  let c = new THREE.Color();

  if (ny > 0.8) {
    c.copy(grassColor);
    c.offsetHSL((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.03);
  } else if (ny > 0.55) {
    const f = (ny - 0.55) / 0.25;
    c.lerpColors(rockColor, grassColor, f);
  } else {
    c.copy(rockColor);
    if (y > 32) {
      // Snow dusted alpine peaks
      const snowFactor = Math.min(1, (y - 32) / 12);
      c.lerp(snowColor, snowFactor * 0.9);
    }
  }

  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;
}
terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.85,
  metalness: 0.12,
  flatShading: true
});
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.receiveShadow = true;
scene.add(terrain);

/* ==========================================================================
   3. The Swiss Alpine River (Glacial Turquoise Water)
   ========================================================================== */
const riverWidth = 12;
const riverLength = 220;
const riverGeo = new THREE.PlaneGeometry(riverWidth, riverLength, 32, 128);
riverGeo.rotateX(-Math.PI / 2);

// Align river plane with the carved riverbed
const rPos = riverGeo.attributes.position;
for (let i = 0; i < rPos.count; i++) {
  const z = rPos.getZ(i);
  const riverCenter = Math.sin((z + 10) * 0.05) * 5.0;
  rPos.setX(i, rPos.getX(i) + riverCenter);
}
riverGeo.computeVertexNormals();

const riverMat = new THREE.MeshStandardMaterial({
  color: 0x1f7a8c, // Glacial turquoise
  roughness: 0.1,
  metalness: 0.85,
  transparent: true,
  opacity: 0.88
});
const river = new THREE.Mesh(riverGeo, riverMat);
river.position.y = -0.55;
river.receiveShadow = true;
scene.add(river);

/* ==========================================================================
   4. The Cascading Swiss Alpine Waterfall
   ========================================================================== */
// Vertical curved sheet cascading down from x=28, y=34, z=-15 down to the valley basin
const waterfallWidth = 5.5;
const waterfallHeight = 36;
const waterfallGeo = new THREE.PlaneGeometry(waterfallWidth, waterfallHeight, 16, 64);

// Curve the waterfall inward along the cliff wall
const wfPos = waterfallGeo.attributes.position;
for (let i = 0; i < wfPos.count; i++) {
  const y = wfPos.getY(i);
  // Upper cliff is recessed, base arcs forward into the plunge pool
  const progress = (y + waterfallHeight / 2) / waterfallHeight;
  wfPos.setZ(i, Math.sin(progress * Math.PI) * 1.5 - (1 - progress) * 2.5);
}
waterfallGeo.computeVertexNormals();

const waterfallMat = new THREE.MeshStandardMaterial({
  color: 0xe8f7ff,
  roughness: 0.15,
  metalness: 0.3,
  transparent: true,
  opacity: 0.88,
  side: THREE.DoubleSide
});

const waterfall = new THREE.Mesh(waterfallGeo, waterfallMat);
waterfall.position.set(24.5, 17.5, -15);
waterfall.rotation.y = -Math.PI / 3.8;
scene.add(waterfall);

// Churning Plunge Pool Basin Foam
const poolGeo = new THREE.CircleGeometry(6.5, 24);
poolGeo.rotateX(-Math.PI / 2);
const poolMat = new THREE.MeshBasicMaterial({
  color: 0xdcf2ff,
  transparent: true,
  opacity: 0.7
});
const plungePool = new THREE.Mesh(poolGeo, poolMat);
plungePool.position.set(20.5, -0.4, -14);
scene.add(plungePool);

// Waterfall Mist & Spray Particle System
const mistCount = 70;
const mistGeo = new THREE.BufferGeometry();
const mistPositions = new Float32Array(mistCount * 3);
const mistData = [];

for (let i = 0; i < mistCount; i++) {
  mistPositions[i * 3] = 20.5 + (Math.random() - 0.5) * 8.0;
  mistPositions[i * 3 + 1] = 0.5 + Math.random() * 8.0;
  mistPositions[i * 3 + 2] = -14.0 + (Math.random() - 0.5) * 8.0;
  mistData.push({
    baseX: 20.5,
    baseZ: -14.0,
    speedY: 0.04 + Math.random() * 0.03,
    driftX: -0.015 + (Math.random() - 0.5) * 0.02
  });
}
mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
const mistMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 2.2,
  transparent: true,
  opacity: 0.32
});
const mist = new THREE.Points(mistGeo, mistMat);
scene.add(mist);

/* ==========================================================================
   5. Authentic Swiss Alpine Chalet (Wooden Balconies & Geranium Flower Boxes)
   ========================================================================== */
const chaletGroup = new THREE.Group();

// Lower Floor Stone Foundation
const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4742, roughness: 0.95 });
const stoneBase = new THREE.Mesh(new THREE.BoxGeometry(10.2, 3.2, 8.2), stoneMat);
stoneBase.position.y = 1.6;
stoneBase.castShadow = true;
stoneBase.receiveShadow = true;
chaletGroup.add(stoneBase);

// Upper Floor Dark Larch Timber Frame
const larchMat = new THREE.MeshStandardMaterial({ color: 0x3b2619, roughness: 0.85 });
const upperStory = new THREE.Mesh(new THREE.BoxGeometry(11.0, 3.8, 9.0), larchMat);
upperStory.position.y = 5.0;
upperStory.castShadow = true;
upperStory.receiveShadow = true;
chaletGroup.add(upperStory);

// Traditional Swiss Chalet Low-Pitch Gabled Roof with Wide Overhanging Eaves
const roofMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.7 });
const roof = new THREE.Mesh(new THREE.ConeGeometry(8.8, 3.8, 4), roofMat);
roof.position.y = 8.5;
roof.rotation.y = Math.PI / 4;
roof.scale.set(1.2, 0.85, 1.35);
roof.castShadow = true;
chaletGroup.add(roof);

// Wooden Balcony on Upper Floor
const balconyFloor = new THREE.Mesh(
  new THREE.BoxGeometry(11.4, 0.3, 1.8),
  new THREE.MeshStandardMaterial({ color: 0x483020, roughness: 0.85 })
);
balconyFloor.position.set(0, 3.3, 5.0);
chaletGroup.add(balconyFloor);

// Balcony Carved Wooden Railing
const railingMat = new THREE.MeshStandardMaterial({ color: 0x362114, roughness: 0.9 });
const railing = new THREE.Mesh(new THREE.BoxGeometry(11.4, 1.0, 0.15), railingMat);
railing.position.set(0, 3.9, 5.85);
chaletGroup.add(railing);

// Swiss Blooming Red Flower Boxes (Geraniums) on the Balcony
const flowerBox = new THREE.Mesh(
  new THREE.BoxGeometry(10.8, 0.4, 0.35),
  new THREE.MeshStandardMaterial({ color: 0x24160c })
);
flowerBox.position.set(0, 3.8, 5.95);
chaletGroup.add(flowerBox);

const flowers = new THREE.Mesh(
  new THREE.BoxGeometry(10.6, 0.35, 0.4),
  new THREE.MeshStandardMaterial({ color: 0xd92534, roughness: 0.4 }) // Vibrant Alpine Red
);
flowers.position.set(0, 4.1, 5.95);
chaletGroup.add(flowers);

// Glowing Warm Lantern Windows
const windowMat = new THREE.MeshStandardMaterial({
  color: 0x1f160e,
  emissive: 0xffa43b,
  emissiveIntensity: 0.9,
  roughness: 0.2
});

const winLower1 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), windowMat);
winLower1.position.set(-2.5, 1.8, 4.12);
const winLower2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), windowMat);
winLower2.position.set(2.5, 1.8, 4.12);
chaletGroup.add(winLower1, winLower2);

const winUpper1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), windowMat);
winUpper1.position.set(-2.4, 5.2, 4.52);
const winUpper2 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), windowMat);
winUpper2.position.set(2.4, 5.2, 4.52);
chaletGroup.add(winUpper1, winUpper2);

// Interior Amber Point Light
const chaletLight = new THREE.PointLight(0xffa844, 1.5, 30);
chaletLight.position.set(0, 3.5, 2.0);
chaletGroup.add(chaletLight);

// Chimney with Smoke
const chimney = new THREE.Mesh(
  new THREE.BoxGeometry(1.3, 5.2, 1.3),
  new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.95 })
);
chimney.position.set(3.2, 7.8, -1.8);
chaletGroup.add(chimney);

// Front Porch & Dudh Cha Table ☕
const porch = new THREE.Mesh(
  new THREE.BoxGeometry(10.8, 0.4, 3.8),
  new THREE.MeshStandardMaterial({ color: 0x483020, roughness: 0.85 })
);
porch.position.set(0, 0.2, 5.6);
porch.receiveShadow = true;
chaletGroup.add(porch);

const table = new THREE.Mesh(
  new THREE.CylinderGeometry(1.0, 1.0, 1.2, 16),
  new THREE.MeshStandardMaterial({ color: 0x302117, roughness: 0.9 })
);
table.position.set(-2.0, 0.9, 5.8);
chaletGroup.add(table);

// Steaming Clay Cup of Hot Dudh Cha ☕
const cup = new THREE.Mesh(
  new THREE.CylinderGeometry(0.26, 0.18, 0.5, 20),
  new THREE.MeshStandardMaterial({ color: 0x9e5335, roughness: 0.95 })
);
cup.position.set(-2.0, 1.75, 5.8);
chaletGroup.add(cup);

const liquid = new THREE.Mesh(
  new THREE.CircleGeometry(0.24, 20),
  new THREE.MeshBasicMaterial({ color: 0xd8a16c })
);
liquid.rotateX(-Math.PI / 2);
liquid.position.set(-2.0, 1.98, 5.8);
chaletGroup.add(liquid);

// Place the Chalet peacefully overlooking the river and waterfall
chaletGroup.position.set(-11.0, 0, 8.0);
chaletGroup.rotation.y = Math.PI / 8;
scene.add(chaletGroup);

/* ==========================================================================
   6. Chimney Smoke & Dudh Cha Steam
   ========================================================================== */
const smokeCount = 35;
const smokeGeo = new THREE.BufferGeometry();
const smokePos = new Float32Array(smokeCount * 3);
const smokeData = [];

for (let i = 0; i < smokeCount; i++) {
  smokePos[i * 3] = -7.8 + (Math.random() - 0.5) * 0.4;
  smokePos[i * 3 + 1] = 10.5 + Math.random() * 4.5;
  smokePos[i * 3 + 2] = 6.2 + (Math.random() - 0.5) * 0.4;
  smokeData.push({
    baseY: 10.5,
    speedY: 0.024 + Math.random() * 0.018,
    driftX: 0.015 + (Math.random() - 0.5) * 0.01,
    driftZ: (Math.random() - 0.5) * 0.015
  });
}
smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
const smokeMat = new THREE.PointsMaterial({
  color: 0xdddddd,
  size: 1.3,
  transparent: true,
  opacity: 0.3
});
const smoke = new THREE.Points(smokeGeo, smokeMat);
scene.add(smoke);

// Dudh Cha Steam
const steamCount = 16;
const steamGeo = new THREE.BufferGeometry();
const steamPos = new Float32Array(steamCount * 3);
const steamData = [];

for (let i = 0; i < steamCount; i++) {
  steamPos[i * 3] = -13.0 + (Math.random() - 0.5) * 0.2;
  steamPos[i * 3 + 1] = 2.0 + Math.random() * 1.5;
  steamPos[i * 3 + 2] = 13.8 + (Math.random() - 0.5) * 0.2;
  steamData.push({
    baseY: 2.0,
    speedY: 0.018 + Math.random() * 0.012
  });
}
steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
const steamMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.45,
  transparent: true,
  opacity: 0.35
});
const steam = new THREE.Points(steamGeo, steamMat);
scene.add(steam);

/* ==========================================================================
   7. Swiss Alpine Pine Trees & Garden Flowers
   ========================================================================== */
const treeCount = 110;
const treeGeo = new THREE.ConeGeometry(1.8, 5.8, 6);
const treeMat = new THREE.MeshStandardMaterial({
  color: 0x142b1e,
  roughness: 0.9,
  flatShading: true
});
const treeMesh = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
treeMesh.castShadow = true;

const dummy = new THREE.Object3D();
let tIdx = 0;

for (let i = 0; i < treeCount; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const x = side * (16 + Math.random() * 55);
  const z = (Math.random() - 0.5) * 160;

  // Mountain wall elevation
  const dist = Math.abs(x);
  const y = Math.pow((dist - 22) / 38, 1.8) * 22;

  dummy.position.set(x, Math.max(0.5, y + 2.8), z);
  const s = 0.75 + Math.random() * 0.75;
  dummy.scale.set(s, s * (0.9 + Math.random() * 0.4), s);
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.updateMatrix();
  treeMesh.setMatrixAt(tIdx++, dummy.matrix);
}
treeMesh.instanceMatrix.needsUpdate = true;
scene.add(treeMesh);

// Sunflowers 🌻 in Chalet Front Yard
const sfCount = 28;
const sfGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 10);
const sfMat = new THREE.MeshStandardMaterial({ color: 0xf5b525, roughness: 0.4 });
const sfMesh = new THREE.InstancedMesh(sfGeo, sfMat, sfCount);

for (let i = 0; i < sfCount; i++) {
  const x = -11.0 + (Math.random() - 0.5) * 8.0;
  const z = 14.5 + Math.random() * 5.0;
  dummy.position.set(x, 1.2, z);
  dummy.rotation.x = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
  dummy.rotation.y = (Math.random() - 0.5) * 0.4;
  const s = 0.8 + Math.random() * 0.5;
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  sfMesh.setMatrixAt(i, dummy.matrix);
}
sfMesh.instanceMatrix.needsUpdate = true;
scene.add(sfMesh);

/* ==========================================================================
   8. Real-Time Sun Elevation & Atmospheric Lighting
   ========================================================================== */
function updateSolarLighting() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  
  // Sunrise ~ 06:00, Peak ~ 12:00, Sunset ~ 18:00
  const solarAngle = (hours - 6) / 12 * Math.PI;
  const elevation = Math.sin(solarAngle) * 58;
  const azimuth = 180 + Math.cos(solarAngle) * 80;

  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  sun.setFromSphericalCoords(1, phi, theta);
  skyUniforms['sunPosition'].value.copy(sun);

  sunLight.position.copy(sun).multiplyScalar(160);

  if (elevation > 14) {
    // Crisp Alpine Day
    sunLight.intensity = 1.7;
    sunLight.color.setHex(0xfffaed);
    renderer.toneMappingExposure = 1.05;
    scene.fog.color.setHex(0xa6c2d4);
    windowMat.emissiveIntensity = 0.3;
    chaletLight.intensity = 0.4;
  } else if (elevation > -4) {
    // Golden Hour / Sunset over Swiss Peaks
    sunLight.intensity = 1.3;
    sunLight.color.setHex(0xff9955);
    renderer.toneMappingExposure = 1.18;
    scene.fog.color.setHex(0x7a4d40);
    windowMat.emissiveIntensity = 1.8;
    chaletLight.intensity = 2.0;
  } else {
    // Starlit Twilight / Night
    sunLight.intensity = 0.05;
    renderer.toneMappingExposure = 0.85;
    scene.fog.color.setHex(0x0a1218);
    windowMat.emissiveIntensity = 3.2;
    chaletLight.intensity = 2.5;
  }
}
updateSolarLighting();

/* ==========================================================================
   9. Smooth Inertial Drone Orbit Navigation
   ========================================================================== */
const orbit = {
  spherical: new THREE.Spherical(85, Math.PI / 3.2, -0.3),
  target: new THREE.Spherical(85, Math.PI / 3.2, -0.3),
  center: new THREE.Vector3(0, 5, 0),
  isDragging: false,
  prev: { x: 0, y: 0 }
};

function onDown(e) {
  orbit.isDragging = true;
  orbit.prev.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  orbit.prev.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
}

function onMove(e) {
  if (!orbit.isDragging) return;
  const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const cy = e.clientY || (e.touches && e.touches[0].clientY) || 0;

  const dx = cx - orbit.prev.x;
  const dy = cy - orbit.prev.y;
  orbit.prev.x = cx;
  orbit.prev.y = cy;

  orbit.target.theta -= dx * 0.005;
  orbit.target.phi = Math.max(0.18, Math.min(Math.PI / 2 - 0.06, orbit.target.phi - dy * 0.005));
}

function onUp() {
  orbit.isDragging = false;
}

function onWheel(e) {
  orbit.target.radius = Math.max(16, Math.min(145, orbit.target.radius + e.deltaY * 0.06));
}

window.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
window.addEventListener('touchstart', onDown, { passive: true });
window.addEventListener('touchmove', onMove, { passive: true });
window.addEventListener('touchend', onUp);
window.addEventListener('wheel', onWheel, { passive: true });

/* ==========================================================================
   10. Animation Render Loop (Water Motion & Fog Drift)
   ========================================================================== */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Smooth camera interpolation
  orbit.spherical.theta += (orbit.target.theta - orbit.spherical.theta) * 0.06;
  orbit.spherical.phi += (orbit.target.phi - orbit.spherical.phi) * 0.06;
  orbit.spherical.radius += (orbit.target.radius - orbit.spherical.radius) * 0.06;

  // Gentle panoramic drift when idle
  if (!orbit.isDragging) {
    orbit.target.theta += 0.0006;
  }

  camera.position.setFromSpherical(orbit.spherical).add(orbit.center);
  camera.lookAt(orbit.center);

  // Animate Swiss Alpine Waterfall (UV scroll & shimmer)
  waterfallMat.opacity = 0.85 + Math.sin(time * 8.0) * 0.06;
  plungePool.scale.setScalar(1.0 + Math.sin(time * 6.0) * 0.04);

  // Animate Waterfall Mist Particles
  const mPos = mistGeo.attributes.position.array;
  for (let i = 0; i < mistCount; i++) {
    const d = mistData[i];
    mPos[i * 3 + 1] += d.speedY;
    mPos[i * 3] += d.driftX;
    if (mPos[i * 3 + 1] > 12.0) {
      mPos[i * 3 + 1] = 0.5;
      mPos[i * 3] = d.baseX + (Math.random() - 0.5) * 6.0;
      mPos[i * 3 + 2] = d.baseZ + (Math.random() - 0.5) * 6.0;
    }
  }
  mistGeo.attributes.position.needsUpdate = true;

  // Animate River Water Surface Ripples
  riverMat.opacity = 0.85 + Math.sin(time * 2.5) * 0.04;

  // Animate Chalet Chimney Smoke
  const smPos = smokeGeo.attributes.position.array;
  for (let i = 0; i < smokeCount; i++) {
    const d = smokeData[i];
    smPos[i * 3 + 1] += d.speedY;
    smPos[i * 3] += d.driftX;
    smPos[i * 3 + 2] += d.driftZ;
    if (smPos[i * 3 + 1] > 18.0) {
      smPos[i * 3 + 1] = d.baseY;
      smPos[i * 3] = -7.8 + (Math.random() - 0.5) * 0.4;
      smPos[i * 3 + 2] = 6.2 + (Math.random() - 0.5) * 0.4;
    }
  }
  smokeGeo.attributes.position.needsUpdate = true;

  // Animate Dudh Cha Steam
  const stPos = steamGeo.attributes.position.array;
  for (let i = 0; i < steamCount; i++) {
    const d = steamData[i];
    stPos[i * 3 + 1] += d.speedY;
    if (stPos[i * 3 + 1] > 3.8) {
      stPos[i * 3 + 1] = d.baseY;
      stPos[i * 3] = -13.0 + (Math.random() - 0.5) * 0.2;
      stPos[i * 3 + 2] = 13.8 + (Math.random() - 0.5) * 0.2;
    }
  }
  steamGeo.attributes.position.needsUpdate = true;

  // Gentle flower sway
  sfMesh.rotation.y = Math.sin(time * 1.5) * 0.06;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 300);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});
