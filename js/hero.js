import * as THREE from 'three';
import { buildAvatar, mat, rbox } from './avatar.js';

const host = document.getElementById('hero-scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

if (!host || !webglOk()) {
  host?.classList.add('no-webgl');
} else {
  init();
}

// Canvas texture that looks like a code editor with test results
function codeTexture(variant) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  g.fillStyle = '#1f1d24'; g.fillRect(0, 0, 512, 320);
  g.fillStyle = '#2b2833'; g.fillRect(0, 0, 70, 320);
  const colors = ['#ff8400', '#7cc6ff', '#c8e86b', '#f5efe6', '#b58cff'];
  let seed = variant * 97 + 3;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let y = 18; y < 300; y += 18) {
    let x = 90 + Math.floor(rnd() * 3) * 22;
    const parts = 1 + Math.floor(rnd() * 3);
    for (let p = 0; p < parts; p++) {
      const w = 30 + rnd() * 110;
      g.fillStyle = colors[Math.floor(rnd() * colors.length)];
      g.fillRect(x, y, w, 7);
      x += w + 10;
    }
    g.fillStyle = '#4a4655'; g.fillRect(20, y, 30, 7);
  }
  if (variant === 1) {
    // test results panel
    g.fillStyle = '#26232c'; g.fillRect(300, 180, 190, 120);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i === 3 ? '#ff5d5d' : '#5ed68a';
      g.beginPath(); g.arc(320, 200 + i * 20, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#8c879a'; g.fillRect(335, 197 + i * 20, 90 + (i * 23) % 50, 6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Isometric-ish orthographic camera
  const frustum = 8.4;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const camBase = new THREE.Vector3(14, 11, 14);
  camera.position.copy(camBase);
  const target = new THREE.Vector3(1.0, 4.3, -0.6);
  camera.lookAt(target);

  // Lights
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c3a5, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);

  // Rug (layered rounded rectangles)
  const rugColors = [0xf0a030, 0xf7d36a, 0xf3bd45, 0xfbe590];
  rugColors.forEach((col, i) => {
    const s = 12 - i * 2;
    const rug = rbox(s, 0.12, s * 0.8, 0.05, mat(col, { roughness: 0.95 }));
    rug.position.set(0, 0.06 + i * 0.03, 0.4);
    rug.castShadow = false;
    world.add(rug);
  });

  // Desk
  const deskMat = mat(0xfafafa, { roughness: 0.4 });
  const woodMat = mat(0xd9b27c);
  const top = rbox(8, 0.35, 3.4, 0.15, deskMat);
  top.position.set(0, 3, -1.2);
  world.add(top);
  [[-3.6, -2.6], [3.6, -2.6], [-3.6, 0.2], [3.6, 0.2]].forEach(([x, z]) => {
    const leg = rbox(0.25, 2.9, 0.25, 0.08, woodMat);
    leg.position.set(x, 1.5, z);
    world.add(leg);
  });

  // Monitors
  const frameMat = mat(0x3b3843, { roughness: 0.35 });
  const monitors = [];
  [[-1.6, 0.25, 0], [1.6, -0.25, 1]].forEach(([x, rot, v]) => {
    const g = new THREE.Group();
    const frame = rbox(2.9, 1.9, 0.18, 0.1, frameMat);
    g.add(frame);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.65, 1.65),
      new THREE.MeshStandardMaterial({ map: codeTexture(v), emissive: 0xffffff, emissiveMap: codeTexture(v), emissiveIntensity: 0.55, roughness: 0.3 })
    );
    screen.position.z = 0.095;
    g.add(screen);
    const neck = rbox(0.2, 0.8, 0.15, 0.05, frameMat);
    neck.position.set(0, -1.25, -0.1);
    g.add(neck);
    const base = rbox(0.9, 0.08, 0.6, 0.04, frameMat);
    base.position.set(0, -1.62, 0);
    g.add(base);
    g.position.set(x, 4.85, -2.2);
    g.rotation.y = rot;
    world.add(g);
    monitors.push(screen);
  });

  // Keyboard + mouse
  const kb = rbox(2.2, 0.1, 0.7, 0.05, mat(0xeeeeee));
  kb.position.set(0, 3.22, -0.4);
  world.add(kb);
  const mouse = rbox(0.3, 0.12, 0.45, 0.12, mat(0xeeeeee));
  mouse.position.set(1.6, 3.23, -0.35);
  world.add(mouse);

  // Mug
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.5, 24), mat(0xff8400, { roughness: 0.4 }));
  mug.position.set(-3, 3.42, -0.6); mug.castShadow = true;
  world.add(mug);

  // Chair
  const chair = new THREE.Group();
  const chairMat = mat(0xf4f1ec, { roughness: 0.5 });
  const seat = rbox(1.8, 0.3, 1.7, 0.14, chairMat);
  seat.position.y = 2.1;
  const back = rbox(1.8, 2, 0.25, 0.12, chairMat);
  back.position.set(0, 3.2, 0.85);
  back.rotation.x = -0.1;
  chair.add(seat, back);
  const metal = mat(0xa9a7ae, { metalness: 0.6, roughness: 0.3 });
  [-0.75, 0.75].forEach((x) => {
    const runner = rbox(0.1, 0.1, 1.9, 0.05, metal); runner.position.set(x, 0.3, 0); chair.add(runner);
    const leg = rbox(0.1, 1.75, 0.1, 0.05, metal); leg.position.set(x, 1.15, -0.5); leg.rotation.x = 0.35; chair.add(leg);
  });
  const bar = rbox(1.6, 0.1, 0.1, 0.05, metal); bar.position.set(0, 0.3, 0.92); chair.add(bar);
  chair.position.set(0.2, 0, 1.6);
  chair.rotation.y = 0.25;
  world.add(chair);

  const avatar = buildAvatar();
  chair.add(avatar.group);

  // Plant
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.6, 1.3, 28), mat(0xe9ded0));
  pot.position.y = 0.65; pot.castShadow = true;
  plant.add(pot);
  const leafMat = mat(0x76c043, { roughness: 0.5 });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), leafMat);
    leaf.scale.set(0.6, 2.2, 0.2);
    const a = (i / 7) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.35, 2.0, Math.sin(a) * 0.35);
    leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    leaf.castShadow = true;
    plant.add(leaf);
  }
  plant.position.set(5.6, 0, 1.6);
  world.add(plant);

  // Wall shelf with books
  const shelf = rbox(2.4, 0.15, 0.8, 0.05, woodMat);
  shelf.position.set(-2.4, 7.4, -3.2);
  world.add(shelf);
  [0xff8400, 0x234ba2, 0xf7d36a, 0xe9ded0].forEach((c, i) => {
    const book = rbox(0.3, 0.9 - (i % 2) * 0.15, 0.6, 0.04, mat(c));
    book.position.set(-3.3 + i * 0.36, 7.9 - (i % 2) * 0.07, -3.2);
    world.add(book);
  });

  // Pin board
  const board = rbox(3.2, 2.1, 0.15, 0.1, mat(0xb08f6e, { roughness: 1 }));
  board.position.set(1.8, 7.9, -3.5);
  board.castShadow = false; world.add(board);
  [[1.1, 8.2, 0xfff3c4], [2.4, 7.7, 0xcfe3ff]].forEach(([x, y, c]) => {
    const note = rbox(0.9, 0.9, 0.04, 0.02, mat(c));
    note.position.set(x, y, -3.4);
    note.rotation.z = (x - 1.8) * 0.15;
    world.add(note);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat(0xe0525a, { roughness: 0.3 }));
    pin.position.set(x - 0.15, y + 0.3, -3.28); pin.castShadow = true; world.add(pin);
  });

  // Desk props: pen cup, rubber duck (debugging mascot), speaker, grid cube
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.6, 24), mat(0xd9c6ad));
  cup.position.set(-2.9, 3.47, -1.9); cup.castShadow = true; world.add(cup);
  [[0x8fc7e8, 0.12], [0xe8707a, -0.15]].forEach(([c, tilt], i) => {
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), mat(c));
    pencil.position.set(-2.9 + (i ? 0.08 : -0.06), 3.95, -1.9); pencil.rotation.z = tilt; pencil.castShadow = true;
    world.add(pencil);
  });
  const duck = new THREE.Group();
  const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), mat(0xffd23f, { roughness: 0.35 }));
  duckBody.scale.set(1.15, 0.85, 1);
  const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), mat(0xffd23f, { roughness: 0.35 }));
  duckHead.position.set(0.2, 0.32, 0);
  const beak = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), mat(0xff8a1f));
  beak.scale.set(1.3, 0.5, 0.9); beak.position.set(0.4, 0.3, 0);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), mat(0x2d2a24));
  eyeL.position.set(0.3, 0.4, 0.12);
  const eyeR = eyeL.clone(); eyeR.position.z = -0.12;
  duck.add(duckBody, duckHead, beak, eyeL, eyeR);
  duck.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  duck.position.set(-3.3, 3.43, -0.8); duck.rotation.y = 0.9; world.add(duck);
  const speaker = rbox(0.8, 0.9, 0.6, 0.1, mat(0xf0a530));
  speaker.position.set(3.4, 3.62, -1.6); speaker.rotation.y = -0.3; world.add(speaker);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24), mat(0x3b3843));
  cone.rotation.x = Math.PI / 2; cone.position.set(3.3, 3.65, -1.28); world.add(cone);
  const cube = rbox(0.5, 0.5, 0.5, 0.06, mat(0x6fa8ff, { roughness: 0.4 }));
  cube.position.set(2.6, 3.43, -1.0); cube.rotation.y = 0.5; world.add(cube);

  // Picture frame on the right wall
  const picFrame = rbox(2.6, 1.8, 0.18, 0.15, mat(0x9fbbe8));
  picFrame.position.set(5.4, 6.4, -3.45); picFrame.castShadow = false; world.add(picFrame);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.35), mat(0xe8eff9));
  art.position.set(5.4, 6.4, -3.35); world.add(art);
  const hill = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 3), mat(0x9fbbe8));
  hill.position.set(5.2, 6.1, -3.3); hill.scale.z = 0.2; world.add(hill);


  // Shadow catcher floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Resize
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const wide = aspect >= 1.1;
    // Full-bleed canvas: on wide screens the scene sits on the right,
    // on tall screens it sits below the text. Offsets ease to 0 when zoomed.
    const f = wide ? frustum * 1.25 : Math.max(frustum * 1.1, frustum * 0.95 / aspect);
    frame0.halfW = f * aspect / 2;
    frame0.halfH = f / 2;
    frame0.offX = wide ? -frame0.halfW * 0.3 : 0;
    frame0.offY = wide ? 0 : frame0.halfH * 0.28;
    applyFrustum(0);
  }
  function applyFrustum(z) {
    const k = 1 - z;
    camera.left = -frame0.halfW + frame0.offX * k;
    camera.right = frame0.halfW + frame0.offX * k;
    camera.top = frame0.halfH + frame0.offY * k;
    camera.bottom = -frame0.halfH + frame0.offY * k;
    camera.updateProjectionMatrix();
  }
  const frame0 = { halfW: 1, halfH: 1, offX: 0, offY: 0 };
  new ResizeObserver(resize).observe(host);
  resize();

  // Mouse parallax
  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Pause rendering when the hero is offscreen
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);

  const parallax = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (!reduceMotion) {
      parallax.x += (pointer.x - parallax.x) * 0.05;
      parallax.y += (pointer.y - parallax.y) * 0.05;
    }
    camera.position.set(camBase.x + parallax.x * 1.2, camBase.y - parallax.y * 0.8, camBase.z);
    camera.lookAt(target);
    avatar.animate(reduceMotion ? 0 : t, 0, 0);

    if (!reduceMotion) {
      plant.rotation.z = Math.sin(t * 0.8) * 0.02;
      monitors[1].material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.05;
    }
    renderer.render(scene, camera);
  }
  frame();
}
