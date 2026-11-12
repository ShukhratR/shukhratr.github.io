import * as THREE from 'three';
import { buildAvatar } from './avatar.js';

const host = document.getElementById('holo-scene');
if (host) {
  try { init(); } catch { host.classList.add('no-webgl'); }
}

function holoMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor;
      varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main() {
        float fres = pow(1.0 - abs(dot(normalize(vN), vV)), 2.0);
        float scan = 0.55 + 0.45 * step(0.45, fract(vW.y * 22.0 - uTime * 1.5));
        float flick = 0.92 + 0.08 * sin(uTime * 23.0);
        float a = (0.18 + fres * 0.95) * scan * flick;
        gl_FragColor = vec4(uColor * (0.7 + fres), a);
      }`,
  });
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 4.2, 15);
  camera.lookAt(0, 2.6, 0);

  const uniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x4cc3ff) } };
  const holo = holoMaterial(uniforms);

  const avatar = buildAvatar({ pose: 'stand' });
  avatar.group.traverse((o) => { if (o.isMesh) { o.material = holo; o.castShadow = false; } });
  avatar.group.rotation.y = Math.PI; // face the camera (avatar faces -Z)
  const spin = new THREE.Group();
  spin.add(avatar.group);
  spin.position.y = 0.55;
  scene.add(spin);

  // Pedestal + glowing ring + light cone
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.55, 64),
    new THREE.MeshBasicMaterial({ color: 0x0b3a8f }));
  ped.position.y = 0.27;
  scene.add(ped);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.05, 12, 96),
    new THREE.MeshBasicMaterial({ color: 0x8fe1ff }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.56;
  scene.add(ring);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.8, 64),
    new THREE.MeshBasicMaterial({ color: 0x3fb4ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.555;
  scene.add(disc);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 1.8, 5.5, 64, 1, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ',
      fragmentShader: 'varying float vY; void main(){ gl_FragColor = vec4(0.3,0.75,1.0, 0.22*(1.0-vY)); }',
    }));
  cone.position.y = 3.3;
  scene.add(cone);

  // Dotted polar floor grid
  const pts = [];
  for (let r = 3; r <= 22; r += 1.6) {
    const n = Math.floor(r * 4);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x6fb8ff, size: 0.07, transparent: true, opacity: 0.5 })));
  const grid = new THREE.PolarGridHelper(22, 16, 12, 64, 0x2a63c4, 0x2a63c4);
  grid.material.transparent = true; grid.material.opacity = 0.25;
  scene.add(grid);

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 20 : 15;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    if (!reduce) {
      const r = host.getBoundingClientRect();
      const p = 1 - (r.top + r.height) / (window.innerHeight + r.height); // 0..1 through viewport
      spin.rotation.y = Math.sin(t * 0.4) * 0.35 + (p - 0.5) * 1.2;
      spin.position.y = 0.55 + Math.sin(t * 1.5) * 0.06;
    }
    renderer.render(scene, camera);
  })();
}
