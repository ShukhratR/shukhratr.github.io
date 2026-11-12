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
export function buildAvatar({ pose = 'sit' } = {}) {
  // Softer, lighter palette: charcoal blazer reads as "black" without crushing to pure dark
  const SKIN = 0xf1c6a2, HAIR = 0x3a2a22, BLAZER = 0x45475a, TEE = 0xfaf7ee,
        PANTS = 0x5a5d70, SHOE = 0xfbfaf7, SOLE = 0x8a8578;
  const skin = mat(SKIN, { roughness: 0.5 });
  const hair = mat(HAIR, { roughness: 0.6 });
  const blazer = mat(BLAZER, { roughness: 0.55 });
  const group = new THREE.Group();
  const add = (parent, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh; };

  // Legs
  [-0.27, 0.27].forEach((x) => {
    if (pose === 'stand') {
      add(group, rbox(0.46, 1.2, 0.46, 0.2, mat(PANTS)), x, 1.85, 0);
      add(group, rbox(0.4, 1.15, 0.4, 0.18, mat(PANTS)), x, 0.8, 0);
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
  add(group, rbox(1.2, 1.35, 0.75, 0.32, blazer), 0, 3.05, 0.05);
  add(group, rbox(0.42, 1.05, 0.08, 0.04, mat(TEE)), 0, 3.15, -0.31);
  // lapels
  [-1, 1].forEach((s) => {
    const lapel = add(group, rbox(0.16, 0.8, 0.06, 0.03, mat(0x363848)), s * 0.27, 3.2, -0.33);
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
  // swept-up quiff: one smooth volume across the front + a softer crown wave
  const quiff = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 20), hair), 0.04, 0.52, -0.22);
  quiff.scale.set(1.45, 0.62, 1.05);
  quiff.rotation.set(-0.35, 0, 0.08);
  const crown = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 20), hair), -0.02, 0.6, 0.12);
  crown.scale.set(1.4, 0.5, 1.2);
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
