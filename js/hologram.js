import * as THREE from 'three';
import { buildAvatar } from './avatar.js';

const host = document.getElementById('holo-scene');
if (host) {
  try { init(); } catch { host.classList.add('no-webgl'); }
}

function holoMaterial(uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, clipping: true,
    vertexShader: `
      #include <clipping_planes_pars_vertex>
      varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        #include <clipping_planes_vertex>
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      #include <clipping_planes_pars_fragment>
      uniform float uTime; uniform vec3 uColor;
      varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main() {
        #include <clipping_planes_fragment>
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 7.2, 15.5);
  camera.lookAt(0, 3.9, 0);

  const uniforms = { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x4cc3ff) } };
  const holo = holoMaterial(uniforms);

  renderer.localClippingEnabled = true;
  const scanY = { value: 0 };
  const keepAbove = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const keepBelow = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  holo.clippingPlanes = [keepBelow];

  const spin = new THREE.Group();
  spin.position.y = 0.55;
  scene.add(spin);
  const colored = buildAvatar({ pose: 'stand' });
  colored.group.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.clippingPlanes = [keepAbove]; } });
  const ghost = buildAvatar({ pose: 'stand' });
  ghost.group.traverse((o) => { if (o.isMesh) o.material = holo; });
  [colored, ghost].forEach((a) => { a.group.rotation.y = Math.PI; spin.add(a.group); });

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a5fae, 1.5));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(3, 8, 10);
  scene.add(key);

  // bright scan ring that travels with the clip plane
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.03, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xbff0ff, transparent: true, blending: THREE.AdditiveBlending }));
  scanRing.rotation.x = Math.PI / 2;
  scene.add(scanRing);

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
      uniforms: { uBeam: { value: 0 } },
      fragmentShader: 'uniform float uBeam; varying float vY; void main(){ gl_FragColor = vec4(0.3,0.75,1.0, 0.22*(1.0-vY)*uBeam); }',
    }));
  cone.position.y = 3.3;
  scene.add(cone);

  // Square perspective grid with dots at the intersections
  const grid = new THREE.GridHelper(44, 22, 0x2a63c4, 0x2a63c4);
  grid.material.transparent = true; grid.material.opacity = 0.3;
  scene.add(grid);
  const pts = [];
  for (let x = -22; x <= 22; x += 2) for (let z = -22; z <= 22; z += 2) pts.push(x, 0.01, z);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x8fd0ff, size: 0.09, transparent: true, opacity: 0.7 })));

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 19 : 15.5;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();

  // Story: beige hero lifts away -> avatar scanned into hologram -> cards appear
  const track = document.querySelector('.story-track');
  const heroPanel = document.querySelector('.hero');
  const counter = document.querySelector('.holo-badge');
  const cards = [...document.querySelectorAll('.holo-card')];
  const header = document.querySelector('.header');
  const forcedParam = new URLSearchParams(location.search).get('p');
  const forced = forcedParam !== null ? Number(forcedParam) : null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const TOP = 7.0, BOTTOM = 0.55;  // avatar height range in world Y
  let progress = 0, smooth = 0;

  function readScroll() {
    const r = track.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    progress = forced ?? (span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0);
    header.classList.toggle('is-dark', r.top < -window.innerHeight * 0.3 && r.bottom > 80);
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    const t = clock.getElapsedTime();
    smooth += (progress - smooth) * (reduce || forced !== null ? 1 : 0.12);

    const lift = ease(seg(smooth, 0, 0.3));
    heroPanel.style.transform = `translateY(${-lift * 115}%) rotate(${-lift * 5}deg)`;
    heroPanel.style.visibility = lift >= 1 ? 'hidden' : '';

    const scan = seg(smooth, 0.34, 0.76);            // 0 = full color, 1 = full hologram
    const y = BOTTOM + (TOP - BOTTOM) * scan;          // scan rises from the feet up
    keepAbove.constant = -y; keepBelow.constant = y;
    scanRing.position.y = y;
    cone.material.uniforms.uBeam.value = seg(smooth, 0.3, 0.4);
    scanRing.visible = scan > 0 && scan < 1;
    counter.textContent = String(Math.round(scan * 100)).padStart(3, '0');
    cards.forEach((c, i) => c.classList.toggle('is-visible', smooth > 0.4 + i * 0.12));

    // turn around: back to the viewer (as at the desk) -> facing front, centered
    spin.rotation.y = reduce ? 0 : Math.sin(t * 0.4) * 0.08;   // already facing front after the desk turn
    if (lift < 0.05) return;                           // stage hidden under the hero
    uniforms.uTime.value = t;
    if (!reduce) {
      spin.position.y = 0.55 + Math.sin(t * 1.5) * 0.05;
    }
    renderer.render(scene, camera);
  })();
}
