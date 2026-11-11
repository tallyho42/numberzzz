/**
 * The theme animal, alive: painted parts (baked images) stacked with crisp ink details on top.
 * It breathes, blinks, looks around and wags; a tap starts a longer routine of several moves
 * (happy hops, wet-dog shake, howl, chasing its tail, sneeze, play bow, curious tilts, licks,
 * peekaboo with its ears). Treats given to it get eaten with chomps and crumbs.
 */
import { h } from './dom';
import * as snd from './sound';
import { paintedImg } from '../paint/runtime';

export type Part = 'tail' | 'body' | 'head' | 'earL' | 'earR';
type Pt = readonly [number, number];

export interface CritterDef {
  /** Images live at art/<id>-<part>.webp. */
  id: string;
  vb: [number, number, number, number];
  parts: Part[];
  pivot: Partial<Record<'head' | 'earL' | 'earR' | 'tail', Pt>>;
  /** Points in the art frame where effects start. */
  anchor: { mouth: Pt; nose: Pt; top: Pt; ground: Pt };
  /** Long floppy ears that can cover the eyes (peekaboo). */
  floppy?: boolean;
  /** Ink details over the head (all expressions; CSS shows the current one). */
  face: string;
  /** Ink details over the body (e.g. leg lines). */
  bodyInk?: string;
  /** Its voice: one bark / neigh. */
  call: () => void;
  /** Long voice (howl / whinny). */
  song: () => void;
}

export type Trick = 'hops' | 'shake' | 'howl' | 'chase' | 'sneeze' | 'bow' | 'curious' | 'lick' | 'peekaboo';
const TRICKS: Trick[] = ['hops', 'shake', 'howl', 'chase', 'sneeze', 'bow', 'curious', 'lick', 'peekaboo'];

export interface Critter {
  el: HTMLElement;
  /** Do a routine now (a random fresh one if not given). */
  trick(name?: Trick): Promise<void>;
  /** Eat a treat (or happily take a present). */
  eat(): Promise<void>;
  /** Where the mouth is, in client px (for flying treats). */
  mouthPoint(): { x: number; y: number };
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const artUrl = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;

/** Transform pose of one part; x/y in % of the art box. */
interface Pose { x: number; y: number; r: number; ry: number; sx: number; sy: number }
const REST: Pose = { x: 0, y: 0, r: 0, ry: 0, sx: 1, sy: 1 };
const css = (p: Pose) => `translate(${p.x}%, ${p.y}%) rotate(${p.r}deg) rotateY(${p.ry}deg) scale(${p.sx}, ${p.sy})`;

/** A part that keeps its pose between moves, so routines chain smoothly. */
class Rig {
  p: Pose = { ...REST };
  constructor(public el: Element | undefined) {}
  private run(frames: Pose[], ms: number, easing: string) {
    if (!this.el) return Promise.resolve();
    const el = this.el as HTMLElement;
    this.p = { ...frames[frames.length - 1] };
    const end = css(this.p);
    const a = el.animate(frames.map((f) => ({ transform: css(f) })), { duration: ms, easing, fill: 'forwards' });
    return Promise.race([a.finished.catch(() => {}), sleep(ms + 80)]).then(() => {
      el.style.transform = end;
      a.cancel();
    });
  }
  /** Move to a pose. */
  to(p: Partial<Pose>, ms: number, easing = 'ease-in-out') {
    return this.run([{ ...this.p }, { ...this.p, ...p }], ms, easing);
  }
  /** Pass through several poses (each relative to the starting pose). */
  path(steps: Partial<Pose>[], ms: number, easing = 'ease-in-out') {
    const start = { ...this.p };
    return this.run([start, ...steps.map((s) => ({ ...start, ...s }))], ms, easing);
  }
  rest(ms = 300) {
    return this.to(REST, ms);
  }
  /** Jump to a pose without animating (e.g. after a full turn). */
  set(p: Partial<Pose>) {
    this.p = { ...this.p, ...p };
    if (this.el) (this.el as HTMLElement).style.transform = css(this.p);
  }
}

// Little painted things that float out of the animal.
const FX = {
  heart: '<path d="M50,86 C30,72 12,58 12,38 C12,24 22,16 33,16 C41,16 47,21 50,28 C53,21 59,16 67,16 C78,16 88,24 88,38 C88,58 70,72 50,86 Z" fill="#D9617F"/>',
  note: '<path d="M38,78 C38,88 22,92 18,84 C14,76 26,68 38,70 L38,18 L76,10 L76,64 C76,74 60,78 56,70 C52,62 64,54 76,56 L76,24 L44,30 Z" fill="#20150E"/>',
  star: '<path d="M50,8 L61,37 L92,38 L67,57 L76,88 L50,70 L24,88 L33,57 L8,38 L39,37 Z" fill="#E2B13F"/>',
  drop: '<path d="M50,10 C62,34 78,50 78,66 C78,82 66,92 50,92 C34,92 22,82 22,66 C22,50 38,34 50,10 Z" fill="#7FA7C4"/>',
  dust: '<ellipse cx="38" cy="58" rx="28" ry="20" fill="#D8CBB2"/><ellipse cx="64" cy="50" rx="24" ry="22" fill="#D8CBB2"/>',
  crumb: '<path d="M30,30 L70,24 L78,64 L36,76 Z" fill="#B9773F"/>',
  ask: '<circle cx="50" cy="50" r="44" fill="#FFFFFF"/><path d="M36,38 C36,22 64,20 64,38 C64,50 50,50 50,62" fill="none" stroke="#20150E" stroke-width="9" stroke-linecap="round"/><circle cx="50" cy="78" r="6" fill="#20150E"/>',
};

export function critter(def: CritterDef, height: number, worn: { head?: string; body?: string } = {}): Critter {
  const [vx, vy, vw, vh] = def.vb;
  const width = (height * vw) / vh;
  const pct = (p: Pt) => [((p[0] - vx) / vw) * 100, ((p[1] - vy) / vh) * 100] as const;
  const origin = (p?: Pt) => (p ? `${pct(p)[0]}% ${pct(p)[1]}%` : '50% 50%');
  const svg = (inner: string, cls = '') => `<svg class="${cls}" viewBox="${def.vb.join(' ')}" aria-hidden="true">${inner}</svg>`;
  const img = (part: Part) => h('img', { src: artUrl(`${def.id}-${part}`), alt: '', draggable: 'false' });

  const el = h('div', { class: 'critter', style: { width: `${width}px`, height: `${height}px` } });
  const inner = h('div', { class: 'c-all' });
  const fxLayer = h('div', { class: 'c-fx' });
  el.append(inner, fxLayer);
  const parts: Partial<Record<Part, HTMLElement>> = {};
  if (def.parts.includes('tail')) {
    parts.tail = h('div', { class: 'c-part c-tail', style: { transformOrigin: origin(def.pivot.tail) } }, img('tail'));
    inner.append(parts.tail);
  }
  parts.body = h('div', { class: 'c-part c-body', html: svg(def.bodyInk ?? '') + (worn.body ? svg(worn.body) : '') });
  parts.body.prepend(img('body'));
  inner.append(parts.body);
  const headEl = h('div', { class: 'c-part c-head', style: { transformOrigin: origin(def.pivot.head) } }, img('head'));
  headEl.insertAdjacentHTML('beforeend', svg(def.face, 'c-face'));
  for (const ear of ['earL', 'earR'] as const) {
    if (!def.parts.includes(ear)) continue;
    parts[ear] = h('div', { class: `c-part c-${ear}`, style: { transformOrigin: origin(def.pivot[ear]) } }, img(ear));
    headEl.append(parts[ear]!);
  }
  if (worn.head) headEl.insertAdjacentHTML('beforeend', svg(worn.head));
  inner.append(headEl);

  const all = new Rig(inner);
  const head = new Rig(headEl);
  const earL = new Rig(parts.earL);
  const earR = new Rig(parts.earR);
  const pupils = new Rig(el.querySelector('.pupils') ?? undefined);
  const tongue = new Rig(el.querySelector('.m-tongue') ?? undefined);

  const mood = (cls: string, on: boolean) => el.classList.toggle(cls, on);
  const clear = () => ['bark', 'joy', 'tongue', 'wonder', 'cross', 'fast'].forEach((c) => mood(c, false));

  /** One floating effect from point `at`, drifting by (dx, dy) % of the box. */
  function fx(kind: keyof typeof FX, at: Pt, dx: number, dy: number, size = 0.13, ms = 1200, spin = 0) {
    const s = Math.round(height * size);
    const [px, py] = pct(at);
    const e = h('div', { class: 'c-fx-item', style: { left: `calc(${px}% - ${s / 2}px)`, top: `calc(${py}% - ${s / 2}px)`, width: `${s}px`, height: `${s}px` }, html: paintedImg(FX[kind], [0, 0, 100, 100], s) });
    fxLayer.append(e);
    const mx = (dx * width) / 100;
    const my = (dy * height) / 100;
    const a = e.animate(
      [
        { transform: 'translate(0,0) scale(0.3) rotate(0deg)', opacity: 0 },
        { transform: `translate(${mx * 0.25}px, ${my * 0.25}px) scale(1) rotate(${spin * 0.3}deg)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${mx}px, ${my}px) scale(0.9) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: ms, easing: 'ease-out' },
    );
    void Promise.race([a.finished.catch(() => {}), sleep(ms + 100)]).then(() => e.remove());
  }
  const A = def.anchor;
  const hearts = (n = 3) => {
    for (let i = 0; i < n; i++) setTimeout(() => fx('heart', A.top, rnd(-25, 25), rnd(-30, -45), rnd(0.1, 0.15), 1400), i * 220);
  };
  const dust = () => {
    fx('dust', A.ground, -22, -4, 0.12, 700);
    fx('dust', A.ground, 22, -4, 0.12, 700);
  };
  const tailFast = (on: boolean) => mood('fast', on);
  const bark = async (times = 1) => {
    for (let i = 0; i < times; i++) {
      def.call();
      mood('bark', true);
      await head.path([{ r: -6, y: -1.5 }, {}], 260);
      mood('bark', false);
      await sleep(80);
    }
  };
  const hop = async (high = 12) => {
    await all.to({ sy: 0.9, sx: 1.06 }, 120, 'ease-out');
    await Promise.all([all.to({ y: -high, sy: 1.05, sx: 0.96 }, 230, 'ease-out'), earL.to({ r: -18 }, 230), earR.to({ r: 18 }, 230)]);
    await Promise.all([all.to({ y: 0, sy: 1, sx: 1 }, 210, 'ease-in'), earL.to({ r: 8 }, 210), earR.to({ r: -8 }, 210)]);
    snd.thud();
    dust();
    await Promise.all([all.path([{ sy: 0.93, sx: 1.04 }, { sy: 1, sx: 1 }], 160), earL.rest(200), earR.rest(200)]);
  };
  const shakeHead = (n = 3, amp = 10, ms = 500) => head.path([...Array.from({ length: n }, (_, i) => ({ r: i % 2 ? -amp : amp })), {}], ms);

  const routines: Record<Trick, () => Promise<unknown>> = {
    // Happy hops: perk up, three hops with dust, a bark at the top, hearts and a tongue to finish.
    hops: async () => {
      tailFast(true);
      mood('joy', true);
      await Promise.all([earL.to({ r: -14 }, 250), earR.to({ r: 14 }, 250)]);
      await hop(10);
      mood('joy', false);
      void bark(1);
      await hop(16);
      hearts(3);
      await hop(10);
      mood('tongue', true);
      snd.pant(4);
      await Promise.all([head.path([{ r: 5 }, { r: -5 }, { r: 4 }, {}], 900), earL.rest(300), earR.rest(300)]);
    },
    // Wet-dog shake: crouch, wild shake with flying ears and drops, then a happy pant.
    shake: async () => {
      await Promise.all([all.to({ sy: 0.95 }, 250), head.to({ y: 1.5 }, 250)]);
      snd.shake();
      mood('joy', true);
      for (let i = 0; i < 8; i++) fx('drop', A.top, (i % 2 ? 1 : -1) * rnd(30, 50), rnd(-20, 25), 0.06, 700);
      await Promise.all([
        all.path([{ r: 6 }, { r: -6 }, { r: 6 }, { r: -6 }, { r: 5 }, { r: -5 }, { r: 3 }, { r: 0 }], 700, 'linear'),
        head.path([{ r: -12 }, { r: 12 }, { r: -12 }, { r: 12 }, { r: -10 }, { r: 10 }, { r: -5 }, { r: 0 }], 700, 'linear'),
        earL.path([{ r: -35 }, { r: 25 }, { r: -35 }, { r: 25 }, { r: -30 }, { r: 20 }, { r: -10 }, { r: 0 }], 700, 'linear'),
        earR.path([{ r: 35 }, { r: -25 }, { r: 35 }, { r: -25 }, { r: 30 }, { r: -20 }, { r: 10 }, { r: 0 }], 700, 'linear'),
      ]);
      await Promise.all([all.rest(250), head.rest(250)]);
      tailFast(true);
      mood('tongue', true);
      snd.pant(3);
      await sleep(800);
    },
    // Howl at the sky with music notes, then two short barks.
    howl: async () => {
      await Promise.all([head.to({ r: -14, y: -3 }, 450), earL.to({ r: 10 }, 450), earR.to({ r: -10 }, 450), pupils.to({ y: -12 }, 300)]);
      mood('joy', true);
      mood('bark', true);
      def.song();
      for (let i = 0; i < 4; i++) setTimeout(() => fx('note', A.mouth, rnd(10, 35) * (i % 2 ? 1 : -0.6), rnd(-35, -50), 0.11, 1400, rnd(-30, 30)), 200 + i * 340);
      await head.path([{ r: -18, y: -3.5 }, { r: -11, y: -3 }, { r: -17, y: -3.5 }, { r: -14, y: -3 }], 1600);
      mood('bark', false);
      mood('joy', false);
      await Promise.all([head.rest(350), earL.rest(350), earR.rest(350), pupils.rest(300)]);
      await bark(2);
    },
    // Spot the tail, spin round twice, dizzy with stars, shake it off.
    chase: async () => {
      await Promise.all([head.to({ r: 12 }, 350), pupils.to({ x: 14, y: 8 }, 300)]);
      await sleep(300);
      snd.whoosh();
      tailFast(true);
      await Promise.all([pupils.rest(150), all.path([{ ry: 180, y: -3 }, { ry: 360, y: 0 }, { ry: 540, y: -3 }, { ry: 720, y: 0 }], 1200)]);
      all.set({ ry: 0 });
      tailFast(false);
      mood('cross', true);
      snd.wobble();
      for (let i = 0; i < 3; i++) setTimeout(() => fx('star', A.top, Math.cos(i * 2.1) * 30, -10 + Math.sin(i * 2.1) * 8, 0.09, 1100, 180), i * 180);
      await head.path([{ r: 9 }, { r: -9 }, { r: 8 }, { r: -8 }, { r: 4 }], 1100);
      mood('cross', false);
      await shakeHead(4, 9, 450);
      mood('joy', true);
      await sleep(500);
    },
    // Sniff sniff, a big breath, ACHOO with drops, shake the head, lick the nose.
    sneeze: async () => {
      for (let i = 0; i < 2; i++) {
        snd.sniff();
        await head.path([{ y: 1.2, r: 2 }, {}, { y: 1.2, r: 2 }, {}], 360);
        await sleep(150);
      }
      mood('wonder', true);
      snd.inhale();
      await Promise.all([head.to({ r: -10, y: -2.5, sy: 1.02 }, 600, 'ease-out'), earL.to({ r: 8 }, 600), earR.to({ r: -8 }, 600)]);
      mood('wonder', false);
      mood('joy', true);
      snd.achoo();
      for (let i = 0; i < 6; i++) fx('drop', A.nose, rnd(-30, 30), rnd(5, 25), 0.05, 600);
      await Promise.all([head.to({ r: 10, y: 3, sy: 0.97 }, 120, 'ease-in'), all.path([{ sy: 0.94 }, {}], 300), earL.path([{ r: -30 }, {}], 400), earR.path([{ r: 30 }, {}], 400)]);
      await head.rest(250);
      mood('joy', false);
      await shakeHead(4, 7, 400);
      mood('tongue', true);
      snd.slurp();
      await tongue.path([{ y: -60, sy: 0.6 }, {}], 400);
      await sleep(300);
    },
    // Play bow: down at the front, wagging, bark bark, then a big jump with a spin.
    bow: async () => {
      tailFast(true);
      await Promise.all([all.to({ sy: 0.9, sx: 1.04 }, 300), head.to({ y: 6, r: 4 }, 300), earL.to({ r: -10 }, 300), earR.to({ r: 10 }, 300)]);
      await all.path([{ x: -1.5 }, { x: 1.5 }, { x: -1.5 }, { x: 0 }], 700);
      await bark(2);
      snd.boing();
      mood('joy', true);
      await Promise.all([all.to({ y: -24, sy: 1.06, sx: 0.95, ry: 360 }, 450, 'ease-out'), head.to({ y: 0, r: 0 }, 300), earL.to({ r: -25 }, 300), earR.to({ r: 25 }, 300)]);
      all.set({ ry: 0 });
      await Promise.all([all.to({ y: 0, sy: 1, sx: 1 }, 300, 'ease-in'), earL.to({ r: 10 }, 300), earR.to({ r: -10 }, 300)]);
      snd.thud();
      dust();
      await Promise.all([all.path([{ sy: 0.92, sx: 1.05 }, { sy: 1, sx: 1 }], 220), earL.rest(250), earR.rest(250)]);
      mood('tongue', true);
      snd.pant(3);
      await sleep(700);
    },
    // Curious: tilt one way with a question mark, the other way, nod, a happy bark.
    curious: async () => {
      mood('wonder', true);
      snd.wonder();
      fx('ask', A.top, 18, -22, 0.16, 2000);
      await Promise.all([head.to({ r: 14 }, 400), earR.to({ r: -16 }, 400), pupils.to({ x: -6, y: -6 }, 300)]);
      await sleep(600);
      snd.wonder();
      await Promise.all([head.to({ r: -14 }, 500), earR.rest(400), earL.to({ r: 16 }, 400), pupils.to({ x: 6, y: -6 }, 300)]);
      await sleep(600);
      mood('wonder', false);
      await Promise.all([head.rest(300), earL.rest(300), pupils.rest(300)]);
      snd.peek();
      await head.path([{ y: 2, r: -2 }, {}, { y: 2, r: -2 }, {}], 600);
      mood('joy', true);
      await bark(1);
    },
    // Licks: tongue out, two big licks up to the nose, tongue wagging while panting, hearts.
    lick: async () => {
      mood('tongue', true);
      tailFast(true);
      for (let i = 0; i < 2; i++) {
        snd.slurp();
        await Promise.all([tongue.path([{ y: -70, sy: 0.55 }, {}], 450), head.path([{ r: -4 }, {}], 450)]);
        await sleep(120);
      }
      mood('joy', true);
      snd.pant(5);
      await Promise.all([tongue.path([{ r: 16 }, { r: -16 }, { r: 16 }, { r: -16 }, {}], 1100), head.path([{ r: 4 }, { r: -4 }, { r: 4 }, { r: -4 }, {}], 1100)]);
      hearts(4);
      await sleep(700);
    },
    // Peekaboo: ears over the eyes, peek out, hide again, then pop out with a jump.
    peekaboo: async () => {
      if (!def.floppy) return routines.curious();
      await Promise.all([earL.to({ r: -56 }, 350, "ease-out"), earR.to({ r: 54 }, 350, "ease-out"), head.to({ y: 1 }, 350)]);
      await sleep(700);
      snd.peek();
      mood('joy', true);
      await Promise.all([earL.to({ r: -30 }, 200), earR.to({ r: 28 }, 200)]);
      await sleep(400);
      mood('joy', false);
      await Promise.all([earL.to({ r: -56 }, 200), earR.to({ r: 54 }, 200)]);
      await sleep(800);
      snd.peek();
      mood('joy', true);
      tailFast(true);
      await Promise.all([earL.to({ r: -25 }, 180, 'ease-out'), earR.to({ r: 25 }, 180, 'ease-out'), head.rest(180)]);
      void bark(1);
      await hop(14);
      hearts(2);
      await Promise.all([earL.rest(300), earR.rest(300)]);
      await sleep(400);
    },
  };

  let busy = false;
  const recent: Trick[] = [];
  async function settle() {
    clear();
    await Promise.all([all.rest(250), head.rest(250), earL.rest(250), earR.rest(250), pupils.rest(200), tongue.rest(200)]);
  }

  async function trick(name?: Trick) {
    if (busy) return;
    busy = true;
    let t = name;
    if (!t) {
      const fresh = TRICKS.filter((x) => !recent.includes(x) && (def.floppy || x !== 'peekaboo'));
      t = fresh[Math.floor(Math.random() * fresh.length)];
    }
    recent.push(t);
    if (recent.length > 4) recent.shift();
    try {
      if (reduced()) await bark(2);
      else await routines[t]();
    } finally {
      await settle();
      busy = false;
    }
  }

  async function eat() {
    while (busy) await sleep(100);
    busy = true;
    try {
      tailFast(true);
      await Promise.all([head.to({ y: 2, r: 4 }, 250), earL.to({ r: -10 }, 250), earR.to({ r: 10 }, 250)]);
      for (let i = 0; i < 4; i++) {
        snd.chomp();
        mood('bark', true);
        await head.path([{ y: 2.8, r: 6 }, { y: 2, r: 4 }], 200);
        mood('bark', false);
        if (i % 2 === 0) fx('crumb', A.mouth, rnd(-20, 20), rnd(10, 25), 0.04, 600, 120);
        await sleep(90);
      }
      await head.rest(250);
      mood('tongue', true);
      snd.slurp();
      await tongue.path([{ y: -70, sy: 0.55 }, {}], 450);
      mood('joy', true);
      hearts(4);
      await hop(10);
      await sleep(400);
    } finally {
      await settle();
      busy = false;
    }
  }

  function mouthPoint() {
    const r = el.getBoundingClientRect();
    const [px, py] = pct(A.mouth);
    return { x: r.left + (px / 100) * r.width, y: r.top + (py / 100) * r.height };
  }

  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    void trick();
  });

  // Idle life: blink, glance, sniff, small head tilts and ear twitches until the element leaves the page.
  void (async () => {
    await sleep(rnd(300, 1500));
    while (true) {
      await sleep(rnd(1600, 3800));
      if (!el.isConnected) return;
      if (busy || reduced()) continue;
      const r = Math.random();
      if (r < 0.4) await pupils.path([{ sy: 0.1 }, {}], 180);
      else if (r < 0.62) {
        await pupils.to({ x: rnd(-14, 14), y: rnd(-8, 8) }, 300);
        await sleep(1000);
        if (!busy) await pupils.rest(300);
      } else if (r < 0.8) {
        await head.to({ r: rnd(-6, 6) }, 500);
        await sleep(800);
        if (!busy) await head.rest(500);
      } else if (r < 0.9) await Promise.all([earL.path([{ r: -9 }, {}], 320), earR.path([{ r: 9 }, {}], 320)]);
      else await head.path([{ y: 1, r: 2 }, {}, { y: 1, r: 2 }, {}], 400);
    }
  })();

  return { el, trick, eat, mouthPoint };
}
