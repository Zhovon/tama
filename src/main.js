import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

/* ==========================================================================
   LUSION-CALIBER MOUNTAIN HAVEN ENGINE
   - Physically based Atmospheric Sky (Rayleigh & Mie Scattering)
   - Multi-Octave Fractal Ridge Mountain Terrain with Slope-Adaptive Shading
   - Solitary Timber Cabin with Volumetric Window Glow & Smoke Drift
   - Fluid Inertial Camera Drone Navigation (Touch & Pointer Damping)
   ========================================================================== */

const canvas = document.getElementById('webgl-canvas');
const loader = document.getElementById('loader');

// Scene, Camera & Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.5, 2000);
camera.position.set(0, 24, 75);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

// Mobile optimization for Redmi Note (Adreno 610)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* ==========================================================================
   1. Physically Based Atmospheric Sky Shader (Rayleigh & Mie Scattering)
   ========================================================================== */
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 8.5;
skyUniforms['rayleigh'].value = 2.8;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.82;

const sun = new THREE.Vector3();
const moon = new THREE.Vector3();

// Directional Sun & Moon Lights
const sunLight = new THREE.DirectionalLight(0xfffaec, 1.6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 250;
sunLight.shadow.camera.left = -40;
sunLight.shadow.camera.right = 40;
sunLight.shadow.camera.top = 40;
sunLight.shadow.camera.bottom = -40;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const moonLight = new THREE.DirectionalLight(0x769bc9, 0.4);
scene.add(moonLight);

const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x1a2e22, 0.65);
scene.add(hemiLight);

// Exponential Atmospheric Fog
scene.fog = new THREE.FogExp2(0x9cb8cc, 0.008);

/* ==========================================================================
   2. Multi-Octave Fractal Terrain (fBm) with Slope-Adaptive Shading
   ========================================================================== */
const terrainWidth = 260;
const terrainDepth = 260;
const segments = 128; // Balanced for 60FPS on mobile Adreno 610

const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, segments, segments);
terrainGeo.rotateX(-Math.PI / 2);

// Multi-octave ridge noise function
function ridgeNoise(x, z) {
  let elevation = 0;
  // Low-frequency mountain mass
  elevation += Math.sin(x * 0.025) * Math.cos(z * 0.025) * 22;
  // Mid-frequency sharp ridge carving
  elevation += (1.0 - Math.abs(Math.sin(x * 0.065 + z * 0.045))) * 12;
  // Micro rock harmonics
  elevation += Math.sin(x * 0.14) * Math.cos(z * 0.12) * 3.5;
  return elevation;
}

const posAttr = terrainGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  const dist = Math.sqrt(x * x + z * z);

  if (dist < 18) {
    // Smooth valley plateau for the cabin
    posAttr.setY(i, Math.sin(x * 0.1) * 0.4);
  } else {
    const rawElev = ridgeNoise(x, z);
    // Ridge bowl envelope
    const bowl = Math.pow(dist / 65, 2.2) * 7.5;
    posAttr.setY(i, Math.max(-2, rawElev + bowl));
  }
}
terrainGeo.computeVertexNormals();

// Slope-Adaptive Vertex Coloring
// Flat surfaces = lush alpine moss & grass; Steep cliff faces = dark granite rock
const colors = new Float32Array(posAttr.count * 3);
const normals = terrainGeo.attributes.normal;

const grassColor = new THREE.Color(0x223d2b); // Alpine forest grass
const rockColor = new THREE.Color(0x2d2b28);  // Granite cliff
const highPeakColor = new THREE.Color(0x3e3c38); // Alpine ridge peak

for (let i = 0; i < posAttr.count; i++) {
  const ny = normals.getY(i);
  const y = posAttr.getY(i);

  let vertexColor = new THREE.Color();

  if (ny > 0.82) {
    // Flat ground / valley
    vertexColor.copy(grassColor);
    // Subtle variation
    vertexColor.offsetHSL((Math.random() - 0.5) * 0.03, 0, (Math.random() - 0.5) * 0.04);
  } else if (ny > 0.6) {
    // Intermediate slope
    const factor = (ny - 0.6) / 0.22;
    vertexColor.lerpColors(rockColor, grassColor, factor);
  } else {
    // Steep rock cliff
    vertexColor.copy(rockColor);
    if (y > 18) {
      vertexColor.lerp(highPeakColor, 0.5);
    }
  }

  colors[i * 3] = vertexColor.r;
  colors[i * 3 + 1] = vertexColor.g;
  colors[i * 3 + 2] = vertexColor.b;
}

terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const terrainMat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.85,
  metalness: 0.12,
  flatShading: true
});

const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
terrainMesh.receiveShadow = true;
scene.add(terrainMesh);

/* ==========================================================================
   3. The Solitary Timber Cabin / Mountain House
   ========================================================================== */
const cabinGroup = new THREE.Group();

// Dark Weathered Cedar Walls
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.85 });
const cabinWalls = new THREE.Mesh(new THREE.BoxGeometry(9.2, 5.2, 6.8), woodMat);
cabinWalls.position.y = 2.6;
cabinWalls.castShadow = true;
cabinWalls.receiveShadow = true;
cabinGroup.add(cabinWalls);

// Pitched Alpine Roof with Overhanging Eaves
const slateMat = new THREE.MeshStandardMaterial({ color: 0x1d1815, roughness: 0.65 });
const roofGeo = new THREE.ConeGeometry(7.6, 3.8, 4);
roofGeo.rotateY(Math.PI / 4);
const roof = new THREE.Mesh(roofGeo, slateMat);
roof.position.y = 6.6;
roof.scale.set(1.08, 1, 1.28);
roof.castShadow = true;
cabinGroup.add(roof);

// Stone Chimney with Rising Smoke
const chimney = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 5.0, 1.2),
  new THREE.MeshStandardMaterial({ color: 0x2e2c29, roughness: 0.95 })
);
chimney.position.set(2.8, 6.0, -1.6);
chimney.castShadow = true;
cabinGroup.add(chimney);

// Glowing Warm Amber Windows (Emissive Material)
const windowMat = new THREE.MeshStandardMaterial({
  color: 0x221810,
  emissive: 0xffa844,
  emissiveIntensity: 0.8,
  roughness: 0.2
});

const win1 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), windowMat);
win1.position.set(-2.0, 2.7, 3.42);
const win2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), windowMat);
win2.position.set(2.0, 2.7, 3.42);
cabinGroup.add(win1, win2);

// Interior Point Light (Spills warm amber light outside)
const cabinLight = new THREE.PointLight(0xffa844, 1.2, 28);
cabinLight.position.set(0, 3.2, 1.5);
cabinGroup.add(cabinLight);

// Front Porch Deck
const porchMat = new THREE.MeshStandardMaterial({ color: 0x483224, roughness: 0.85 });
const porch = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.45, 4.4), porchMat);
porch.position.set(0, 0.22, 5.2);
porch.receiveShadow = true;
cabinGroup.add(porch);

// Porch Table
const table = new THREE.Mesh(
  new THREE.CylinderGeometry(1.1, 1.1, 1.3, 16),
  new THREE.MeshStandardMaterial({ color: 0x302117, roughness: 0.9 })
);
table.position.set(0, 0.95, 5.4);
cabinGroup.add(table);

// Steaming Clay Cup of Hot Dudh Cha ☕
const cup = new THREE.Mesh(
  new THREE.CylinderGeometry(0.26, 0.18, 0.5, 20),
  new THREE.MeshStandardMaterial({ color: 0x9e5335, roughness: 0.95 })
);
cup.position.set(0, 1.8, 5.4);
cabinGroup.add(cup);

const liquid = new THREE.Mesh(
  new THREE.CircleGeometry(0.24, 20),
  new THREE.MeshBasicMaterial({ color: 0xd8a16c })
);
liquid.rotateX(-Math.PI / 2);
liquid.position.set(0, 2.03, 5.4);
cabinGroup.add(liquid);

cabinGroup.position.set(0, 0, 0);
scene.add(cabinGroup);

/* ==========================================================================
   4. Atmospheric Smoke & Steam Particles
   ========================================================================== */
// Chimney Smoke Particles
const smokeCount = 40;
const smokeGeo = new THREE.BufferGeometry();
const smokePos = new Float32Array(smokeCount * 3);
const smokeData = [];

for (let i = 0; i < smokeCount; i++) {
  smokePos[i * 3] = 2.8 + (Math.random() - 0.5) * 0.4;
  smokePos[i * 3 + 1] = 8.5 + Math.random() * 4.5;
  smokePos[i * 3 + 2] = -1.6 + (Math.random() - 0.5) * 0.4;
  smokeData.push({
    baseY: 8.5,
    speedY: 0.025 + Math.random() * 0.02,
    driftX: 0.015 + (Math.random() - 0.5) * 0.01,
    driftZ: (Math.random() - 0.5) * 0.015
  });
}
smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
const smokeMat = new THREE.PointsMaterial({
  color: 0xdddddd,
  size: 1.4,
  transparent: true,
  opacity: 0.3
});
const smoke = new THREE.Points(smokeGeo, smokeMat);
scene.add(smoke);

// Dudh Cha Steam Particles
const steamCount = 18;
const steamGeo = new THREE.BufferGeometry();
const steamPos = new Float32Array(steamCount * 3);
const steamData = [];

for (let i = 0; i < steamCount; i++) {
  steamPos[i * 3] = (Math.random() - 0.5) * 0.2;
  steamPos[i * 3 + 1] = 2.0 + Math.random() * 1.5;
  steamPos[i * 3 + 2] = 5.4 + (Math.random() - 0.5) * 0.2;
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
   5. Alpine Pine Trees & Garden Flowers (Instanced)
   ========================================================================== */
// Pine Trees
const treeCount = 95;
const treeGeo = new THREE.ConeGeometry(1.8, 5.6, 6);
const treeMat = new THREE.MeshStandardMaterial({
  color: 0x162c20,
  roughness: 0.9,
  flatShading: true
});
const treeInstanced = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
treeInstanced.castShadow = true;

const dummy = new THREE.Object3D();
for (let i = 0; i < treeCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const rad = 17 + Math.random() * 75;
  const x = Math.cos(angle) * rad;
  const z = Math.sin(angle) * rad;
  const dist = Math.sqrt(x * x + z * z);
  const y = Math.pow(dist / 65, 2.2) * 7.5 + ridgeNoise(x, z);

  dummy.position.set(x, y + 2.7, z);
  const s = 0.7 + Math.random() * 0.75;
  dummy.scale.set(s, s * (0.9 + Math.random() * 0.4), s);
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.updateMatrix();
  treeInstanced.setMatrixAt(i, dummy.matrix);
}
treeInstanced.instanceMatrix.needsUpdate = true;
scene.add(treeInstanced);

// Front Yard Sunflowers 🌻
const sfCount = 30;
const sfGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 10);
const sfMat = new THREE.MeshStandardMaterial({ color: 0xf5b525, roughness: 0.4 });
const sfMesh = new THREE.InstancedMesh(sfGeo, sfMat, sfCount);

for (let i = 0; i < sfCount; i++) {
  const x = (Math.random() - 0.5) * 12 + (i % 2 === 0 ? 6.2 : -6.2);
  const z = 7.2 + Math.random() * 5.0;
  dummy.position.set(x, 1.3, z);
  dummy.rotation.x = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
  dummy.rotation.y = (Math.random() - 0.5) * 0.4;
  const s = 0.8 + Math.random() * 0.5;
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  sfMesh.setMatrixAt(i, dummy.matrix);
}
sfMesh.instanceMatrix.needsUpdate = true;
scene.add(sfMesh);

// Front Yard Wild Roses 🌹
const roseCount = 26;
const roseGeo = new THREE.SphereGeometry(0.28, 8, 8);
const roseMat = new THREE.MeshStandardMaterial({ color: 0xd43f4a, roughness: 0.5 });
const roseMesh = new THREE.InstancedMesh(roseGeo, roseMat, roseCount);

for (let i = 0; i < roseCount; i++) {
  const x = (Math.random() - 0.5) * 9 + (i % 2 === 0 ? 4.8 : -4.8);
  const z = 6.0 + Math.random() * 3.5;
  dummy.position.set(x, 0.7, z);
  const s = 0.8 + Math.random() * 0.5;
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  roseMesh.setMatrixAt(i, dummy.matrix);
}
roseMesh.instanceMatrix.needsUpdate = true;
scene.add(roseMesh);

/* ==========================================================================
   6. Real-Time Sun & Sky Solar Cycle
   ========================================================================== */
function updateSunPosition() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  
  // Calculate realistic sun elevation (-90 to +90 degrees)
  // Sunrise ~ 06:00, Peak ~ 12:00, Sunset ~ 18:00
  const solarAngle = (hours - 6) / 12 * Math.PI;
  const elevation = Math.sin(solarAngle) * 55; // Up to 55 degrees high
  const azimuth = 180 + Math.cos(solarAngle) * 75; // East to West arc

  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);

  sun.setFromSphericalCoords(1, phi, theta);
  skyUniforms['sunPosition'].value.copy(sun);

  sunLight.position.copy(sun).multiplyScalar(150);

  // Dynamic light coloring based on sun height
  if (elevation > 15) {
    // Crisp Day
    sunLight.intensity = 1.6;
    sunLight.color.setHex(0xfffaec);
    renderer.toneMappingExposure = 1.05;
    scene.fog.color.setHex(0x9cb8cc);
    windowMat.emissiveIntensity = 0.2;
    cabinLight.intensity = 0.3;
  } else if (elevation > -5) {
    // Golden Hour / Sunset
    sunLight.intensity = 1.2;
    sunLight.color.setHex(0xff9a55);
    renderer.toneMappingExposure = 1.15;
    scene.fog.color.setHex(0x73483b);
    windowMat.emissiveIntensity = 1.6;
    cabinLight.intensity = 1.8;
  } else {
    // Night / Twilight
    sunLight.intensity = 0.05;
    renderer.toneMappingExposure = 0.85;
    scene.fog.color.setHex(0x0a1218);
    windowMat.emissiveIntensity = 3.2;
    cabinLight.intensity = 2.4;
  }
}
updateSunPosition();

/* ==========================================================================
   7. Smooth Inertial Drone Orbit Navigation (Mouse & Touch)
   ========================================================================== */
const orbitState = {
  spherical: new THREE.Spherical(75, Math.PI / 3, 0),
  sphericalTarget: new THREE.Spherical(75, Math.PI / 3, 0),
  center: new THREE.Vector3(0, 3, 0),
  isDragging: false,
  prevPointer: { x: 0, y: 0 }
};

function onPointerDown(e) {
  orbitState.isDragging = true;
  orbitState.prevPointer.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  orbitState.prevPointer.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
}

function onPointerMove(e) {
  if (!orbitState.isDragging) return;

  const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
  const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

  const deltaX = clientX - orbitState.prevPointer.x;
  const deltaY = clientY - orbitState.prevPointer.y;

  orbitState.prevPointer.x = clientX;
  orbitState.prevPointer.y = clientY;

  // Inertial target update
  orbitState.sphericalTarget.theta -= deltaX * 0.005;
  orbitState.sphericalTarget.phi = Math.max(
    0.15,
    Math.min(Math.PI / 2 - 0.05, orbitState.sphericalTarget.phi - deltaY * 0.005)
  );
}

function onPointerUp() {
  orbitState.isDragging = false;
}

function onWheel(e) {
  orbitState.sphericalTarget.radius = Math.max(
    14,
    Math.min(130, orbitState.sphericalTarget.radius + e.deltaY * 0.06)
  );
}

window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

window.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onPointerUp);
window.addEventListener('wheel', onWheel, { passive: true });

/* ==========================================================================
   8. Animation Render Loop
   ========================================================================== */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Inertial smooth camera lerp (Damping)
  orbitState.spherical.theta += (orbitState.sphericalTarget.theta - orbitState.spherical.theta) * 0.06;
  orbitState.spherical.phi += (orbitState.sphericalTarget.phi - orbitState.spherical.phi) * 0.06;
  orbitState.spherical.radius += (orbitState.sphericalTarget.radius - orbitState.spherical.radius) * 0.06;

  // Auto slow panoramic drone drift when not dragging
  if (!orbitState.isDragging) {
    orbitState.sphericalTarget.theta += 0.0006;
  }

  camera.position.setFromSpherical(orbitState.spherical).add(orbitState.center);
  camera.lookAt(orbitState.center);

  // Animate chimney smoke particles
  const smPos = smokeGeo.attributes.position.array;
  for (let i = 0; i < smokeCount; i++) {
    const d = smokeData[i];
    smPos[i * 3 + 1] += d.speedY;
    smPos[i * 3] += d.driftX;
    smPos[i * 3 + 2] += d.driftZ;
    if (smPos[i * 3 + 1] > 15.0) {
      smPos[i * 3 + 1] = d.baseY;
      smPos[i * 3] = 2.8 + (Math.random() - 0.5) * 0.4;
      smPos[i * 3 + 2] = -1.6 + (Math.random() - 0.5) * 0.4;
    }
  }
  smokeGeo.attributes.position.needsUpdate = true;

  // Animate Dudh Cha steam
  const stPos = steamGeo.attributes.position.array;
  for (let i = 0; i < steamCount; i++) {
    const d = steamData[i];
    stPos[i * 3 + 1] += d.speedY;
    if (stPos[i * 3 + 1] > 3.8) {
      stPos[i * 3 + 1] = d.baseY;
      stPos[i * 3] = (Math.random() - 0.5) * 0.2;
      stPos[i * 3 + 2] = 5.4 + (Math.random() - 0.5) * 0.2;
    }
  }
  steamGeo.attributes.position.needsUpdate = true;

  // Gentle flower sway
  sfMesh.rotation.y = Math.sin(time * 1.5) * 0.06;
  roseMesh.rotation.y = Math.cos(time * 1.7) * 0.05;

  renderer.render(scene, camera);
}
animate();

// Hide loader when scene is ready
window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 300);
});

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});
