// Loads a rigged avatar (img/avatar/me.glb, e.g. from Avaturn) and Mixamo animation clips
// (img/avatar/*.fbx, "Without Skin"). Assets load once and are shared; every scene gets its own
// clone + AnimationMixer. Resolves to null when me.glb is missing, so scenes keep the built-in avatar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE = 'img/avatar/';
const CLIPS = { typing: 'typing.fbx', idle: 'idle.fbx', greeting: 'greeting.fbx' };

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

/**
 * @param {{ height?: number, animation?: string, once?: boolean }} opts
 *   height: target model height in scene units; animation: clip to start with.
 * @returns {Promise<null | { model, mixer, play(name, fade?): void, update(dt): void, has(name): boolean }>}
 */
export async function loadRiggedAvatar({ height = 6.2, animation = 'idle', once = false } = {}) {
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
    play(name, fade = 0.4, opts = {}) {
      const next = actions[name];
      if (!next || next === current) return;
      next.reset().setEffectiveWeight(1);
      if (opts.once) { next.setLoop(THREE.LoopOnce, 1); next.clampWhenFinished = true; }
      if (fade > 0) next.fadeIn(fade);
      next.play();
      if (current) current.fadeOut(fade);
      current = next;
    },
    update(dt) { mixer.update(dt); },
    bone(name) { let f = null; model.traverse((o) => { if (!f && o.isBone && norm(o.name) === name) f = o; }); return f; },
    // world position of a bone (e.g. 'lefthand')
    bonePosition(name, target = new THREE.Vector3()) {
      const b = api.bone(name);
      return b ? b.getWorldPosition(target) : null;
    },
  };
  if (actions[animation]) api.play(animation, 0, { once });   // start instantly: no fade from the T-pose
  else applyPose(model, pose);   // no clip yet: hold a natural static pose instead of a T-pose
  return api;
}
