// Original lo-fi loop generated with Web Audio (no audio files). Off until the visitor turns it on.
const btn = document.querySelector('.sound-toggle');
let ctx, master, timer, step = 0, playing = false;
const BPM = 78, STEP = 60 / BPM / 2;                 // eighth notes
const CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]]; // Am7 Fmaj7 G7 Em7
const BASS = [45, 41, 43, 40];
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function setup() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
  master.connect(lp).connect(ctx.destination);
}
function tone(freq, t, dur, type, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(t, dur, vol, hp) {
  const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
  s.buffer = b; s.connect(f).connect(g).connect(master); s.start(t);
}
function kick(t) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.32);
}
function schedule() {
  const now = ctx.currentTime;
  while (nextTime < now + 0.2) {
    const bar = Math.floor(step / 8) % 4, beat = step % 8, t = nextTime + (beat % 2 ? 0.04 : 0); // swing
    if (beat === 0) CHORDS[bar].forEach((m) => tone(hz(m), t, STEP * 7, 'triangle', 0.06));
    if (beat === 0 || beat === 3) tone(hz(BASS[bar]), t, STEP * 2.5, 'sine', 0.22);
    if (beat === 0 || beat === 5) kick(t);
    if (beat === 4) noise(t, 0.18, 0.12, 1500);            // snare-ish
    noise(t, 0.04, beat % 2 ? 0.03 : 0.05, 7000);          // hats
    if (beat === 6 && Math.random() < 0.5) tone(hz(CHORDS[bar][3] + 12), t, STEP * 2, 'sine', 0.05);
    nextTime += STEP; step++;
  }
}
let nextTime = 0;
function toggle() {
  if (!ctx) setup();
  playing = !playing;
  if (playing) {
    ctx.resume(); nextTime = ctx.currentTime + 0.05;
    timer = setInterval(schedule, 50);
    master.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 1);
  } else {
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    setTimeout(() => clearInterval(timer), 450);
  }
  btn.classList.toggle('is-on', playing);
  btn.setAttribute('aria-pressed', String(playing));
  btn.setAttribute('aria-label', playing ? 'Turn music off' : 'Turn music on');
}
btn?.addEventListener('click', toggle);
