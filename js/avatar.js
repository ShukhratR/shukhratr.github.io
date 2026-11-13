import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...opts });
}
export function rbox(w, h, d, r, material) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// Stylized avatar of Shukhrat: dark wavy hair, full short beard, brown eyes,
// black blazer over an off-white tee. Built in chair-local space, facing -Z.
// ---------------------------------------------------------------------------
export function cap(w, h, material) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(w / 2, Math.max(0.01, h - w), 8, 16), material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function buildAvatar({ pose = 'sit' } = {}) {
  // Softer, lighter palette: charcoal blazer reads as "black" without crushing to pure dark
  const SKIN = 0xe0ad86, HAIR = 0x3a2416, BLAZER = 0x2f3440, TEE = 0x2f3440,
        PANTS = 0x3d5f93, SHOE = 0xfbfaf7, SOLE = 0x3a3a40;
  const skin = mat(SKIN, { roughness: 0.5 });
  const strands = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#3d2417'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {                       // fine strands with lighter streaks
      const x = Math.random() * 256, y = Math.random() * 256, len = 20 + Math.random() * 40;
      g.strokeStyle = Math.random() < 0.25 ? 'rgba(122,78,52,.55)' : 'rgba(28,16,10,.5)';
      g.lineWidth = 0.6 + Math.random() * 1.2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y + len / 2, x + 2, y + len); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
    return t;
  })();
  const hair = new THREE.MeshStandardMaterial({ color: 0x3b2417, roughness: 0.38, metalness: 0.05 });
  // gently lumpy sphere for natural volume
  const lumpy = (r, ws, hs, phiS, phiL, thS, thL, amp = 0.025) => {
    const geo = new THREE.SphereGeometry(r, ws, hs, phiS, phiL, thS, thL);
    const pos = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = Math.sin(v.x * 9) * Math.cos(v.z * 8) + Math.sin(v.y * 11 + v.x * 4) * 0.6;
      v.multiplyScalar(1 + n * amp);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const blazer = mat(BLAZER, { roughness: 0.55 });
  const group = new THREE.Group();
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

  // Legs
  [-0.27, 0.27].forEach((x) => {
    if (pose === 'stand') {
      add(group, cap(0.48, 1.25, mat(PANTS)), x, 1.85, 0);
      add(group, cap(0.42, 1.2, mat(PANTS)), x, 0.8, 0);
      add(group, rbox(0.44, 0.24, 0.72, 0.11, mat(SHOE)), x, 0.16, -0.12);
      add(group, rbox(0.45, 0.07, 0.74, 0.03, mat(SOLE)), x, 0.03, -0.12);
    } else {
      add(group, rbox(0.44, 0.4, 1.25, 0.18, mat(PANTS)), x, 2.45, -0.45);
      add(group, rbox(0.38, 1.9, 0.38, 0.17, mat(PANTS)), x, 1.5, -1.0);
      add(group, rbox(0.42, 0.22, 0.7, 0.1, mat(SHOE)), x, 0.5, -1.12);
      add(group, rbox(0.43, 0.07, 0.72, 0.03, mat(SOLE)), x, 0.38, -1.12);
    }
  });

  // Torso: blazer + tee
  add(group, rbox(1.15, 1.35, 0.72, 0.34, blazer), 0, 3.05, 0.05);
  // tee collar
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 20), mat(TEE));
  collar.rotation.x = Math.PI / 2;
  add(group, collar, 0, 3.72, 0);

  // Arms (shoulder pivot -> elbow pivot)
  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.68, 3.55, 0.02);
    add(shoulder, cap(0.38, 0.6, blazer), 0, -0.22, 0);
    add(shoulder, cap(0.3, 0.55, skin), 0, -0.55, 0);
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.72, 0);
    add(elbow, cap(0.28, 0.8, skin), 0, -0.34, 0);
    add(elbow, new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), skin), 0, -0.78, 0);
    shoulder.add(elbow);
    group.add(shoulder);
    return { shoulder, elbow };
  }
  const armL = arm(-1), armR = arm(1);

  // Neck + head
  add(group, new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 16), skin), 0, 3.9, 0);
  const head = new THREE.Group();
  head.position.set(0, 4.45, 0);
  head.scale.setScalar(1.42); head.position.y = 4.9;
  group.add(head);

  const skull = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.62, 40, 32), skin), 0, 0, 0);
  skull.scale.set(0.9, 1.14, 0.94);
  // ears
  [-1, 1].forEach((s) => {
    const ear = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), skin), s * 0.56, -0.04, 0.02);
    ear.scale.set(0.45, 1, 0.75);
  });

  // Hair: back shell, top cap, voluminous wavy front swept up
  // Realistic classic short cut: shell down to ears/nape, volume on top, side-swept fringe
  const shell = add(head, new THREE.Mesh(lumpy(0.665, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.46), hair), 0, 0.04, 0.04);
  shell.scale.set(1.04, 1.08, 1.04);
  shell.rotation.x = 0.32;   // hairline higher at the forehead, lower at the back
  const nape = add(head, new THREE.Mesh(lumpy(0.66, 40, 24, 0, Math.PI, Math.PI * 0.45, Math.PI * 0.2), hair), 0, 0.02, 0.05);
  nape.scale.set(1.03, 1.05, 1.03);
  // Tousled quiff: tapered teardrop locks sweeping up and back
  const prof = [];
  for (let i = 0; i <= 14; i++) {                 // round base -> pointed tip
    const k = i / 14;
    prof.push(new THREE.Vector2(Math.sin(Math.min(1, k * 1.8) * Math.PI / 2) * Math.pow(1 - k, 0.55) * 0.24, k * 0.5));
  }
  const lockGeo = new THREE.LatheGeometry(prof, 20);
  // [x, y, z, tiltX (back), tiltZ (side), scale]
  [[-0.3, 0.42, -0.36, -1.15, 0.3, 1.0], [-0.1, 0.46, -0.42, -1.05, 0.1, 1.1], [0.12, 0.46, -0.42, -1.1, -0.12, 1.05],
   [0.32, 0.42, -0.34, -1.2, -0.35, 0.95], [-0.22, 0.56, -0.12, -1.4, 0.25, 1.05], [0.02, 0.6, -0.16, -1.35, -0.05, 1.15],
   [0.25, 0.56, -0.1, -1.45, -0.3, 1.0], [-0.14, 0.58, 0.16, -1.65, 0.15, 0.95], [0.14, 0.58, 0.18, -1.7, -0.15, 0.95]]
    .forEach(([x, y, z, rx, rz, sc], i) => {
      const l = add(head, new THREE.Mesh(lockGeo, hair), x, y, z);
      l.rotation.set(rx, (i % 3 - 1) * 0.25, rz);
      l.scale.set(sc * 1.15, sc, sc * 0.85);
    });
  // sideburns + soft side-part line
  [-1, 1].forEach((sd) => add(head, new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), hair), sd * 0.63, 0.1, -0.12));

  // Face: eyes, brows, nose, mole
  const eyeMat = mat(0x16131a, { roughness: 0.08 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((s) => {
    const eye = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), eyeMat), s * 0.22, 0.02, -0.55);
    eye.scale.set(0.78, 1.18, 0.5);
    add(head, new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), shine), s * 0.22 + 0.03, 0.07, -0.6);
    const brow = add(head, new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.16, 6, 12), hair), s * 0.22, 0.22, -0.53);
    brow.rotation.z = Math.PI / 2 + s * 0.12;
  });
  add(head, new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0x4a2c1d)), 0.3, -0.12, -0.5);
  const nose = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16), mat(0xd89c74, { roughness: 0.5 })), 0, -0.14, -0.58);
  nose.scale.set(1.15, 0.85, 0.75);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.009, 6, 24, Math.PI * 0.7), mat(0x3a2018));
  smile.rotation.set(0, Math.PI, Math.PI + Math.PI * 0.15);
  add(head, smile, 0, -0.27, -0.52);
  // cheek blush
  [-1, 1].forEach((s) => {
    const blush = add(head, new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xf0a088, transparent: true, opacity: 0.18 })), s * 0.33, -0.1, -0.535);
    blush.rotation.y = Math.PI + s * -0.5;
    blush.castShadow = false;
  });

  let typing = false;
  const L1 = 0.72, L2 = 0.78;                 // upper arm, forearm (to hand centre)
  const tmp = new THREE.Vector3();
  // Two-bone IK: rotate shoulder + elbow so the hand lands on `target` (avatar-group space)
  function reach(a, target) {
    tmp.copy(target).sub(a.shoulder.position);
    const d = Math.min(Math.max(tmp.length(), 0.2), L1 + L2 - 0.02);
    const u = tmp.normalize();
    const elbowBend = Math.PI - Math.acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2));
    const alpha = Math.acos(Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
    const tz = Math.asin(Math.max(-1, Math.min(1, u.x)));
    const tx = Math.atan2(-u.z, -u.y);
    a.shoulder.rotation.set(tx - alpha, 0, tz);
    a.elbow.rotation.set(elbowBend, 0, 0);
  }
  const smooth01 = (e0, e1, x) => { const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
  // targets: { left, right, mouse } as THREE.Vector3 in avatar-group space (set by the scene)
  function animate(t, targets) {
    const c = t % 7;
    const mouseAmt = smooth01(3.6, 4.2, c) - smooth01(6.3, 6.9, c);
    const burst = Math.sin(t * 0.9) + Math.sin(t * 2.3) * 0.5 > -0.4 ? 1 : 0;
    typing = burst === 1;
    if (targets) {
      [[armL, targets.left, 0], [armR, targets.right, 1]].forEach(([a, base, i]) => {
        const press = Math.pow(Math.max(0, Math.sin(t * 11 + i * Math.PI + Math.sin(t * 3) * 0.8)), 3);
        const goal = tmp.copy(base);
        goal.x += Math.sin(t * 1.3 + i * 2) * 0.12 * burst;            // hands wander across the keys
        goal.y += 0.1 - press * 0.08 * burst;                            // lift, then press down onto a key
        if (i === 1 && mouseAmt > 0) goal.lerp(tmp.clone().copy(targets.mouse).add(new THREE.Vector3(0, 0.1, 0)), mouseAmt);
        reach(a, goal.clone());
      });
    }
    // Head scans the monitors; looks right toward the mouse screen while using it
    const scan = Math.sin(t * 0.45) * 0.22 + Math.sin(t * 1.3) * 0.05;
    head.rotation.y = scan * (1 - mouseAmt) - 0.35 * mouseAmt;
    head.rotation.x = Math.sin(t * 0.9) * 0.04 + Math.max(0, Math.sin(t * 0.31)) * 0.06;
    head.rotation.z = Math.sin(t * 0.7) * 0.03;
    api.mouseAmt = mouseAmt;
  }
  const api = { group, head, animate, isTyping: () => typing, mouseAmt: 0,
    // arms folded across the chest (targets in avatar-group space)
    crossArms() {
      reach(armL, new THREE.Vector3(0.42, 3.12, -0.5));
      reach(armR, new THREE.Vector3(-0.42, 3.24, -0.56));
    },
    reset() {
    [armL, armR].forEach((a) => { a.shoulder.rotation.set(0, 0, 0); a.elbow.rotation.set(0, 0, 0); });
  } };
  return api;
}
