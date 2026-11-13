import * as THREE from 'three';
import { buildAvatar, mat, rbox } from './avatar.js';
import { loadRiggedAvatar } from './avatar-loader.js';

const host = document.getElementById('contact-scene');
if (host) { try { init(); } catch { host.remove(); } }

function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(1.5, 4.6, 15);
  camera.lookAt(1.2, 3.0, 0);

  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c3a5, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(5, 10, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
  sun.shadow.radius = 5;
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // Avatar: standing, arms crossed, facing the visitor
  const avatar = buildAvatar({ pose: 'stand' });
  avatar.group.rotation.y = Math.PI - 0.15;
  avatar.crossArms();
  scene.add(avatar.group);
  let rigged = null;
  loadRiggedAvatar({ height: 6.4, animation: 'crossed' }).then((r) => {
    if (!r) return;
    rigged = r;
    avatar.group.visible = false;
    r.model.rotation.y = -0.15;
    scene.add(r.model);
  });

  // QA props
  const clip = new THREE.Group();
  const board = rbox(1.5, 2.0, 0.08, 0.06, mat(0xb08f6e));
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.7), new THREE.MeshStandardMaterial({ map: tex(260, 340, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2d2a24'; g.font = '700 26px Urbanist, sans-serif'; g.fillText('Test run', 22, 44);
    ['Login flow', 'Checkout', 'Loan booking', 'API contract', 'Regression'].forEach((t, i) => {
      g.fillStyle = '#2fa84f'; g.font = '700 26px sans-serif'; g.fillText('✓', 22, 96 + i * 50);
      g.fillStyle = '#5f5646'; g.font = '500 22px Urbanist, sans-serif'; g.fillText(t, 58, 96 + i * 50);
    });
  }) }));
  sheet.position.z = 0.05;
  const clamp = rbox(0.6, 0.18, 0.12, 0.04, mat(0x9a9aa2, { metalness: 0.6, roughness: 0.3 })); clamp.position.y = 0.95;
  clip.add(board, sheet, clamp);
  clip.position.set(3.4, 1.05, 0.6); clip.rotation.set(-0.25, -0.35, 0.05);
  clip.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(clip);

  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.65, 24), mat(0xff8400, { roughness: 0.4 }));
  mug.position.set(4.6, 0.33, 1.6); mug.castShadow = true; scene.add(mug);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), mat(0xff8400));
  handle.position.set(4.95, 0.35, 1.6); scene.add(handle);

  // little robot buddy
  const robot = new THREE.Group();
  const shell = mat(0xf4f1ec, { roughness: 0.35 }), accent = mat(0xff8400);
  const b = rbox(0.8, 0.7, 0.6, 0.2, shell); b.position.y = 0.4;
  const h = rbox(0.95, 0.7, 0.7, 0.25, shell); h.position.y = 1.15;
  const face = rbox(0.75, 0.45, 0.05, 0.12, mat(0x1f1d24)); face.position.set(0, 1.15, 0.34);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x5ee3ff });
  [-0.16, 0.16].forEach((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.08, 4, 8), eyeMat); e.position.set(x, 1.17, 0.37); robot.add(e); });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), accent); bulb.position.y = 1.75;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), mat(0x8a8790)); ant.position.y = 1.6;
  robot.add(b, h, face, bulb, ant);
  robot.traverse((o) => { if (o.isMesh && o.material !== eyeMat) o.castShadow = true; });
  robot.position.set(-2.6, 0, 1.2); robot.rotation.y = 0.5; scene.add(robot);

  // scattered bug reports on the floor
  [[-1.8, 2.6, 0.4, '#fff3c4'], [2.2, 2.9, -0.3, '#ffffff'], [-3.6, 0.2, 0.9, '#cfe3ff'], [5.4, -0.6, 0.2, '#ffffff']].forEach(([x, z, r, c]) => {
    const pTex = tex(200, 260, (g, w, hh) => {
      g.fillStyle = c; g.fillRect(0, 0, w, hh);
      g.fillStyle = '#e0525a'; g.font = '700 24px Urbanist, sans-serif'; g.fillText('BUG', 16, 40);
      g.fillStyle = '#c9c2b5'; for (let i = 0; i < 6; i++) g.fillRect(16, 64 + i * 26, 120 + (i * 37) % 50, 8);
    });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.15), new THREE.MeshStandardMaterial({ map: pTex }));
    paper.rotation.set(-Math.PI / 2, 0, r); paper.position.set(x, 0.01, z); paper.receiveShadow = true; scene.add(paper);
  });

  function resize() {
    const w = host.clientWidth, hh = host.clientHeight;
    renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (rigged) rigged.update(Math.min(0.05, t - (frame.last ?? t))); frame.last = t;
    if (!reduce) {
      avatar.head.rotation.y = Math.sin(t * 0.6) * 0.15;
      avatar.head.rotation.z = Math.sin(t * 0.8) * 0.04;
      avatar.group.position.y = Math.sin(t * 1.6) * 0.03;      // breathing
      robot.rotation.y = 0.5 + Math.sin(t * 0.9) * 0.2;
      bulb.material.emissive?.setHex(Math.sin(t * 4) > 0 ? 0x552200 : 0x000000);
    }
    renderer.render(scene, camera);
  })();
}
