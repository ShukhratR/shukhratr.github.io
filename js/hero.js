import * as THREE from 'three';
import { mat, rbox } from './utils.js';
import { loadRiggedAvatar } from './avatar-loader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

// Canvas texture that looks like a code editor with test results
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function noteTex(bg, lines, color) {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
    g.fillStyle = color; g.textAlign = 'center';
    lines.forEach(([txt, size], i) => { g.font = `700 ${size}px Urbanist, sans-serif`; g.fillText(txt, 128, 105 + i * 58); });
  });
}
function star(g, cx, cy, r, color) {
  g.fillStyle = color; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, innerWidth < 840 ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Isometric-ish orthographic camera
  const frustum = 7.4;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const camBase = new THREE.Vector3(14, 11, 14);
  camera.position.copy(camBase);
  const target = new THREE.Vector3(1.2, 4.7, -0.6);
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

  // One wide monitor, centred, showing a playful Java class
  const frameMat = mat(0x4a4458, { roughness: 0.35 });
  const monitors = [];
  const javaTex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#1e1c26'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2733'; g.fillRect(0, 0, w, 34); g.fillRect(0, 34, 52, h);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(20 + i * 20, 17, 6, 0, 7); g.fill(); });
    g.fillStyle = '#8c879a'; g.font = '16px Menlo, monospace'; g.fillText('QualityEngineer.java', 90, 23);
    const K = '#ff8f40', T = '#7cc6ff', S = '#c8e86b', C = '#6e6a7c', F = '#f5efe6', N = '#b58cff';
    const lines = [
      [[C, '// ships bugs to /dev/null since 2018']],
      [[K, 'public class '], [T, 'Shukhrat '], [K, 'extends '], [T, 'SeniorQAEngineer '], [F, '{']],
      [[K, '  private final '], [T, 'int '], [F, 'yearsOfExperience = '], [N, '8'], [F, ';']],
      [[K, '  private '], [T, 'String '], [F, 'coffee = '], [S, '"always"'], [F, ';']],
      [],
      [[F, '  '], [T, '@Test']],
      [[K, '  public void '], [F, 'shipWithConfidence() {']],
      [[F, '    Bug bug = codebase.'], [T, 'find'], [F, '(Bug::'], [T, 'isSneaky'], [F, ');']],
      [[F, '    '], [T, 'assertThat'], [F, '(bug).'], [T, 'isNull'], [F, '();  '], [C, '// ✓ 600/600 passed']],
      [[F, '    pipeline.'], [T, 'smoke'], [F, '('], [N, '15'], [F, ', MINUTES).'], [T, 'go'], [F, '();']],
      [[F, '  }']],
      [[F, '}']],
    ];
    g.font = '21px Menlo, monospace';
    lines.forEach((parts, i) => {
      g.fillStyle = '#4a4655'; g.fillText(String(i + 1).padStart(2, ' '), 14, 70 + i * 34);
      let x = 70;
      parts.forEach(([c, txt]) => { g.fillStyle = c; g.fillText(txt, x, 70 + i * 34); x += g.measureText(txt).width; });
    });
    g.fillStyle = '#28c840'; g.fillRect(70 + 10, 70 + 12 * 34 - 18, 11, 22);   // cursor
  });
  {
    const g = new THREE.Group();
    g.add(rbox(4.6, 2.5, 0.18, 0.12, frameMat));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.36, 2.26),
      new THREE.MeshStandardMaterial({ map: javaTex, emissive: 0xffffff, emissiveMap: javaTex, emissiveIntensity: 0.55, roughness: 0.3 }));
    screen.position.z = 0.095; g.add(screen);
    const neck = rbox(0.25, 0.9, 0.15, 0.05, frameMat); neck.position.set(0, -1.55, -0.1); g.add(neck);
    const base = rbox(1.2, 0.08, 0.7, 0.04, frameMat); base.position.set(0, -1.98, 0); g.add(base);
    g.position.set(0, 4.75, -2.2); g.scale.setScalar(0.85);
    world.add(g); monitors.push(screen, screen);
  }

  // Keyboard + mouse
  const kb = new THREE.Group();
  kb.add(rbox(2.9, 0.09, 0.95, 0.04, mat(0xc9ccd2, { metalness: 0.6, roughness: 0.35 })));   // aluminium base
  const keyGeo = new RoundedBoxGeometry(0.15, 0.06, 0.15, 2, 0.025);
  const keyMat = mat(0x2b2d33, { roughness: 0.6 }), keyAlt = mat(0x4a4d55, { roughness: 0.6 });
  const keys = new THREE.InstancedMesh(keyGeo, keyMat, 15 * 5);
  const kAlt = new THREE.InstancedMesh(new RoundedBoxGeometry(1.0, 0.06, 0.15, 2, 0.025), keyAlt, 1);   // space bar
  const m4 = new THREE.Matrix4(); let ki = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
    if (r === 4 && c > 4 && c < 11) continue;
    m4.makeTranslation(-1.26 + c * 0.18 + (r % 2) * 0.04, 0.07, -0.34 + r * 0.17); keys.setMatrixAt(ki++, m4);
  }
  keys.count = ki;
  m4.makeTranslation(0.0, 0.07, 0.34); kAlt.setMatrixAt(0, m4);
  kb.add(keys, kAlt);
  kb.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  kb.scale.setScalar(0.75);
  kb.position.set(0, 3.2, 0.0);
  world.add(kb);
  const mouse = new THREE.Group();
  const mShell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 20), mat(0x2b2d33, { roughness: 0.4 }));
  mShell.scale.set(0.85, 0.42, 1.25);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), mat(0x8a8d95, { metalness: 0.5 }));
  wheel.rotation.z = Math.PI / 2; wheel.position.set(0, 0.08, -0.1);
  const split = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.02, 0.18), mat(0x111214)); split.position.set(0, 0.085, -0.16);
  mouse.add(mShell, wheel, split);
  mouse.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  mouse.position.set(2.4, 3.22, 0.1);
  world.add(mouse);

  const familyTex = new THREE.TextureLoader().load('img/family.jpg');
  familyTex.colorSpace = THREE.SRGBColorSpace;

  // Chair
  const chair = new THREE.Group();
  // Simple office chair in light tones (contrasts with the dark outfit)
  const fabric = mat(0xd9d6cf, { roughness: 0.85 });
  const frameW = mat(0xf4f3ef, { roughness: 0.4 });
  const steel = mat(0xb7b9bd, { metalness: 0.7, roughness: 0.3 });
  const seat = rbox(1.75, 0.28, 1.65, 0.14, fabric); seat.position.y = 2.1;
  const seatShell = rbox(1.65, 0.12, 1.55, 0.06, frameW); seatShell.position.y = 1.93;
  const back = rbox(1.6, 2.1, 0.18, 0.16, fabric); back.position.set(0, 3.45, 0.92); back.rotation.x = -0.14;
  const backFrame = rbox(1.7, 2.2, 0.08, 0.06, frameW); backFrame.position.set(0, 3.45, 1.04); backFrame.rotation.x = -0.14;
  const spine = rbox(0.18, 1.3, 0.12, 0.05, frameW); spine.position.set(0, 2.45, 1.0);
  [-1, 1].forEach((sd) => {                                  // armrests
    const post = rbox(0.1, 0.55, 0.1, 0.04, frameW); post.position.set(sd * 0.92, 2.45, 0.2); chair.add(post);
    const pad = rbox(0.2, 0.08, 0.75, 0.04, mat(0x9a9894, { roughness: 0.7 })); pad.position.set(sd * 0.92, 2.75, 0.15); chair.add(pad);
  });
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 1.25, 16), steel); gas.position.y = 1.25;
  chair.add(seat, seatShell, back, backFrame, spine, gas);
  for (let i = 0; i < 5; i++) {                              // white 5-star base, dark casters
    const a5 = i / 5 * Math.PI * 2;
    const arm = rbox(0.13, 0.09, 0.95, 0.04, frameW);
    arm.position.set(Math.sin(a5) * 0.47, 0.42, Math.cos(a5) * 0.47); arm.rotation.y = a5; chair.add(arm);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mat(0x3a3a40));
    wheel.position.set(Math.sin(a5) * 0.9, 0.18, Math.cos(a5) * 0.9); chair.add(wheel);
  }
  chair.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  chair.position.set(0.2, 0, 1.25);
  chair.rotation.y = 0.25;
  world.add(chair);

  // Avatar (img/avatar/me.glb) seated, playing the Mixamo "typing" loop
  let rigged = null, rHand = null;
  const handPos = new THREE.Vector3(); let reachBest = -Infinity, calibrated = false;
  loadRiggedAvatar({ height: 6.6, animation: 'typing' }).then((r) => {
    if (!r) return;
    rigged = r;
    r.model.rotation.y = Math.PI;        // model faces +Z, the desk is at -Z
    r.model.position.set(0, -1.2, -0.15); // drop the hips onto the seat
    chair.add(r.model);
    // after the typing loop has run briefly, line the keyboard + mouse up under the real hands
    const calibrate = () => {
      chair.updateMatrixWorld(true);
      const L = r.bonePosition('lefthand'), R = r.bonePosition('righthand');
      if (!L || !R) return;
      const deskTop = 3.2;
      const lowest = Math.min(L.y, R.y);
      r.model.position.y += deskTop + 0.12 - lowest;          // hands rest just above the keys
      kb.position.set(L.x + 0.55, 3.2, L.z - 0.22);
      calibrated = true;
    };
    setTimeout(calibrate, 1200);
    rHand = r.bone('righthand');
  });

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
  plant.position.set(4.3, 0, -3.25); plant.scale.setScalar(0.85);
  world.add(plant);

  // Wall shelf with books
  const shelf = rbox(2.4, 0.15, 0.8, 0.05, woodMat);
  shelf.position.set(-2.4, 6.4, -3.2);
  world.add(shelf);
  // Hardcover books with (original) QA-joke titles on the spines
  [['#c0392b', '#f5efe6', 'ASSERT YOURSELF', 0.95], ['#1d3557', '#e6b422', 'FLAKY NO MORE', 0.82], ['#2a6f4e', '#f5efe6', 'THE ART OF NULL', 0.9],
   ['#e6b422', '#2d2a24', 'BUGS: A LOVE STORY', 0.78], ['#3d2b52', '#f5efe6', 'GREEN BUILDS', 0.88]].forEach(([bg, ink, title, hgt], i) => {
    const spine = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = ink; g.fillRect(0, 14, w, 4); g.fillRect(0, h - 18, w, 4);         // gold bands
      g.save(); g.translate(w / 2 + 7, h / 2); g.rotate(-Math.PI / 2);
      g.font = '700 19px Urbanist, sans-serif'; g.textAlign = 'center'; g.fillText(title, 0, 0); g.restore();
    });
    const cover = new THREE.MeshStandardMaterial({ color: bg, roughness: 0.7 });
    const pages = new THREE.MeshStandardMaterial({ color: 0xf3ead8, roughness: 0.9 });
    const spineMat = new THREE.MeshStandardMaterial({ map: spine, roughness: 0.6 });
    // box faces: +x, -x, +y, -y, +z (spine toward viewer), -z
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.2, hgt, 0.62), [cover, cover, pages, pages, spineMat, cover]);
    book.castShadow = true;
    book.position.set(-3.45 + i * 0.22, 6.47 + hgt / 2, -3.15);
    if (i === 4) { book.rotation.z = -0.22; book.position.x += 0.08; }       // last one leans
    world.add(book);
  });


  // Sleeping cat on the rug: "Sleeping CAT" by Andrea Marziano (Sketchfab), credited in the footer
  let catModel = null;
  new GLTFLoader().load('img/cat.glb', (gltf) => {
    const m = gltf.scene;
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
    const k = 2.2 / Math.max(size.x, size.z);               // kitten-sized: ~2.2 units nose-to-tail
    m.scale.setScalar(k);
    m.position.set(-(box.min.x + size.x / 2) * k, -box.min.y * k, -(box.min.z + size.z / 2) * k);
    m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    catModel = new THREE.Group(); catModel.add(m);
    catModel.position.set(-5.2, 0.2, 3.9);
    catModel.rotation.y = Math.atan2(0.2 - (-5.2), 1.25 - 3.9);   // face the avatar
    world.add(catModel);
  });

  // Framed family picture on the wall
  const wallFrame = rbox(1.2, 1.7, 0.12, 0.05, mat(0xd9b27c));
  wallFrame.position.set(5.2, 6.0, -3.42); wallFrame.castShadow = false; world.add(wallFrame);
  const wallPhoto = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.5), new THREE.MeshStandardMaterial({ map: familyTex, roughness: 0.7 }));
  wallPhoto.position.set(5.2, 6.0, -3.35); world.add(wallPhoto);

  // Pin board
  const board = rbox(3.2, 2.1, 0.15, 0.1, mat(0xb08f6e, { roughness: 1 }));
  board.position.set(1.8, 6.9, -3.5);
  board.castShadow = false; world.add(board);
  [[1.0, 7.25, '#fff3c4', [['✓ PASSED', 44], ['247 / 247', 34]], '#2f7d3a'],
   [2.55, 6.65, '#cfe3ff', [['BUG #404', 44], ['fixed ✓', 34]], '#b23a3a'],
   [1.9, 6.35, '#ffd9e0', [['CI ✓', 48], ['green', 34]], '#234ba2']].forEach(([x, y, bg, lines, ink], i) => {
    const note = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), new THREE.MeshStandardMaterial({ map: noteTex(bg, lines, ink), roughness: 0.9 }));
    note.position.set(x, y, -3.41 + i * 0.002);
    note.rotation.z = [0.08, -0.1, 0.05][i];
    world.add(note);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat(['#e0525a', '#3f7de0', '#f0a530'][i], { roughness: 0.3 }));
    pin.position.set(x, y + 0.33, -3.3); pin.castShadow = true; world.add(pin);
  });

  // Desk props: robot, speaker, puzzle cube
  // Small desk robot (original design)
  const robot = new THREE.Group();
  const shell = mat(0xf4f1ec, { roughness: 0.35 });
  const accent = mat(0xff8400, { roughness: 0.4 });
  const rBody = rbox(0.5, 0.42, 0.4, 0.14, shell); rBody.position.y = 0.26;
  const rHead = rbox(0.6, 0.44, 0.45, 0.16, shell); rHead.position.y = 0.72;
  const face = rbox(0.46, 0.28, 0.04, 0.08, mat(0x1f1d24, { roughness: 0.2 }));
  face.position.set(0, 0.72, 0.22);
  const eyeGlow = new THREE.MeshBasicMaterial({ color: 0x5ee3ff });
  const robotEyes = [-0.1, 0.1].map((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.05, 4, 8), eyeGlow); e.position.set(x, 0.73, 0.245); robot.add(e); return e; });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), mat(0x8a8790));
  ant.position.y = 1.04;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), accent);
  bulb.position.y = 1.17;
  [-1, 1].forEach((sd) => { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), accent); a.position.set(sd * 0.3, 0.26, 0); a.rotation.z = sd * 0.35; robot.add(a); });
  const chest = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), accent); chest.position.set(0, 0.28, 0.205);
  robot.add(rBody, rHead, face, ant, bulb, chest);
  robot.traverse((o) => { if (o.isMesh && o.material !== eyeGlow) o.castShadow = true; });
  robot.position.set(-3.2, 3.17, 0.1); robot.rotation.y = 0.5; world.add(robot);
  const speaker = rbox(0.8, 0.9, 0.6, 0.1, mat(0xf0a530));
  speaker.position.set(3.4, 3.62, -1.6); speaker.rotation.y = -0.3; world.add(speaker);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24), mat(0x3b3843));
  cone.rotation.x = Math.PI / 2; cone.position.set(3.3, 3.65, -1.28); world.add(cone);
  const faceColors = ['#e8453c', '#f28c28', '#ffffff', '#ffd23f', '#2fa84f', '#2f6fd6'];
  const cubeMats = faceColors.map((fc) => new THREE.MeshStandardMaterial({ roughness: 0.35, map: canvasTex(192, 192, (g) => {
    g.fillStyle = '#1b1b1f'; g.fillRect(0, 0, 192, 192);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      g.fillStyle = fc; g.beginPath(); g.roundRect(8 + c * 62, 8 + r * 62, 52, 52, 8); g.fill();
    }
  }) }));
  const cube = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.5, 0.5, 3, 0.04), cubeMats);
  cube.castShadow = true;
  cube.position.set(2.6, 3.43, -1.0); cube.rotation.set(0, 0.5, 0); world.add(cube);

  // Desk flag stand: Uzbekistan + USA
  const uzFlag = canvasTex(300, 150, (g, w, h) => {
    g.fillStyle = '#0099b5'; g.fillRect(0, 0, w, h / 3);
    g.fillStyle = '#ffffff'; g.fillRect(0, h / 3, w, h / 3);
    g.fillStyle = '#1eb53a'; g.fillRect(0, 2 * h / 3, w, h / 3);
    g.fillStyle = '#ce1126'; g.fillRect(0, h / 3 - 3, w, 6); g.fillRect(0, 2 * h / 3 - 3, w, 6);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(36, 25, 17, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0099b5'; g.beginPath(); g.arc(43, 25, 15, 0, Math.PI * 2); g.fill();
    const rows = [[3, 0], [4, 1], [5, 2]];  // 12 stars: 3 / 4 / 5, right-aligned
    rows.forEach(([n, r]) => { for (let i = 0; i < n; i++) star(g, 120 - i * 14, 13 + r * 13, 4.5, '#ffffff'); });
  });
  const usFlag = canvasTex(380, 200, (g, w, h) => {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
    g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * 0.4, h * 7 / 13);
    for (let r = 0; r < 9; r++) for (let c = 0; c < (r % 2 ? 5 : 6); c++)
      star(g, 13 + c * 25 + (r % 2 ? 12 : 0), 9 + r * 11.7, 4, '#ffffff');
  });
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 20), mat(0x6b5a48));
  stand.position.set(-1.6, 6.53, -3.15); stand.castShadow = true; world.add(stand);
  [[uzFlag, -0.25], [usFlag, 0.25]].forEach(([tex, tilt], i) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), mat(0xc9b28a, { metalness: 0.4, roughness: 0.4 }));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.33), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }));
    const g = new THREE.Group();
    pole.position.y = 0.65; flag.position.set(0.32, 1.12, 0);
    g.add(pole, flag);
    g.position.set(-1.6, 6.57, -3.15); g.rotation.set(0, 0.25 - i * 0.5, tilt);
    world.add(g);
  });

  // Picture frame on the right wall





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

  // Music notes floating out of the speaker while music plays
  const noteTextures = ['♪', '♫', '♬'].map((ch) => canvasTex(128, 128, (g) => {
    g.fillStyle = '#ffffff'; g.font = '700 104px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 6;
    g.fillText(ch, 64, 70);
  }));
  const noteColors = [0xff8400, 0x234ba2, 0x2fa84f, 0xe0525a];
  const notes = [];
  const speakerPos = new THREE.Vector3(3.3, 4.2, -1.3);
  let lastNote = 0;
  function spawnNote(t) {
    const m = new THREE.SpriteMaterial({ map: noteTextures[notes.length % 3], color: noteColors[Math.floor(Math.random() * 4)], transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(m);
    sp.scale.setScalar(0.55);
    sp.position.copy(speakerPos);
    sp.userData = { born: t, drift: (Math.random() - 0.5) * 0.8, sway: Math.random() * 6 };
    world.add(sp); notes.push(sp);
  }
  function updateNotes(t) {
    if (window.__musicPlaying && t - lastNote > 0.55) { spawnNote(t); lastNote = t; }
    for (let i = notes.length - 1; i >= 0; i--) {
      const n = notes[i], age = t - n.userData.born, life = 3.2;
      n.position.set(
        speakerPos.x + n.userData.drift * age + Math.sin(age * 3 + n.userData.sway) * 0.15,
        speakerPos.y + age * 0.9,
        speakerPos.z + age * 0.25);
      n.material.opacity = Math.min(1, age * 4) * Math.max(0, 1 - age / life);
      n.material.rotation = Math.sin(age * 2 + n.userData.sway) * 0.3;
      if (age > life) { world.remove(n); n.material.dispose(); notes.splice(i, 1); }
    }
  }

  // Message notification: a 💬 bubble pops above the left monitor every ~9s
  const msgTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#234ba2'; g.beginPath(); g.roundRect(18, 30, 220, 160, 48); g.fill();
    g.beginPath(); g.moveTo(70, 180); g.lineTo(60, 236); g.lineTo(120, 186); g.fill();
    g.font = '110px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('💬', 128, 112);
    g.fillStyle = '#e0525a'; g.beginPath(); g.arc(218, 44, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '700 34px Urbanist, sans-serif'; g.fillText('1', 218, 46);
  });
  const msg = new THREE.Sprite(new THREE.SpriteMaterial({ map: msgTex, transparent: true, depthWrite: false, opacity: 0 }));
  msg.position.set(-3.0, 4.7, 0.2);
  world.add(msg);
  let msgStart = -10;
  function updateMessage(t) {
    if (t - msgStart > 9) { msgStart = t; window.sfx?.ding(); }
    const age = t - msgStart;
    const pop = age < 0.35 ? 1 - Math.pow(1 - age / 0.35, 3) * 1 + Math.sin(age / 0.35 * Math.PI) * 0.15 : 1;
    const fade = age < 2.6 ? 1 : Math.max(0, 1 - (age - 2.6) / 0.5);
    msg.material.opacity = fade * Math.min(1, age * 6);
    msg.scale.setScalar(0.75 * pop * (0.85 + 0.15 * fade));
    msg.position.y = 4.7 + Math.sin(age * 4) * 0.04;
    // robot turns its head toward the avatar while it talks, then back to the visitor
    const talking = age < 3.1;
    const toAvatar = Math.atan2(0.2 - robot.position.x, 1.25 - robot.position.z);
    robot.rotation.y += ((talking ? toAvatar : 0.5) - robot.rotation.y) * 0.08;
  }

  const mouseBase = new THREE.Vector3(2.4, 3.22, 0.1);
  const parallax = { x: 0, y: 0 };
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (rigged) rigged.update(Math.min(0.05, t - (frame.last ?? t))); frame.last = t;
    if (!reduceMotion) {
      parallax.x += (pointer.x - parallax.x) * 0.05;
      parallax.y += (pointer.y - parallax.y) * 0.05;
    }
    camera.position.set(camBase.x + parallax.x * 1.2, camBase.y - parallax.y * 0.8, camBase.z);
    camera.lookAt(target);
    if (rHand && calibrated) {                     // learn where the right hand reaches furthest (right + back)
      rHand.getWorldPosition(handPos);
      const score = handPos.x - handPos.z;
      if (score > reachBest) { reachBest = score; mouseBase.set(handPos.x, 3.22, handPos.z); }
    }
    mouse.position.set(mouseBase.x, 3.22, mouseBase.z);
    if (!reduceMotion) {
      updateNotes(t); updateMessage(t);
      if (catModel) catModel.scale.y = 1 + Math.sin(t * 1.6) * 0.015;   // slow breathing
      // robot blinks every ~3.5s
      const bl = (t % 3.5) < 0.14 ? 0.12 : 1;
      robotEyes.forEach((e) => { e.scale.y = bl; });
    }
    // key-click sounds in bursts while the avatar types (music.js reads this)
    window.__typing = !!window.__musicPlaying && !!rigged && Math.sin(t * 0.9) + Math.sin(t * 2.3) * 0.5 > -0.4;

    if (!reduceMotion) {
      plant.rotation.z = Math.sin(t * 0.8) * 0.02;
      monitors[1].material.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.05;
    }
    renderer.render(scene, camera);
  }
  frame();
}
