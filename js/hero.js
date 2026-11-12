import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...opts });
}
function rbox(w, h, d, r, material) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
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
  const frustum = 11.5;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const camBase = new THREE.Vector3(14, 11, 14);
  camera.position.copy(camBase);
  const target = new THREE.Vector3(0.4, 3.2, 0);
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
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 12), mat(0x8a8790, { metalness: 0.6, roughness: 0.3 }));
  post.position.y = 1.2;
  const foot = rbox(1.6, 0.12, 1.6, 0.06, mat(0x8a8790, { metalness: 0.6, roughness: 0.3 }));
  foot.position.y = 0.4;
  chair.add(seat, back, post, foot);
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
    leaf.scale.set(0.45, 1.6, 0.18);
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
  world.add(board);
  [[1.1, 8.2, 0xfff3c4], [2.4, 7.7, 0xcfe3ff]].forEach(([x, y, c]) => {
    const note = rbox(0.9, 0.9, 0.04, 0.02, mat(c));
    note.position.set(x, y, -3.4);
    note.rotation.z = (x - 1.8) * 0.15;
    world.add(note);
  });

  // The bug (QA mascot) crawling on the desk
  const bug = new THREE.Group();
  const bugBody = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 16), mat(0xe8453c, { roughness: 0.35 }));
  bugBody.scale.set(1, 0.6, 1.25);
  const bugHead = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), mat(0x2d2a24));
  bugHead.position.set(0, 0.02, 0.4);
  bug.add(bugBody, bugHead);
  for (let i = 0; i < 3; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0x2d2a24));
    dot.position.set(i === 1 ? 0 : (i - 1) * 0.15, 0.19, -0.1 + i * 0.12);
    bug.add(dot);
  }
  bug.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  bug.position.set(-2.6, 3.3, -0.65);
  world.add(bug);

  // Magnifying glass hovering above the bug
  const glass = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 12, 32), mat(0x234ba2, { roughness: 0.3 }));
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), new THREE.MeshStandardMaterial({ color: 0xcfe9ff, transparent: true, opacity: 0.35, roughness: 0.05 }));
  const handle = rbox(0.13, 0.75, 0.13, 0.05, mat(0x2d2a24));
  handle.position.set(0.48, -0.48, 0); handle.rotation.z = Math.PI / 4;
  glass.add(ring, lens, handle);
  glass.position.set(-2.6, 4.3, -0.65);
  glass.rotation.x = -Math.PI / 2.4;
  world.add(glass);

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
    frame0.offX = wide ? -frame0.halfW * 0.38 : 0;
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

  // Scroll progress through the sticky hero track (0 → 1)
  const track = document.querySelector('.hero-track');
  const fadeEls = document.querySelectorAll('[data-hero-fade]');
  const bubble = document.querySelector('.hero-bubble');
  let progress = 0, smooth = 0;
  function readScroll() {
    if (!track) return;
    const r = track.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    progress = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    if (forced !== null) progress = forced;
  }
  const forcedParam = new URLSearchParams(location.search).get('p');
  const forced = forcedParam !== null ? Number(forcedParam) : null;
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const headPos = new THREE.Vector3();
  const parallax = { x: 0, y: 0 };
  const lookAt = new THREE.Vector3();
  const CHAIR_START = 0.25, CHAIR_END = -2.25;

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();

    smooth += (progress - smooth) * (reduceMotion || forced !== null ? 1 : 0.08);
    const pZoom = ease(seg(smooth, 0.05, 0.75));
    const pTurn = ease(seg(smooth, 0.3, 0.8));
    const pWave = seg(smooth, 0.8, 0.95);

    // chair swivels toward the viewer
    chair.rotation.y = CHAIR_START + (CHAIR_END - CHAIR_START) * pTurn;
    chair.position.z = 1.6 + pTurn * 0.9;

    // camera zooms toward the avatar's head
    avatar.head.getWorldPosition(headPos);
    lookAt.copy(target).lerp(headPos.setY(headPos.y - 0.2), pZoom);
    camera.zoom = 1 + pZoom * 1.3;
    applyFrustum(pZoom);

    if (!reduceMotion) {
      parallax.x += (pointer.x - parallax.x) * 0.05;
      parallax.y += (pointer.y - parallax.y) * 0.05;
    }
    camera.position.set(
      camBase.x + parallax.x * 1.2 + (lookAt.x - target.x),
      camBase.y - parallax.y * 0.8 + (lookAt.y - target.y),
      camBase.z + (lookAt.z - target.z)
    );
    camera.lookAt(lookAt);

    // DOM overlays
    fadeEls.forEach((el) => {
      el.style.opacity = String(1 - seg(smooth, 0.05, 0.35));
      el.style.transform = `translateY(${-seg(smooth, 0.05, 0.35) * 40}px)`;
    });
    if (bubble) bubble.classList.toggle('is-visible', pWave > 0.2);

    avatar.animate(reduceMotion ? 0 : t, pTurn, pWave);

    if (!reduceMotion) {
      // bug wanders in a small loop; glass follows
      const bx = -2.6 + Math.sin(t * 0.6) * 0.7;
      const bz = -1.1 + Math.cos(t * 0.6) * 0.45;
      bug.rotation.y = Math.atan2(Math.cos(t * 0.6) * 0.9, -Math.sin(t * 0.6) * 0.4);
      bug.position.x = bx; bug.position.z = bz;
      glass.position.x += (bx - glass.position.x) * 0.04;
      glass.position.z += (bz - glass.position.z) * 0.04;
      glass.position.y = 4.3 + Math.sin(t * 2) * 0.1;
      plant.rotation.z = Math.sin(t * 0.8) * 0.02;
      monitors[1].material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.05;
    }
    renderer.render(scene, camera);
  }
  frame();
}

// ---------------------------------------------------------------------------
// Stylized avatar of Shukhrat: dark wavy hair, full short beard, brown eyes,
// black blazer over an off-white tee. Built in chair-local space, facing -Z.
// ---------------------------------------------------------------------------
function buildAvatar() {
  const SKIN = 0xe9b893, HAIR = 0x1d1714, BLAZER = 0x1e1e24, TEE = 0xf1eee3,
        PANTS = 0x34343c, SHOE = 0xf4f1ec, SOLE = 0x2d2a24;
  const skin = mat(SKIN, { roughness: 0.55 });
  const hair = mat(HAIR, { roughness: 0.85 });
  const blazer = mat(BLAZER, { roughness: 0.7 });
  const group = new THREE.Group();
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

  // Legs
  [-0.27, 0.27].forEach((x) => {
    add(group, rbox(0.44, 0.4, 1.25, 0.18, mat(PANTS)), x, 2.45, -0.45);
    add(group, rbox(0.38, 1.9, 0.38, 0.17, mat(PANTS)), x, 1.5, -1.0);
    add(group, rbox(0.42, 0.22, 0.7, 0.1, mat(SHOE)), x, 0.5, -1.12);
    add(group, rbox(0.43, 0.07, 0.72, 0.03, mat(SOLE)), x, 0.38, -1.12);
  });

  // Torso: blazer + tee
  add(group, rbox(1.2, 1.35, 0.75, 0.32, blazer), 0, 3.05, 0.05);
  add(group, rbox(0.42, 1.05, 0.08, 0.04, mat(TEE)), 0, 3.15, -0.31);
  // lapels
  [-1, 1].forEach((s) => {
    const lapel = add(group, rbox(0.16, 0.8, 0.06, 0.03, mat(0x111116)), s * 0.27, 3.2, -0.33);
    lapel.rotation.z = s * 0.28;
  });
  // tee collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20), mat(TEE));
  collar.rotation.x = Math.PI / 2;
  add(group, collar, 0, 3.72, 0);

  // Arms (shoulder pivot -> elbow pivot)
  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.68, 3.55, 0.02);
    add(shoulder, rbox(0.34, 0.8, 0.34, 0.16, blazer), 0, -0.36, 0);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.72, 0);
    add(elbow, rbox(0.3, 0.75, 0.3, 0.14, blazer), 0, -0.34, 0);
    add(elbow, new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skin), 0, -0.78, 0);
    shoulder.add(elbow);
    group.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = arm(-1), armR = arm(1);

  // Neck + head
  add(group, new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.35, 16), skin), 0, 3.82, 0);
  const head = new THREE.Group();
  head.position.set(0, 4.45, 0);
  group.add(head);

  const skull = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 32), skin), 0, 0, 0);
  skull.scale.set(1, 1.06, 0.96);
  // ears
  [-1, 1].forEach((s) => {
    const ear = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), skin), s * 0.6, 0.0, 0.02);
    ear.scale.set(0.5, 1, 0.8);
  });

  // Hair: back shell, top cap, voluminous wavy front swept up
  const back = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.655, 32, 24, 0, Math.PI, 0, Math.PI * 0.62), hair), 0, 0.03, 0.02);
  back.scale.set(1.02, 1.06, 0.98);
  const cap = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.665, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.3), hair), 0, 0.06, 0);
  cap.scale.set(1.02, 1.1, 1.0);
  [[-0.3, 0.5, -0.3, 0.26], [0.0, 0.6, -0.33, 0.28], [0.3, 0.52, -0.28, 0.25],
   [-0.42, 0.38, -0.08, 0.22], [0.44, 0.4, -0.06, 0.22], [0.12, 0.66, -0.05, 0.27]]
    .forEach(([x, y, z, r]) => {
      const tuft = add(head, new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), hair), x, y, z);
      tuft.scale.set(1.15, 0.7, 1);
    });
  // sideburns
  [-1, 1].forEach((s) => add(head, rbox(0.08, 0.38, 0.22, 0.04, hair), s * 0.6, 0.12, -0.08));

  // Beard: lower-front shell + chin volume, mustache
  const beard = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.64, 32, 24, Math.PI, Math.PI, Math.PI * 0.6, Math.PI * 0.37), hair), 0, -0.02, 0.02);
  beard.scale.set(1.0, 1.05, 1.0);
  const chin = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), hair), 0, -0.5, -0.32);
  chin.scale.set(1.25, 0.8, 0.9);
  const stache = add(head, rbox(0.38, 0.08, 0.1, 0.04, hair), 0, -0.2, -0.6);
  stache.rotation.x = 0.2;
  // smile (lip line inside the beard)
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 16, Math.PI), mat(0xb8705f));
  lip.rotation.set(0, Math.PI, Math.PI);
  add(head, lip, 0, -0.27, -0.62);

  // Face: eyes, brows, nose, mole
  const eyeMat = mat(0x3a2418, { roughness: 0.2 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((s) => {
    const eye = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), eyeMat), s * 0.21, 0.04, -0.57);
    eye.scale.set(1, 0.8, 0.6);
    add(head, new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), shine), s * 0.21 + 0.025, 0.07, -0.615);
    const brow = add(head, rbox(0.24, 0.065, 0.06, 0.03, hair), s * 0.22, 0.2, -0.56);
    brow.rotation.z = s * -0.08;
  });
  add(head, new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), skin), 0, -0.05, -0.59).scale.set(0.9, 1.15, 0.7);
  add(head, new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0x6b4632)), 0.3, -0.1, -0.55);
  // cheek blush
  [-1, 1].forEach((s) => {
    const blush = add(head, new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xf0a088, transparent: true, opacity: 0.35 })), s * 0.33, -0.08, -0.535);
    blush.rotation.y = Math.PI + s * -0.5;
    blush.castShadow = false;
  });

  function animate(t, turn, wave) {
    // Typing pose blends into a relaxed pose as the chair turns
    const typeAmt = 1 - turn;
    [armL, armR].forEach((a, i) => {
      const tap = Math.sin(t * 14 + i * 1.7) * 0.06 * typeAmt;
      a.shoulder.rotation.x = 0.85 * typeAmt + 0.35 * turn + tap;
      a.shoulder.rotation.z = (i ? -1 : 1) * (0.08 + 0.1 * turn);
      a.elbow.rotation.x = 0.75 * typeAmt + 1.1 * turn;
    });
    // Wave with the right hand
    if (wave > 0) {
      const w = Math.min(1, wave * 1.5);
      armR.shoulder.rotation.x += (-0.2 - armR.shoulder.rotation.x) * w;
      armR.shoulder.rotation.z = 0.3 + 2.0 * w;
      armR.elbow.rotation.x = 0;
      armR.elbow.rotation.z = (0.6 + Math.sin(t * 9) * 0.35) * w;
    } else {
      armR.elbow.rotation.z = 0;
    }
    // Head: small typing nod, then a friendly tilt toward the viewer
    head.rotation.x = Math.sin(t * 1.3) * 0.04 * typeAmt - 0.08 * turn;
    head.rotation.z = Math.sin(t * 0.7) * 0.03 + 0.12 * wave;
    head.rotation.y = Math.sin(t * 0.5) * 0.08 * typeAmt;
  }

  return { group, head, animate };
}
