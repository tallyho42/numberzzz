/**
 * The theme animal, alive: painted parts (baked PNGs) stacked with crisp ink details on top.
 * It breathes, blinks, looks around and wags; a tap makes it do a random trick.
 */
import { h } from './dom';
import { boing, slurp, wonder, trill, wobble, flap, whoosh, sneeze } from './sound';

export type Part = 'tail' | 'body' | 'head' | 'earL' | 'earR';

export interface CritterDef {
  /** PNGs live at art/<id>-<part>.png. */
  id: string;
  vb: [number, number, number, number];
  parts: Part[];
  pivot: Partial<Record<'head' | 'earL' | 'earR' | 'tail', readonly [number, number]>>;
  /** Ink details over the head (all expressions; CSS shows the current one). */
  face: string;
  /** Ink details over the body (e.g. leg lines). */
  bodyInk?: string;
  /** Its voice for the bark trick. */
  call: () => void;
}

export interface Critter {
  el: HTMLElement;
  /** Do a trick now (a random one if not given). */
  trick(name?: Trick): Promise<void>;
}

export type Trick = 'call' | 'tongue' | 'tilt' | 'jump' | 'wiggle' | 'cross' | 'ears' | 'spin' | 'sneeze';
const TRICKS: Trick[] = ['call', 'tongue', 'tilt', 'jump', 'wiggle', 'cross', 'ears', 'spin', 'sneeze'];

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const artUrl = (name: string) => `${import.meta.env.BASE_URL}art/${name}.webp`;

/**
 * `height` in px; width follows the art's frame. `worn` is extra SVG (same frame) on the head/body.
 */
export function critter(def: CritterDef, height: number, worn: { head?: string; body?: string } = {}): Critter {
  const [vx, vy, vw, vh] = def.vb;
  const width = (height * vw) / vh;
  const origin = (p?: readonly [number, number]) => (p ? `${((p[0] - vx) / vw) * 100}% ${((p[1] - vy) / vh) * 100}%` : '50% 50%');
  const svg = (inner: string, cls = '') => `<svg class="${cls}" viewBox="${def.vb.join(' ')}" aria-hidden="true">${inner}</svg>`;
  const img = (part: Part) => h('img', { src: artUrl(`${def.id}-${part}`), alt: '', draggable: 'false' });

  const el = h('div', { class: 'critter', style: { width: `${width}px`, height: `${height}px` } });
  const inner = h('div', { class: 'c-all' });
  el.append(inner);
  const parts: Partial<Record<Part, HTMLElement>> = {};
  if (def.parts.includes('tail')) {
    parts.tail = h('div', { class: 'c-part c-tail', style: { transformOrigin: origin(def.pivot.tail) } }, img('tail'));
    inner.append(parts.tail);
  }
  parts.body = h('div', { class: 'c-part c-body', html: svg(def.bodyInk ?? '') + (worn.body ? svg(worn.body) : '') });
  parts.body.prepend(img('body'));
  inner.append(parts.body);
  const head = h('div', { class: 'c-part c-head', style: { transformOrigin: origin(def.pivot.head) } }, img('head'));
  head.insertAdjacentHTML('beforeend', svg(def.face, 'c-face'));
  for (const ear of ['earL', 'earR'] as const) {
    if (!def.parts.includes(ear)) continue;
    parts[ear] = h('div', { class: `c-part c-${ear}`, style: { transformOrigin: origin(def.pivot[ear]) } }, img(ear));
    head.append(parts[ear]!);
  }
  if (worn.head) head.insertAdjacentHTML('beforeend', svg(worn.head));
  parts.head = head;
  inner.append(head);
  const pupils = () => el.querySelector<SVGGElement>('.pupils');

  let busy = false;
  let last: Trick | null = null;
  const anim = (target: Element | undefined, frames: Keyframe[], duration: number, easing = 'ease-in-out') =>
    target ? target.animate(frames, { duration, easing }).finished.catch(() => {}) : Promise.resolve();
  const mood = async (cls: string, ms: number) => {
    el.classList.add(...cls.split(' '));
    await sleep(ms);
    el.classList.remove(...cls.split(' '));
  };
  const flapEars = (n: number, deg: number, dur: number) =>
    Promise.all([
      anim(parts.earL, Array.from({ length: n * 2 + 1 }, (_, i) => ({ transform: `rotate(${i % 2 ? deg : 0}deg)` })), dur),
      anim(parts.earR, Array.from({ length: n * 2 + 1 }, (_, i) => ({ transform: `rotate(${i % 2 ? -deg : 0}deg)` })), dur),
    ]);

  const tricks: Record<Trick, () => Promise<unknown>> = {
    call: () => {
      def.call();
      return Promise.all([
        mood('bark', 650),
        anim(head, [{ transform: 'rotate(0)' }, { transform: 'rotate(-7deg) translateY(-2%)' }, { transform: 'rotate(0)' }, { transform: 'rotate(-7deg) translateY(-2%)' }, { transform: 'rotate(0)' }], 620),
        flapEars(2, -12, 620),
      ]);
    },
    tongue: () => {
      slurp();
      el.classList.add('fast');
      return mood('tongue joy', 1700).then(() => el.classList.remove('fast'));
    },
    tilt: () => (wonder(), Promise.all([mood('wonder', 1300), anim(head, [{ transform: 'rotate(0)' }, { transform: 'rotate(13deg)', offset: 0.25 }, { transform: 'rotate(13deg)', offset: 0.75 }, { transform: 'rotate(0)' }], 1300)])),
    jump: () => {
      boing();
      return Promise.all([
        anim(inner, [
          { transform: 'translateY(0) scale(1,1)' },
          { transform: 'translateY(0) scale(1.06,0.92)', offset: 0.15 },
          { transform: 'translateY(-22%) scale(0.95,1.06)', offset: 0.5 },
          { transform: 'translateY(0) scale(1.05,0.94)', offset: 0.85 },
          { transform: 'translateY(0) scale(1,1)' },
        ], 750),
        flapEars(1, -20, 750),
        mood('joy', 750),
      ]);
    },
    wiggle: () => {
      trill();
      el.classList.add('fast');
      return Promise.all([
        anim(inner, [0, -5, 5, -5, 5, -3, 0].map((d) => ({ transform: `rotate(${d}deg)` })), 1000),
        mood('joy tongue', 1000),
      ]).then(() => el.classList.remove('fast'));
    },
    cross: () => (wobble(), mood('cross tongue', 1500)),
    ears: () => (flap(4), flapEars(4, -16, 1100)),
    spin: () => (whoosh(), anim(inner, [{ transform: 'rotateY(0)' }, { transform: 'rotateY(360deg)' }], 900)),
    sneeze: async () => {
      sneeze();
      await Promise.all([anim(head, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-6deg) scale(1.03)' }], 500, 'ease-out'), mood('wonder', 500)]);
      await Promise.all([mood('joy', 500), anim(head, [{ transform: 'rotate(-6deg) scale(1.03)' }, { transform: 'rotate(5deg) translateY(3%) scale(0.98)', offset: 0.25 }, { transform: 'rotate(0) scale(1)' }], 500)]);
    },
  };

  async function trick(name?: Trick) {
    if (busy) return;
    busy = true;
    let t = name;
    if (!t) {
      do t = TRICKS[Math.floor(Math.random() * TRICKS.length)];
      while (t === last);
    }
    last = t;
    if (reduced() && (t === 'jump' || t === 'spin' || t === 'wiggle')) t = 'tongue';
    await tricks[t]();
    busy = false;
  }

  el.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    void trick();
  });

  // Idle life: blink, glance, small head tilts and ear twitches until the element leaves the page.
  void (async () => {
    await sleep(rnd(300, 1500));
    while (true) {
      await sleep(rnd(1800, 4200));
      if (!el.isConnected) return;
      if (busy || reduced()) continue;
      const r = Math.random();
      if (r < 0.45) await anim(pupils() ?? undefined, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.1)' }, { transform: 'scaleY(1)' }], 180);
      else if (r < 0.7) {
        const dx = rnd(-14, 14);
        const dy = rnd(-8, 8);
        await anim(pupils() ?? undefined, [{ transform: 'translate(0,0)' }, { transform: `translate(${dx}px,${dy}px)`, offset: 0.2 }, { transform: `translate(${dx}px,${dy}px)`, offset: 0.8 }, { transform: 'translate(0,0)' }], 1600);
      } else if (r < 0.88) {
        const d = rnd(-5, 5);
        await anim(head, [{ transform: 'rotate(0)' }, { transform: `rotate(${d}deg)`, offset: 0.3 }, { transform: `rotate(${d}deg)`, offset: 0.7 }, { transform: 'rotate(0)' }], 1800);
      } else await flapEars(1, -8, 350);
    }
  })();

  return { el, trick };
}
