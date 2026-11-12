import { store } from './progress';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function unlockSound() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      ctx = new AC();
      master = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
    }
  }
  void ctx?.resume();
}

/** Where every sound goes: silent when sounds are switched off in the parent screen. */
function out(): AudioNode | null {
  if (!ctx || !master) return null;
  master.gain.value = store.settings.sound === false ? 0 : 1.2;
  return master;
}

function tone(freq: number, start: number, dur: number, vol = 0.12, type: OscillatorType = 'sine', slideTo?: number) {
  const dest = out();
  if (!ctx || !dest) return;
  const t0 = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/** A marimba-like note: sine plus a quiet octave that dies fast. */
function mallet(freq: number, start: number, vol = 0.12, dur = 0.45) {
  tone(freq, start, dur, vol);
  tone(freq * 4, start, 0.08, vol * 0.25);
}

/** Filtered noise: rustles, whooshes, pops and crunches. */
function noise(start: number, dur: number, freq: number, vol = 0.1, q = 1, sweepTo?: number) {
  const dest = out();
  if (!ctx || !dest) return;
  const t0 = ctx.currentTime + start;
  const n = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * dur)), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(freq, t0);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  n.connect(f).connect(g).connect(dest);
  n.start(t0);
}

// Pentatonic ladder (C major) for counting: each next item a step higher.
const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760, 2093];

/** Soft wooden knock for any button. */
export const tap = () => {
  tone(520, 0, 0.07, 0.07, 'triangle', 380);
  noise(0, 0.03, 2500, 0.03, 2);
};

/** Screen solved / right answer: a bright little marimba run. */
export const chime = () => {
  mallet(783.99, 0, 0.11);
  mallet(987.77, 0.08, 0.11);
  mallet(1174.66, 0.16, 0.12);
  mallet(1567.98, 0.26, 0.13, 0.7);
};

/** Tiny pop when something gets marked. */
export const pop = () => tone(880, 0, 0.12, 0.08, 'triangle');

/** Counting one more thing: the n-th step up the ladder (1-based). */
export const count = (n: number) => mallet(LADDER[Math.max(0, Math.min(LADDER.length - 1, n - 1))], 0, 0.1, 0.3);

/** Gentle "oh-oh" for a miss – never harsh. */
export const soft = () => {
  tone(440, 0, 0.16, 0.07, 'triangle', 415);
  tone(349.23, 0.15, 0.3, 0.07, 'triangle', 330);
};
export const wrong = soft;

/** A step of the medal path got filled: a sparkle. */
export const star = () => {
  [1567.98, 2093, 2637].forEach((f, i) => tone(f, i * 0.05, 0.25, 0.05));
};

/** Medal: drum roll, fanfare and a shimmer on top. */
export const fanfare = () => {
  for (let i = 0; i < 10; i++) noise(i * 0.045, 0.06, 180, 0.08, 0.8);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => mallet(f, 0.5 + i * 0.12, 0.12, 0.5));
  tone(1046.5, 1.0, 1.0, 0.08, 'triangle');
  tone(1318.5, 1.0, 1.0, 0.06, 'triangle');
  tone(1567.98, 1.0, 1.0, 0.06, 'triangle');
  for (let i = 0; i < 8; i++) tone(2093 + i * 260, 1.1 + i * 0.05, 0.2, 0.025);
};

/** The present appears: a magic shimmer. */
export const magic = () => {
  for (let i = 0; i < 12; i++) tone(LADDER[i % LADDER.length] * 1.5, i * 0.04, 0.35, 0.035);
};

/** Moving on to the next screen. */
export const whoosh = () => noise(0, 0.45, 400, 0.07, 0.7, 2600);

/** A balloon flies away: pop and a rising whistle. */
export const balloon = () => {
  noise(0, 0.08, 1800, 0.18, 0.6);
  tone(600, 0.05, 0.6, 0.05, 'sine', 1800);
};

/** Dice rattling on the table. */
export const rattle = () => {
  for (let i = 0; i < 7; i++) noise(i * 0.07 + Math.random() * 0.02, 0.035, 2200 + Math.random() * 1200, 0.1, 3);
};

/** Crunch crunch: the animal eats a treat. */
export const munch = () => {
  for (let i = 0; i < 3; i++) noise(i * 0.22, 0.12, 900 + i * 150, 0.14, 1.2);
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
  o.connect(f).connect(g).connect(out()!);
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
  n.connect(ng).connect(out()!);
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
  o.connect(g).connect(out()!);
  o.start(t0);
  o.stop(t0 + 0.5);
};

/** A whinny: wobbly falling tone. */
export const neigh = (pitch = 1) => {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(900 * pitch, t0);
  o.frequency.exponentialRampToValueAtTime(380 * pitch, t0 + 0.9);
  lfo.frequency.value = 14;
  lg.gain.value = 60;
  lfo.connect(lg).connect(o.frequency);
  f.type = 'bandpass';
  f.frequency.value = 1400;
  f.Q.value = 1.2;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.16, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1);
  o.connect(f).connect(g).connect(out()!);
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
  o.connect(g).connect(out()!);
  o.start(t0);
  o.stop(t0 + 0.2);
};

/** Curious "hm?" for the head tilt. */
export const wonder = () => tone(330, 0, 0.35, 0.08, 'triangle', 520);

/** Happy trill for the wiggle. */
export const trill = () => {
  for (let i = 0; i < 6; i++) tone(i % 2 ? 1318.5 : 1046.5, i * 0.07, 0.1, 0.05, 'triangle');
};

/** Silly wobble for crossed eyes. */
export const wobble = () => {
  for (let i = 0; i < 4; i++) tone(i % 2 ? 300 : 420, i * 0.1, 0.12, 0.06, 'sine');
};

/** Ear flaps. */
export const flap = (times = 4) => {
  for (let i = 0; i < times; i++) noise(i * 0.27, 0.09, 700, 0.07, 0.8);
};

/** "Hap-čí!" */
export const sneeze = () => {
  tone(500, 0, 0.45, 0.04, 'sine', 900);
  noise(0.5, 0.25, 3000, 0.16, 0.7, 1200);
};

/** Long "auuuu" howl (or anything with a voice-like slide). */
export const howl = (dur = 1.6) => {
  const dest = out();
  if (!ctx || !dest) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lg = ctx.createGain();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(380, t0);
  o.frequency.exponentialRampToValueAtTime(720, t0 + dur * 0.35);
  o.frequency.exponentialRampToValueAtTime(560, t0 + dur * 0.8);
  o.frequency.exponentialRampToValueAtTime(420, t0 + dur);
  lfo.frequency.value = 6;
  lg.gain.value = 14;
  lfo.connect(lg).connect(o.frequency);
  f.type = 'lowpass';
  f.frequency.value = 1300;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.13, t0 + 0.15);
  g.gain.setValueAtTime(0.13, t0 + dur * 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(f).connect(g).connect(dest);
  o.start(t0);
  lfo.start(t0);
  o.stop(t0 + dur + 0.05);
  lfo.stop(t0 + dur + 0.05);
};

/** Sniff: two short airy puffs. */
export const sniff = () => {
  noise(0, 0.07, 3500, 0.06, 1.5);
  noise(0.11, 0.07, 3800, 0.06, 1.5);
};

/** Breath in before a sneeze. */
export const inhale = () => noise(0, 0.6, 900, 0.05, 0.8, 2500);

/** The sneeze itself. */
export const achoo = () => {
  tone(700, 0, 0.12, 0.06, 'triangle', 420);
  noise(0.02, 0.3, 2800, 0.18, 0.6, 1000);
};

/** Panting with the tongue out. */
export const pant = (times = 4) => {
  for (let i = 0; i < times; i++) noise(i * 0.22, 0.12, 1500, 0.06, 0.9);
};

/** Wet-dog shake: fast flappy rattle. */
export const shake = () => {
  for (let i = 0; i < 9; i++) noise(i * 0.075, 0.06, 900 + (i % 2) * 400, 0.08, 1);
};

/** Soft thud of landing. */
export const thud = () => tone(160, 0, 0.12, 0.12, 'sine', 70);

/** Chomp: one bite. */
export const chomp = () => noise(0, 0.09, 1100, 0.15, 1.3);

/** Peekaboo reveal. */
export const peek = () => {
  tone(660, 0, 0.12, 0.08, 'triangle', 990);
  tone(990, 0.12, 0.2, 0.08, 'triangle');
};

/** The turtle's voice: a tiny happy "pip-pip". */
export const squeak = () => {
  tone(1100, 0, 0.09, 0.07, 'triangle', 1500);
  tone(1250, 0.11, 0.1, 0.07, 'triangle', 1700);
};

/** The turtle's song: a slow, cheerful hum up and down. */
export const hum = () => {
  [392, 440, 523.25, 587.33, 523.25, 659.25].forEach((f, i) => mallet(f, i * 0.26, 0.09, 0.4));
};

/** Unicorn magic: a glittering run with a high whinny. */
export const sparkle = () => {
  for (let i = 0; i < 7; i++) tone(LADDER[(i * 2) % LADDER.length] * 2, i * 0.05, 0.25, 0.03, 'triangle');
};

/** Hiding in the shell (and popping out again). */
export const tuck = () => tone(500, 0, 0.18, 0.08, 'sine', 180);

/** One brush stroke crossing a picture off. */
export const swish = () => noise(0, 0.2, 1800, 0.09, 0.9, 700);
