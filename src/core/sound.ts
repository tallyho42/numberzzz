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
