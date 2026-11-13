// Loads a rigged avatar (img/avatar/me.glb, e.g. from Avaturn) and Mixamo animation clips
// (img/avatar/*.fbx, "Without Skin"). Assets load once and are shared; every scene gets its own
// clone + AnimationMixer. Resolves to null when me.glb is missing, so scenes keep the built-in avatar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE = 'img/avatar/';
const CLIPS = { typing: 'typing.fbx', idle: 'idle.fbx', crossed: 'arms-crossed.fbx', wave: 'wave.fbx' };

// "mixamorig:LeftArm" / "mixamorigLeftArm" / "LeftArm" -> "leftarm"
const norm = (name) => name.replace(/^.*mixamorig\d*[:_]?/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();

let assetsPromise;
function loadAssets() {
  if (assetsPromise) return assetsPromise;
  const gltfLoader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
  gltfLoader.setDRACOLoader(draco);
  const fbx = new FBXLoader();

  assetsPromise = gltfLoader.loadAsync(BASE + 'me.glb').then(async (gltf) => {
    const clips = {};
    await Promise.all(Object.entries(CLIPS).map(async ([key, file]) => {
      try {
        const anim = await fbx.loadAsync(BASE + file);
        if (anim.animations[0]) clips[key] = anim.animations[0];
      } catch { /* optional clip missing */ }
    }));
    return { scene: gltf.scene, clips };
  }).catch(() => null);
  return assetsPromise;
}

// Map Mixamo track names onto the model's bone names; keep only rotations
// (hip translation from Mixamo is in cm and would push the model around).
function retarget(clip, model) {
  const bones = {};
  model.traverse((o) => { if (o.isBone) bones[norm(o.name)] = o.name; });
  const tracks = [];
  clip.tracks.forEach((t) => {
    const [node, prop] = t.name.split('.');
    if (prop !== 'quaternion') return;
    const target = bones[norm(node)];
    if (!target) return;
    const copy = t.clone();
    copy.name = `${target}.quaternion`;
    tracks.push(copy);
  });
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

// Rotate a bone around an axis given in model space (bone world matrices must be current).
const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion();
function rotateModelSpace(bone, axis, angle) {
  bone.parent.getWorldQuaternion(_pq);
  _q.setFromAxisAngle(axis, angle);
  bone.quaternion.premultiply(_pq.clone().invert().multiply(_q).multiply(_pq));
  bone.updateMatrixWorld(true);
}
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
// Static fallback poses used until Mixamo clips are provided (model faces +Z, its left is +X).
function applyPose(model, pose) {
  const b = {};
  model.traverse((o) => { if (o.isBone) b[norm(o.name)] = o; });
  model.updateMatrixWorld(true);
  const r = (name, axis, a) => b[name] && rotateModelSpace(b[name], axis, a);
  r('leftarm', Z, -1.25); r('rightarm', Z, 1.25);               // arms down from T-pose
  if (pose === 'sit' || pose === 'type') {
    r('leftupleg', X, -1.5); r('rightupleg', X, -1.5);          // thighs forward
    r('leftleg', X, 1.5); r('rightleg', X, 1.5);                // shins down
    r('leftarm', X, -0.9); r('rightarm', X, -0.9);              // upper arms forward
    r('leftforearm', X, -0.9); r('rightforearm', X, -0.9);      // forearms to the keyboard
  } else if (pose === 'crossed') {
    r('leftarm', X, -0.35); r('rightarm', X, -0.35);            // elbows slightly forward
    r('leftforearm', X, -1.55); r('rightforearm', X, -1.55);    // forearms forward
    r('leftforearm', Y, -1.25); r('rightforearm', Y, 1.25);     // fold across the chest
  } else {
    r('leftforearm', X, -0.15); r('rightforearm', X, -0.15);    // relaxed
  }
}

/**
 * @param {{ height?: number, animation?: string, pose?: string }} opts
 *   height: target model height in scene units; animation: clip to start with.
 * @returns {Promise<null | { model, mixer, play(name, fade?): void, update(dt): void, has(name): boolean }>}
 */
export async function loadRiggedAvatar({ height = 6.2, animation = 'idle', pose = 'stand' } = {}) {
  const assets = await loadAssets();
  if (!assets) return null;

  const model = SkeletonUtils.clone(assets.scene);
  model.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; }
  });

  // normalise size + put feet on y = 0
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const s = height / (size.y || 1);
  model.scale.setScalar(s);
  model.position.y = -box.min.y * s;

  const wrapper = new THREE.Group();
  wrapper.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  Object.entries(assets.clips).forEach(([key, clip]) => {
    actions[key] = mixer.clipAction(retarget(clip, model));
  });
  let current = null;

  const api = {
    model: wrapper,
    mixer,
    has: (name) => !!actions[name],
    play(name, fade = 0.4) {
      const next = actions[name];
      if (!next || next === current) return;
      next.reset().setEffectiveWeight(1).fadeIn(fade).play();
      if (current) current.fadeOut(fade);
      current = next;
    },
    update(dt) { mixer.update(dt); },
  };
  if (actions[animation]) api.play(animation);
  else applyPose(model, pose);   // no clip yet: hold a natural static pose instead of a T-pose
  return api;
}
