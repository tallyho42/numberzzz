let ctx: AudioContext | null = null;

export function unlockSound() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  void ctx?.resume();
}

function tone(freq: number, start: number, dur: number, vol = 0.12, type: OscillatorType = 'sine') {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/** Soft rising chime for a correct answer. */
export const chime = () => {
  tone(1046.5, 0, 0.35);
  tone(1318.5, 0.09, 0.35);
  tone(1568, 0.18, 0.5);
};

/** Tiny pop when something gets marked. */
export const pop = () => tone(880, 0, 0.12, 0.08, 'triangle');

/** Gentle low "hmm" for a miss — never harsh. */
export const soft = () => {
  tone(392, 0, 0.18, 0.06, 'triangle');
  tone(349, 0.12, 0.25, 0.05, 'triangle');
};

export const fanfare = () => {
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, i * 0.12, 0.5, 0.1));
};

/** One soft cartoon "woof": a falling growly tone with a puff of noise, at time offset `start`. */
function woof(start: number, pitch = 1) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(330 * pitch, t0);
  o.frequency.exponentialRampToValueAtTime(520 * pitch, t0 + 0.04);
  o.frequency.exponentialRampToValueAtTime(190 * pitch, t0 + 0.16);
  f.type = 'bandpass';
  f.frequency.value = 900 * pitch;
  f.Q.value = 1.4;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.32, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  o.connect(f).connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + 0.25);
  const n = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.12), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = buf;
  const ng = ctx.createGain();
  ng.gain.value = 0.1;
  n.connect(f);
  n.connect(ng).connect(ctx.destination);
  n.start(t0);
}

export const bark = (times = 2) => {
  for (let i = 0; i < times; i++) woof(i * 0.26, 1 + (i % 2) * 0.06);
};

/** A springy "boing" for jumps. */
export const boing = () => {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(220, t0);
  o.frequency.exponentialRampToValueAtTime(660, t0 + 0.18);
  o.frequency.exponentialRampToValueAtTime(330, t0 + 0.4);
  g.gain.setValueAtTime(0.12, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + 0.5);
};

/** A whinny: wobbly falling tone. */
export const neigh = () => {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(900, t0);
  o.frequency.exponentialRampToValueAtTime(380, t0 + 0.9);
  lfo.frequency.value = 14;
  lg.gain.value = 60;
  lfo.connect(lg).connect(o.frequency);
  f.type = 'bandpass';
  f.frequency.value = 1400;
  f.Q.value = 1.2;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.16, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
  o.connect(f).connect(g).connect(ctx.destination);
  o.start(t0);
  lfo.start(t0);
  o.stop(t0 + 1.05);
  lfo.stop(t0 + 1.05);
};

/** A quick slurp/lick. */
export const slurp = () => {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(300, t0);
  o.frequency.exponentialRampToValueAtTime(1200, t0 + 0.15);
  g.gain.setValueAtTime(0.08, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + 0.2);
};
