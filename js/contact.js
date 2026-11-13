import * as THREE from 'three';
import { mat, rbox } from './utils.js';
import { loadRiggedAvatar } from './avatar-loader.js';

const host = document.getElementById('contact-scene');
if (host) { try { init(); } catch { host.remove(); } }

function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function init() {
  const AVATAR_X = window.innerWidth > 840 ? 3.6 : 0;   // right half on desktop, centred on phones
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 4.4, 15);
  camera.lookAt(0, 2.8, 0);

  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c3a5, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(5, 10, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8; sun.shadow.camera.right = 8; sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
  sun.shadow.radius = 5;
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  let rigged = null;
  // Avatar: idles, then (once the robot has parked) tells the robot a secret; back to idle afterwards
  loadRiggedAvatar({ height: 6.4, animation: 'idle' }).then((r) => {
    if (!r) return;
    rigged = r;
    r.model.position.x = AVATAR_X;
    scene.add(r.model);
  });



  // QA props
  // little robot buddy
  const robot = new THREE.Group();
  const shell = mat(0xf4f1ec, { roughness: 0.35 }), accent = mat(0xff8400);
  const b = rbox(0.8, 0.7, 0.6, 0.2, shell); b.position.y = 0.55;
  const h = rbox(0.95, 0.7, 0.7, 0.25, shell); h.position.y = 1.25;
  const face = rbox(0.75, 0.45, 0.05, 0.12, mat(0x1f1d24)); face.position.set(0, 1.25, 0.34);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x5ee3ff });
  const eyes = [-0.16, 0.16].map((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.08, 4, 8), eyeMat); e.position.set(x, 1.27, 0.37); robot.add(e); return e; });
  const arms = [-1, 1].map((sd) => {                                // arms with hands
    const pivot = new THREE.Group(); pivot.position.set(sd * 0.46, 0.62, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.3, 4, 10), accent); upper.position.y = -0.2;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), shell); hand.position.y = -0.42;
    pivot.add(upper, hand); pivot.rotation.z = sd * 0.35; robot.add(pivot); return pivot;
  });
  const wheels = [];
  [-1, 1].forEach((sd) => {                                          // wheels
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 20), mat(0x2b2d33)); w.rotation.z = Math.PI / 2; w.position.set(sd * 0.36, 0.16, 0); robot.add(w); wheels.push(w);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.13, 12), accent); hub.rotation.z = Math.PI / 2; hub.position.set(sd * 0.36, 0.16, 0); robot.add(hub);
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), accent); bulb.position.y = 1.85;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), mat(0x8a8790)); ant.position.y = 1.7;
  robot.add(b, h, face, bulb, ant);
  robot.traverse((o) => { if (o.isMesh && o.material !== eyeMat) o.castShadow = true; });
  robot.position.set(-2, 0, 1.5); robot.rotation.y = 0.45; robot.scale.setScalar(1.15); scene.add(robot);

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

  let robotStart = null, parkedAt = null, secretStart = null, secretEnd = null, saidIt = false, backToIdle = false;
  // parking spot: the floor point under the bottom-left of the section (below the links)
  const parkPoint = new THREE.Vector3();
  const findPark = () => {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(window.innerWidth > 840 ? -0.58 : -0.5, -0.93), camera);
    ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), parkPoint);
  };
  function resize() {
    const w = host.clientWidth, hh = host.clientHeight;
    renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); findPark();
  }
  new ResizeObserver(resize).observe(host); resize();

  let visible = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
  }).observe(host);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (rigged) rigged.update(Math.min(0.05, t - (frame.last ?? t))); frame.last = t;
    if (!reduce) {
      // one lap around the avatar, then drive to the bottom-left (under the links) and park
      if (robotStart === null) robotStart = t;
      const lap = Math.min(1, (t - robotStart) / 7);
      let tx, tz;
      if (lap < 1) {
        const a = lap * Math.PI * 2;
        tx = parkPoint.x + Math.cos(a) * 1.4; tz = parkPoint.z - 0.6 + Math.sin(a) * 0.9;
      } else { tx = parkPoint.x; tz = parkPoint.z; }
      const dx = tx - robot.position.x, dz = tz - robot.position.z, dist = Math.hypot(dx, dz);
      const k = lap < 1 ? 0.1 : 0.07;
      robot.position.x += dx * k; robot.position.z += dz * k;
      // once parked: avatar tells the robot a secret, then salutes; robot faces him, then spins once and falls over (stays down)
      if (lap >= 1 && dist < 0.15 && parkedAt === null) parkedAt = t;
      if (rigged && parkedAt !== null && secretStart === null && t - parkedAt > 1.2) {
        rigged.play('secret', 0.4, { once: true }); secretStart = t;
      }
      const secretDur = rigged ? rigged.duration('secret') : 0;
      if (secretStart !== null && secretEnd === null && t > secretStart + secretDur - 0.3) {
        secretEnd = t; rigged.play('salute', 0.4, { once: true });   // secret told: salute
      }
      if (secretEnd !== null && !backToIdle && t > secretEnd + rigged.duration('salute') - 0.3) {
        backToIdle = true; rigged.play('idle', 0.6);                // then settle into the idle loop
      }
      const listening = secretStart !== null && secretEnd === null;
      // after hearing the secret the robot is so shocked it falls over, lies there a moment, then pops back up
      const since = secretEnd !== null ? t - secretEnd : -1;
      const spin = since < 0 ? 0 : Math.min(1, since / 0.9);                    // one full spin in place (0.9s)
      const fall = since < 1.0 ? 0 : Math.min(1, (since - 1.0) / 0.45);         // then tip over and stay down
      const f = fall * fall * (3 - 2 * fall);
      robot.rotation.z = -1.45 * f;
      robot.position.y = -0.12 * f;
      if (since > 0 && !saidIt) { saidIt = true; window.sfx?.ding(); }      const toAvatar = Math.atan2(AVATAR_X - robot.position.x, 0 - robot.position.z);
      const facing = (dist > 0.05 ? Math.atan2(dx, dz) : (listening || secretEnd !== null ? toAvatar : 0.2)) + spin * Math.PI * 2;
      robot.rotation.y += (facing - robot.rotation.y) * 0.1;
      wheels.forEach((w) => { w.rotation.x += dist * k * 4; });
      const blink = (t % 3.2) < 0.14 ? 0.12 : 1; eyes.forEach((e) => { e.scale.y = blink; });
      arms[0].rotation.z = -0.35 - Math.sin(t * 1.8) * 0.15; arms[1].rotation.z = 0.35 + Math.sin(t * 1.8 + 1) * 0.15;
      bulb.material.emissive?.setHex(Math.sin(t * 4) > 0 ? 0x552200 : 0x000000);
    }
    renderer.render(scene, camera);
  })();
}
