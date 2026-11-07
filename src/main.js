import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from 'lenis';

/* ==========================================================================
   1. State & Device Tuning (Optimized for Redmi Note 10/11 - Adreno 610)
   ========================================================================== */
const canvas = document.getElementById('webgl-canvas');
const loader = document.getElementById('loader');
const timeSlider = document.getElementById('timeSlider');

const state = {
  timeProgress: 0.25, // 0 to 1 (0: Midnight, 0.25: Dawn, 0.5: Noon, 0.75: Sunset)
  isRealTime: true,
  audioPlaying: false,
  cameraTarget: new THREE.Vector3(0, 2, 0),
  activeModal: null
};

// Check actual local clock
function getRealTimeProgress() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return (hours + minutes / 60) / 24;
}
state.timeProgress = getRealTimeProgress();
timeSlider.value = state.timeProgress;

/* ==========================================================================
   2. Three.js Scene, Camera & Renderer
   ========================================================================== */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a1014, 0.015);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(0, 18, 45);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});

// Mobile optimization: Cap pixelRatio at 1.75 to prevent mobile GPU thermal throttling
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* ==========================================================================
   3. Dynamic Sky, Sun, Moon & Stars
   ========================================================================== */
// Sky Dome
const skyGeo = new THREE.SphereGeometry(300, 32, 16);
const skyMat = new THREE.MeshBasicMaterial({
  side: THREE.BackSide,
  color: 0x16252d
});
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);

// Starfield
const starCount = 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  const r = 280;
  starPos[i] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i + 1] = Math.abs(r * Math.cos(phi)) + 15; // Upper hemisphere
  starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.8,
  transparent: true,
  opacity: 0.8
});
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// Sun Mesh & Light
const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 160;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
scene.add(sunLight);

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(7, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffe899 })
);
scene.add(sunMesh);

// Moon Mesh & Light
const moonLight = new THREE.DirectionalLight(0x7ea8d9, 0.35);
moonLight.castShadow = false;
scene.add(moonLight);

const moonMesh = new THREE.Mesh(
  new THREE.SphereGeometry(5, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xeef5fc })
);
scene.add(moonMesh);

// Ambient Light
const hemiLight = new THREE.HemisphereLight(0xfff0dd, 0x1f2e27, 0.7);
scene.add(hemiLight);

// Window Glow PointLight inside Cottage
const houseLight = new THREE.PointLight(0xffaa44, 0, 20);
houseLight.position.set(0, 3, 0);
scene.add(houseLight);

/* ==========================================================================
   4. Procedural Mountain Terrain
   ========================================================================== */
const mountainGeo = new THREE.PlaneGeometry(160, 160, 48, 48);
mountainGeo.rotateX(-Math.PI / 2);

const posAttr = mountainGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  const distFromCenter = Math.sqrt(x * x + z * z);

  // Flat clearing for the cozy cottage near center
  if (distFromCenter < 14) {
    posAttr.setY(i, Math.sin(x * 0.2) * 0.4);
  } else {
    // Majestic mountain ridges
    const baseElevation = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 12;
    const ridgeNoise = Math.sin(x * 0.15 + z * 0.1) * 4.5;
    const rimClimb = Math.pow(distFromCenter / 45, 1.9) * 5;
    posAttr.setY(i, Math.max(-1, baseElevation + ridgeNoise + rimClimb));
  }
}
mountainGeo.computeVertexNormals();

const mountainMat = new THREE.MeshStandardMaterial({
  color: 0x304938,
  roughness: 0.85,
  metalness: 0.1,
  flatShading: true
});
const mountainMesh = new THREE.Mesh(mountainGeo, mountainMat);
mountainMesh.receiveShadow = true;
scene.add(mountainMesh);

/* ==========================================================================
   5. The Solitary Mountain Cottage
   ========================================================================== */
const cottageGroup = new THREE.Group();

// Wooden Base Walls
const wallMat = new THREE.MeshStandardMaterial({ color: 0x4f3627, roughness: 0.9 });
const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 4.5, 6), wallMat);
walls.position.y = 2.25;
walls.castShadow = true;
walls.receiveShadow = true;
cottageGroup.add(walls);

// Gable Roof
const roofMat = new THREE.MeshStandardMaterial({ color: 0x2d221b, roughness: 0.8 });
const roofGeo = new THREE.ConeGeometry(6.2, 3.2, 4);
roofGeo.rotateY(Math.PI / 4);
const roof = new THREE.Mesh(roofGeo, roofMat);
roof.position.y = 5.8;
roof.scale.set(1.1, 1, 1.25);
roof.castShadow = true;
cottageGroup.add(roof);

// Stone Chimney
const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.95 });
const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.2, 1.1), chimneyMat);
chimney.position.set(2.4, 5.2, -1.2);
chimney.castShadow = true;
cottageGroup.add(chimney);

// Glowing Windows (Emissive)
const windowMat = new THREE.MeshStandardMaterial({
  color: 0x221a12,
  emissive: 0xffaa44,
  emissiveIntensity: 0.2,
  roughness: 0.3
});
const frontWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), windowMat);
frontWindow.position.set(1.8, 2.4, 3.02);
cottageGroup.add(frontWindow);

const frontWindow2 = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), windowMat);
frontWindow2.position.set(-1.8, 2.4, 3.02);
cottageGroup.add(frontWindow2);

// Wooden Front Porch / Veranda
const porchMat = new THREE.MeshStandardMaterial({ color: 0x5a4130, roughness: 0.85 });
const porch = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 3.5), porchMat);
porch.position.set(0, 0.2, 4.5);
porch.receiveShadow = true;
cottageGroup.add(porch);

// Porch Posts
const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8);
const post1 = new THREE.Mesh(postGeo, porchMat);
post1.position.set(-3.8, 1.8, 6.0);
const post2 = new THREE.Mesh(postGeo, porchMat);
post2.position.set(3.8, 1.8, 6.0);
cottageGroup.add(post1, post2);

// Veranda Table
const tableMat = new THREE.MeshStandardMaterial({ color: 0x3d2719, roughness: 0.9 });
const table = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.2, 12), tableMat);
table.position.set(0, 0.8, 4.8);
cottageGroup.add(table);

// Clay Matka Cup of Dudh Cha ☕
const cupMat = new THREE.MeshStandardMaterial({ color: 0xa45b38, roughness: 0.95 });
const matkaCup = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.45, 16), cupMat);
matkaCup.position.set(0, 1.55, 4.8);
cottageGroup.add(matkaCup);

// Steaming Liquid Surface
const chaLiquidMat = new THREE.MeshBasicMaterial({ color: 0xd6a16b });
const chaLiquid = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), chaLiquidMat);
chaLiquid.rotateX(-Math.PI / 2);
chaLiquid.position.set(0, 1.76, 4.8);
cottageGroup.add(chaLiquid);

cottageGroup.position.set(0, 0, 0);
scene.add(cottageGroup);

/* ==========================================================================
   6. Particle Systems: Chimney Smoke & Dudh Cha Steam
   ========================================================================== */
// Chimney Smoke
const smokeCount = 36;
const smokeGeo = new THREE.BufferGeometry();
const smokePositions = new Float32Array(smokeCount * 3);
const smokeData = [];

for (let i = 0; i < smokeCount; i++) {
  smokePositions[i * 3] = 2.4 + (Math.random() - 0.5) * 0.4;
  smokePositions[i * 3 + 1] = 7.4 + Math.random() * 4.0;
  smokePositions[i * 3 + 2] = -1.2 + (Math.random() - 0.5) * 0.4;
  smokeData.push({
    baseY: 7.4,
    speedY: 0.03 + Math.random() * 0.02,
    driftX: (Math.random() - 0.5) * 0.015,
    driftZ: (Math.random() - 0.5) * 0.015
  });
}
smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
const smokeMat = new THREE.PointsMaterial({
  color: 0xcccccc,
  size: 1.2,
  transparent: true,
  opacity: 0.35
});
const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
scene.add(smokeParticles);

// Steam Particles from the Clay Cup
const steamCount = 18;
const steamGeo = new THREE.BufferGeometry();
const steamPos = new Float32Array(steamCount * 3);
const steamData = [];
for (let i = 0; i < steamCount; i++) {
  steamPos[i * 3] = (Math.random() - 0.5) * 0.2;
  steamPos[i * 3 + 1] = 1.8 + Math.random() * 1.5;
  steamPos[i * 3 + 2] = 4.8 + (Math.random() - 0.5) * 0.2;
  steamData.push({
    baseY: 1.8,
    speedY: 0.015 + Math.random() * 0.012
  });
}
steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));
const steamMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.45,
  transparent: true,
  opacity: 0.3
});
const steamParticles = new THREE.Points(steamGeo, steamMat);
scene.add(steamParticles);

/* ==========================================================================
   7. Instanced Pine Trees & Garden Flowers (Roses 🌹 & Sunflowers 🌻)
   ========================================================================== */
// Instanced Pine Trees
const treeConeGeo = new THREE.ConeGeometry(1.6, 5, 5);
const treeMat = new THREE.MeshStandardMaterial({ color: 0x1f3b2b, roughness: 0.9, flatShading: true });
const treeCount = 75;
const treeInstanced = new THREE.InstancedMesh(treeConeGeo, treeMat, treeCount);
treeInstanced.castShadow = true;

const dummy = new THREE.Object3D();
let placedTrees = 0;
while (placedTrees < treeCount) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 15 + Math.random() * 55;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  
  // Approximate mountain height
  const dist = Math.sqrt(x * x + z * z);
  const y = Math.pow(dist / 45, 1.9) * 4.5 + Math.sin(x * 0.1) * 2.5;

  dummy.position.set(x, y + 2.5, z);
  const s = 0.7 + Math.random() * 0.8;
  dummy.scale.set(s, s * (0.9 + Math.random() * 0.4), s);
  dummy.rotation.y = Math.random() * Math.PI * 2;
  dummy.updateMatrix();
  treeInstanced.setMatrixAt(placedTrees, dummy.matrix);
  placedTrees++;
}
treeInstanced.instanceMatrix.needsUpdate = true;
scene.add(treeInstanced);

// Instanced Sunflowers 🌻 in front of the cottage
const sunflowerCount = 28;
const flowerHeadGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 8);
const flowerStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 5);
const sunflowerMat = new THREE.MeshStandardMaterial({ color: 0xf5b325, roughness: 0.5 });
const stemMat = new THREE.MeshStandardMaterial({ color: 0x3d6635, roughness: 0.9 });

const sunflowerInstanced = new THREE.InstancedMesh(flowerHeadGeo, sunflowerMat, sunflowerCount);
for (let i = 0; i < sunflowerCount; i++) {
  const x = (Math.random() - 0.5) * 12 + (i % 2 === 0 ? 5.5 : -5.5);
  const z = 6.5 + Math.random() * 5.0;
  dummy.position.set(x, 1.2, z);
  dummy.rotation.x = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
  dummy.rotation.y = (Math.random() - 0.5) * 0.5;
  const s = 0.8 + Math.random() * 0.5;
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  sunflowerInstanced.setMatrixAt(i, dummy.matrix);
}
sunflowerInstanced.instanceMatrix.needsUpdate = true;
scene.add(sunflowerInstanced);

// Instanced Wild Roses 🌹
const roseCount = 24;
const roseGeo = new THREE.SphereGeometry(0.26, 6, 6);
const roseMat = new THREE.MeshStandardMaterial({ color: 0xd9434e, roughness: 0.6 });
const roseInstanced = new THREE.InstancedMesh(roseGeo, roseMat, roseCount);

for (let i = 0; i < roseCount; i++) {
  const x = (Math.random() - 0.5) * 8 + (i % 2 === 0 ? 4.2 : -4.2);
  const z = 5.2 + Math.random() * 3.5;
  dummy.position.set(x, 0.65, z);
  const s = 0.8 + Math.random() * 0.5;
  dummy.scale.set(s, s, s);
  dummy.updateMatrix();
  roseInstanced.setMatrixAt(i, dummy.matrix);
}
roseInstanced.instanceMatrix.needsUpdate = true;
scene.add(roseInstanced);

/* ==========================================================================
   8. Atmospheric Lighting & Day/Night Cycle Logic
   ========================================================================== */
function updateDayNightCycle(t) {
  // t: 0.0 (midnight) -> 0.25 (dawn) -> 0.5 (noon) -> 0.75 (sunset) -> 1.0 (midnight)
  const angle = (t - 0.25) * Math.PI * 2;
  const r = 160;

  // Orbiting Sun & Moon
  const sunX = Math.cos(angle) * r;
  const sunY = Math.sin(angle) * r;
  sunMesh.position.set(sunX, Math.max(sunY, -30), -50);
  sunLight.position.copy(sunMesh.position);

  const moonX = Math.cos(angle + Math.PI) * r;
  const moonY = Math.sin(angle + Math.PI) * r;
  moonMesh.position.set(moonX, Math.max(moonY, -30), 50);
  moonLight.position.copy(moonMesh.position);

  // Palette interpolation
  let skyColor, fogColor, hemiSky, hemiGround, sunIntensity, windowGlow;

  if (t >= 0.2 && t < 0.35) {
    // DAWN / MORNING
    const factor = (t - 0.2) / 0.15;
    skyColor = new THREE.Color().lerpColors(new THREE.Color(0x1a2128), new THREE.Color(0xffbf80), factor);
    fogColor = new THREE.Color().lerpColors(new THREE.Color(0x131a20), new THREE.Color(0xedd3b9), factor);
    hemiSky = new THREE.Color(0xffdcb3);
    hemiGround = new THREE.Color(0x354b3c);
    sunIntensity = factor * 1.3;
    windowGlow = (1 - factor) * 2.0;
    starMat.opacity = Math.max(0, 1 - factor * 1.5);
  } else if (t >= 0.35 && t < 0.68) {
    // BRIGHT DAY
    skyColor = new THREE.Color(0x76b4d6);
    fogColor = new THREE.Color(0xc1e3f2);
    hemiSky = new THREE.Color(0xfff6e8);
    hemiGround = new THREE.Color(0x304938);
    sunIntensity = 1.5;
    windowGlow = 0.05;
    starMat.opacity = 0;
  } else if (t >= 0.68 && t < 0.82) {
    // SUNSET / GOLDEN HOUR
    const factor = (t - 0.68) / 0.14;
    skyColor = new THREE.Color().lerpColors(new THREE.Color(0x76b4d6), new THREE.Color(0xd95b36), factor);
    fogColor = new THREE.Color().lerpColors(new THREE.Color(0xc1e3f2), new THREE.Color(0x6e382d), factor);
    hemiSky = new THREE.Color(0xffaa66);
    hemiGround = new THREE.Color(0x2d2e24);
    sunIntensity = (1 - factor) * 1.2;
    windowGlow = factor * 2.8;
    starMat.opacity = factor * 0.8;
  } else {
    // STARRY NIGHT
    skyColor = new THREE.Color(0x0a1016);
    fogColor = new THREE.Color(0x0c141a);
    hemiSky = new THREE.Color(0x3a5369);
    hemiGround = new THREE.Color(0x0f1c16);
    sunIntensity = 0;
    windowGlow = 3.2;
    starMat.opacity = 0.9;
  }

  skyMat.color.copy(skyColor);
  scene.fog.color.copy(fogColor);
  hemiLight.color.copy(hemiSky);
  hemiLight.groundColor.copy(hemiGround);
  sunLight.intensity = sunIntensity;
  windowMat.emissiveIntensity = windowGlow;
  houseLight.intensity = windowGlow * 1.5;
}

/* ==========================================================================
   9. Lenis Smooth Scroll & Camera Choreography
   ========================================================================== */
const lenis = new Lenis({
  duration: 1.6,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.8
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Camera Waypoints corresponding to the 6 Story Acts
const waypoints = [
  // Act 1: High Vista (Dawn Overview)
  { pos: new THREE.Vector3(0, 22, 48), target: new THREE.Vector3(0, 3, 0) },
  // Act 2: Flowers Garden (Roses & Sunflowers front yard)
  { pos: new THREE.Vector3(5.5, 4.2, 13.5), target: new THREE.Vector3(0, 1.8, 6.0) },
  // Act 3: Veranda Table & Steaming Dudh Cha
  { pos: new THREE.Vector3(0.0, 2.3, 6.8), target: new THREE.Vector3(0, 1.6, 4.8) },
  // Act 4: Sunset / Night transition & Cottage Windows
  { pos: new THREE.Vector3(-8.5, 5.0, 10.5), target: new THREE.Vector3(0, 3.2, 0) },
  // Act 5: Halal Promise & Family Honor
  { pos: new THREE.Vector3(0, 7.5, 22.0), target: new THREE.Vector3(0, 3.0, 0) },
  // Act 6: Keepsake Vault
  { pos: new THREE.Vector3(0, 14.0, 36.0), target: new THREE.Vector3(0, 2.5, 0) }
];

lenis.on('scroll', (e) => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, e.scroll / (maxScroll || 1)));

  // Calculate waypoint interpolation
  const totalSegments = waypoints.length - 1;
  const currentSegment = Math.min(totalSegments - 1, Math.floor(progress * totalSegments));
  const segmentT = (progress * totalSegments) - currentSegment;

  const p1 = waypoints[currentSegment].pos;
  const p2 = waypoints[currentSegment + 1].pos;
  const t1 = waypoints[currentSegment].target;
  const t2 = waypoints[currentSegment + 1].target;

  camera.position.lerpVectors(p1, p2, segmentT);
  state.cameraTarget.lerpVectors(t1, t2, segmentT);
  camera.lookAt(state.cameraTarget);

  // If user scrolls and isn't locked on slider, scroll also smoothly advances time
  if (state.isRealTime) {
    // Day to night journey as she scrolls down
    const scrollTime = 0.22 + progress * 0.72; // Dawn to Starry Night
    updateDayNightCycle(scrollTime % 1);
    timeSlider.value = scrollTime % 1;
  }
});

/* ==========================================================================
   10. Manual Time Slider Interaction
   ========================================================================== */
timeSlider.addEventListener('input', (e) => {
  state.isRealTime = false;
  state.timeProgress = parseFloat(e.target.value);
  updateDayNightCycle(state.timeProgress);
});

/* ==========================================================================
   11. Ambient Audio Synthesizer (Web Audio API - No external downloads)
   ========================================================================== */
let audioCtx = null;
let audioTimer = null;

const peacefulChords = [
  [261.63, 329.63, 392.00, 523.25], // C Major
  [220.00, 261.63, 329.63, 440.00], // A Minor
  [174.61, 220.00, 261.63, 349.23], // F Major
  [196.00, 246.94, 293.66, 392.00]  // G Major
];
let chordIndex = 0;

function playAmbientChord() {
  if (!audioCtx || !state.audioPlaying) return;
  const chord = peacefulChords[chordIndex];
  chordIndex = (chordIndex + 1) % peacefulChords.length;

  chord.forEach((freq, idx) => {
    setTimeout(() => {
      if (!state.audioPlaying) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.035, audioCtx.currentTime + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 4.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 5.0);
    }, idx * 260);
  });
}

window.toggleAudio = function() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  const btn = document.getElementById('audioBtn');
  const label = document.getElementById('audioLabel');

  if (!state.audioPlaying) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    state.audioPlaying = true;
    btn.classList.add('active');
    label.innerText = "Playing 🎶";
    playAmbientChord();
    audioTimer = setInterval(playAmbientChord, 5200);
  } else {
    state.audioPlaying = false;
    btn.classList.remove('active');
    label.innerText = "Ambience";
    clearInterval(audioTimer);
  }
};

/* ==========================================================================
   12. Simple, Heartfelt Modal Letters (English + Bangla)
   ========================================================================== */
window.openFlowerDialog = function() {
  openModal(
    "গোলাপ ও সূর্যমুখী • Your Favorite Blooms",
    "Roses & Sunflowers",
    `A rose is soft and delicate—just like your heart. It feels every rough breeze, and it deserves gentle love, never harsh words.
(গোলাপ যেমন কোমল, ঠিক তেমনি তোমার মন। তোমার এই নরম হৃদয় কোনো রুক্ষতার জন্য নয়, পরম যত্নে রাখার জন্য।)

And a sunflower always turns toward the light. Even on difficult days, you keep hoping, keep trying, and bring warmth wherever you go.
(আর সূর্যমুখী যেমন সব সময় আলোর দিকে চেয়ে থাকে, তুমিও হাজারো কষ্টের মাঝে আলো হয়ে থাকো।)`
  );
};

window.openChaDialog = function() {
  openModal(
    "গরম দুধ চা • A Warm Sip of Peace",
    "A Hot Cup of Dudh Cha",
    `Take a slow, deep breath, Tama.

When your thoughts feel loud, remember this moment. Two clay cups of hot dudh cha on our quiet wooden porch, watching the mountain mist roll by. 
(যখন ভাবনাগুলো খুব এলোমেলো হয়ে যায়, চোখ বন্ধ করে একটু বুক ভরে শ্বাস নাও। শান্ত পাহাড়ের এই বারান্দায় বসে এক কাপ গরম দুধ চা খাওয়ার এই শান্তিটুকু শুধু তোমার জন্য।)`
  );
};

window.openLetterDialog = function(type) {
  if (type === 'family') {
    openModal(
      "পরিবারকে সম্মান • Honoring Your Family",
      "To Abu Bakkar Uncle & Rina Aunty's Daughter",
      `Tama, your love for your parents is something I truly respect. 

Uncle Abu Bakkar Siddique and Aunty Rina Akter only want you to be safe. Because of wrong information, they are worried—and any loving parent would be. 

You never have to choose between your family and me. We will win their blessings with patience, honesty, and respect. 
(তোমার বাবা-মায়ের প্রতি তোমার ভালোবাসা আমাকে মুগ্ধ করে। আমরা তাঁদের দোয়া আর সম্মান নিয়েই এক হব, ইনশাআল্লাহ।)`
    );
  } else if (type === 'vows') {
    openModal(
      "আমার প্রতিশ্রুতি • My Word To You",
      "What I Am Changing For You",
      `1. Mastering My Anger: You have tolerated my temper with so much patience. You never deserved sharp words. I am actively learning to pause, stay calm, and protect your gentle heart.
(আমার রাগ নিয়ন্ত্রণ: তোমার নরম মনকে আঘাত দেওয়ার মতো ভুল আর নয়। আমি শান্ত হতে শিখছি।)

2. Daily Routine: I am fixing my sleep, health, and schedule every day so you can feel proud and secure.
(নিয়মানুবর্তিতা: আমি আমার জীবন গুছিয়ে নিচ্ছি, যাতে তুমি নিশ্চিন্তে ভরসা করতে পারো।)`
    );
  } else if (type === 'marriage') {
    openModal(
      "আমাদের স্বপ্ন • The Halal Dream",
      "Our Future Together",
      `Our end goal is clear and pure: a blessed, peaceful marriage with our families smiling beside us.

A simple, beautiful life—hot morning dudh cha, quiet laughter, and choosing each other every single day.
(আমাদের শেষ ঠিকানা একটি সুন্দর, শান্ত সংসার—যেখানে পরিবার থাকবে, সম্মান থাকবে, আর থাকবে অনন্ত শান্তি। শুভ জন্মদিন, তামা 🤍)`
    );
  }
};

window.openVaultDialog = function() {
  const saved = JSON.parse(localStorage.getItem('tama_private_photos') || '[]');
  const count = saved.length;
  
  openModal(
    "গোপন স্মৃতির ঘর • 100% Private Vault",
    "Our Keepsake Vault",
    `Your photos are saved only inside your phone's browser—never uploaded to the internet. 

Currently, you have ${count} private moments saved here. 

(এখানে রাখা ছবি কেবল তোমার ফোনেই সংরক্ষিত থাকে, ইন্টারনেটে যায় না। এটি তোমার ও আমার একদম গোপন স্মৃতির আশ্রয়।)`
  );
};

function openModal(tag, title, body) {
  document.getElementById('modalTag').innerText = tag;
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalBody').innerText = body;
  document.getElementById('modalOverlay').classList.add('active');
}

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('active');
};

window.closeModalOnBackdrop = function(e) {
  if (e.target.id === 'modalOverlay') {
    window.closeModal();
  }
};

/* ==========================================================================
   13. Animation Loop & Mobile Performance Tuning
   ========================================================================== */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Gentle flower sway in mountain breeze
  sunflowerInstanced.rotation.y = Math.sin(time * 1.5) * 0.08;
  roseInstanced.rotation.y = Math.cos(time * 1.8) * 0.06;

  // Animate chimney smoke particles
  const smokePos = smokeGeo.attributes.position.array;
  for (let i = 0; i < smokeCount; i++) {
    const data = smokeData[i];
    smokePos[i * 3 + 1] += data.speedY;
    smokePos[i * 3] += data.driftX;
    smokePos[i * 3 + 2] += data.driftZ;

    if (smokePos[i * 3 + 1] > 14.0) {
      smokePos[i * 3 + 1] = data.baseY;
      smokePos[i * 3] = 2.4 + (Math.random() - 0.5) * 0.4;
      smokePos[i * 3 + 2] = -1.2 + (Math.random() - 0.5) * 0.4;
    }
  }
  smokeGeo.attributes.position.needsUpdate = true;

  // Animate tea steam particles
  const steamPosArr = steamGeo.attributes.position.array;
  for (let i = 0; i < steamCount; i++) {
    const data = steamData[i];
    steamPosArr[i * 3 + 1] += data.speedY;
    if (steamPosArr[i * 3 + 1] > 3.4) {
      steamPosArr[i * 3 + 1] = data.baseY;
      steamPosArr[i * 3] = (Math.random() - 0.5) * 0.2;
      steamPosArr[i * 3 + 2] = 4.8 + (Math.random() - 0.5) * 0.2;
    }
  }
  steamGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

// Initial cycle update
updateDayNightCycle(state.timeProgress);
animate();

// Remove loading screen smoothly once scene is ready
window.addEventListener('load', () => {
  setTimeout(() => {
    loader.classList.add('hidden');
  }, 400);
});

// Window resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
});
