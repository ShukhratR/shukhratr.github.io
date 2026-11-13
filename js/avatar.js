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
  const SKIN = 0xf1c6a2, HAIR = 0x4a2c1d, BLAZER = 0x3f3f46, TEE = 0x3f3f46,
        PANTS = 0x3d5f93, SHOE = 0xfbfaf7, SOLE = 0x3a3a40;
  const skin = mat(SKIN, { roughness: 0.5 });
  const hair = mat(HAIR, { roughness: 0.6 });
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
  add(group, new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.35, 16), skin), 0, 3.82, 0);
  const head = new THREE.Group();
  head.position.set(0, 4.45, 0);
  head.scale.setScalar(1.42); head.position.y = 4.7;
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
  const hairCap = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.665, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.3), hair), 0, 0.06, 0);
  hairCap.scale.set(1.02, 1.1, 1.0);
  // Classic short hair: smooth top volume with a swept side-part fringe
  const top = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 20), hair), 0.02, 0.36, 0.0);
  top.scale.set(1.12, 0.62, 1.1);
  const fringe = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 20), hair), 0.12, 0.44, -0.3);
  fringe.scale.set(1.35, 0.45, 0.8);
  fringe.rotation.set(-0.25, 0, -0.18);
  const part = add(head, new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.5), mat(0x2e1c13)), -0.22, 0.6, -0.05);
  part.rotation.x = -0.2;

  // Happy open smile (clean-shaven)
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24, Math.PI, Math.PI), mat(0x7a2e2a, { roughness: 0.4 }));
  mouth.rotation.y = Math.PI; mouth.scale.set(1.15, 0.85, 1);
  add(head, mouth, 0, -0.24, -0.6);
  const teeth = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  teeth.rotation.y = Math.PI;
  add(head, teeth, 0, -0.26, -0.605);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018, 8, 20, Math.PI), mat(0xc77a68));
  lip.rotation.set(0, Math.PI, Math.PI); lip.scale.set(1, 0.75, 1);
  add(head, lip, 0, -0.235, -0.6);

  // Face: eyes, brows, nose, mole
  const eyeMat = mat(0x3a2418, { roughness: 0.2 });
  const shine = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-1, 1].forEach((s) => {
    const eye = add(head, new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 16), eyeMat), s * 0.22, 0.02, -0.55);
    eye.scale.set(0.85, 1.1, 0.55);
    add(head, new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), shine), s * 0.22 + 0.03, 0.07, -0.6);
    const brow = add(head, rbox(0.25, 0.07, 0.06, 0.03, hair), s * 0.22, 0.22, -0.56);
    brow.rotation.z = s * -0.08;
  });
  add(head, new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), skin), 0, -0.05, -0.59).scale.set(0.9, 1.15, 0.7);
  add(head, new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0x6b4632)), 0.3, -0.1, -0.55);
  // cheek blush
  [-1, 1].forEach((s) => {
    const blush = add(head, new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xf0a088, transparent: true, opacity: 0.5 })), s * 0.33, -0.1, -0.535);
    blush.rotation.y = Math.PI + s * -0.5;
    blush.castShadow = false;
  });

  let typing = false;
  const mouseOffset = { x: 0, z: 0 };
  const smooth01 = (e0, e1, x) => { const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
  function animate(t, turn = 0) {
    const typeAmt = 1 - turn;
    // ~7s loop: type with both hands, then the right hand moves the mouse
    const c = t % 7;
    const mouseAmt = (smooth01(3.6, 4.2, c) - smooth01(6.3, 6.9, c)) * typeAmt;
    const burst = Math.sin(t * 0.9) + Math.sin(t * 2.3) * 0.5 > -0.4 ? 1 : 0;
    [armL, armR].forEach((a, i) => {
      const press = Math.pow(Math.max(0, Math.sin(t * 11 + i * Math.PI + Math.sin(t * 3) * 0.8)), 3);
      const tap = press * 0.16 * burst * typeAmt;
      // typing pose
      let sx = 1.2 * typeAmt + 0.35 * turn - tap * 0.25;
      let sz = (i ? 1 : -1) * 0.12 * typeAmt + (i ? -1 : 1) * 0.18 * turn;
      let ex = (0.28 - tap) * typeAmt + 1.1 * turn;
      let ez = (i ? -1 : 1) * (0.15 + Math.sin(t * 1.7 + i) * 0.04) * typeAmt;
      if (i === 1 && mouseAmt > 0) {
        // mouse pose: hand out to the right, small sliding motions
        const mx = Math.sin(t * 2.1) * 0.06 + Math.sin(t * 5.3) * 0.02;
        const mz = Math.cos(t * 1.7) * 0.05;
        sx += (1.05 + mz - sx + tap * 0.25) * mouseAmt;
        sz += (0.42 + mx - sz) * mouseAmt;
        ex += (0.4 - ex) * mouseAmt;
        ez += (-0.25 - ez) * mouseAmt;
        mouseOffset.x = mx * 1.6 * mouseAmt; mouseOffset.z = -mz * 1.4 * mouseAmt;
      } else if (i === 1) { mouseOffset.x = 0; mouseOffset.z = 0; }
      a.shoulder.rotation.set(sx, 0, sz);
      a.elbow.rotation.set(ex, 0, ez);
    });
    typing = burst === 1 && typeAmt > 0.5;
    // Head: scans between the two monitors, turns toward the right screen while using the mouse, small nods
    const scan = Math.sin(t * 0.45) * 0.22 + Math.sin(t * 1.3) * 0.05;
    head.rotation.y = (scan * (1 - mouseAmt) - 0.38 * mouseAmt) * typeAmt;
    head.rotation.x = (Math.sin(t * 0.9) * 0.04 + Math.max(0, Math.sin(t * 0.31)) * 0.06) * typeAmt - 0.08 * turn;
    head.rotation.z = Math.sin(t * 0.7) * 0.03 * typeAmt;
  }

  return { group, head, animate, isTyping: () => typing, mouseOffset };
}
