import { h, onTap, frag, box, flash } from './dom';
import { ICONS, STAR_PATH, dotPattern, medalSvg } from '../art/art';
import { theme, giftsIn, type Theme, type Gift } from '../themes';
import { critter, type Critter } from './critter';
import { star } from './sound';
import { paintedImg } from '../paint/runtime';
import { needsHint } from './progress';

export const W = 1180;
export const H = 820;

/** Painted meadow background (paper, sun, two hills). */
export function meadow(): HTMLElement {
  return h('div', { class: 'scene meadow', 'aria-hidden': 'true' });
}

export function roundButton(html: string, label: string, onClick: () => void, size = 76): HTMLButtonElement {
  return h('button', { class: 'round-btn blob', 'aria-label': label, style: { width: `${size}px`, height: `${size}px` }, html, onClick });
}

export interface TopBar {
  el: HTMLElement;
  setStars(done: number, total: number): void;
  /** Path to the medal: one dot per screen (writing pink, counting green), medal at the end. */
  setSteps(current: number, kinds: ('w' | 'c')[]): void;
  starDone(index: number): void;
  setUndo(fn: (() => void) | null): void;
}

export function topBar(onSpeaker: () => void, onSkip: () => void): TopBar {
  const undoSlot = h('div', { style: { width: '76px', height: '76px' } });
  const stars = h('div', { class: 'stars' });
  // Parent helper: three quick taps on the star bar skip the current screen.
  let taps: number[] = [];
  onTap(stars, () => {
    const now = Date.now();
    taps = [...taps.filter((t) => now - t < 900), now];
    if (taps.length >= 3) {
      taps = [];
      onSkip();
    }
  });
  const el = h('div', { class: 'topbar' }, roundButton(ICONS.speaker(), 'Zopakovat pokyn', onSpeaker), stars, undoSlot);
  return {
    el,
    setStars(done, total) {
      stars.innerHTML = '';
      for (let i = 0; i < total; i++) {
        stars.append(frag(`<svg class="star ${i < done ? 'on' : ''}" width="38" height="38" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}" stroke-width="1.4" stroke-linejoin="round"/></svg>`));
      }
    },
    setSteps(cur, kinds) {
      stars.innerHTML = '';
      stars.classList.add('steps');
      kinds.forEach((k, i) => stars.append(h('span', { class: `step ${k} ${i < cur ? 'done' : i === cur ? 'now' : ''}` })));
      stars.append(h('span', { class: 'step-medal', html: medalSvg(48) }));
    },
    starDone(i) {
      const s = stars.children[i];
      if (s) {
        star();
        s.classList.add('on');
        flash(s, 'pop');
      }
    },
    setUndo(fn) {
      undoSlot.innerHTML = '';
      if (fn) undoSlot.append(roundButton(ICONS.undo(), 'Smazat poslední tah', fn));
    },
  };
}

export function card(left: number, top: number, width: number, height: number, cls = 'card'): HTMLDivElement {
  return h('div', { class: cls, style: box(left, top, width, height) });
}

/** The theme's animal as a guide in the corner (kept for older call sites). */
export function horseGuide(left: number, bottom: number, size = 300): HTMLElement {
  return companion(left, bottom, size);
}

/**
 * The theme's animal, alive, with every present it has earned so far: worn ones on it,
 * the others lying on the grass at its feet (treats grow from tiny to big). Shown on every screen.
 * `height` is the animal's height in px.
 */
export function companion(left: number, bottom: number, height = 240, extraClass = '', t: Theme = theme()): HTMLElement {
  const got = t.gifts.slice(0, giftsIn(t));
  const wornOn = (on: 'head' | 'body') => got.filter((g) => g.worn?.on === on).map((g) => g.worn!.svg).join('');
  const c = critter(t.critter, height, { head: wornOn('head'), body: wornOn('body') });
  const width = parseFloat(c.el.style.width);
  const el = h('div', { class: `companion ${extraClass}`, style: { position: 'absolute', left: `${left}px`, bottom: `${bottom}px`, width: `${width}px`, height: `${height}px` } });
  el.append(c.el);
  (el as HTMLElement & { critter?: Critter }).critter = c;
  // Floor presents in two rows, small ones in front, big ones behind: at the feet in the corner,
  // spread on the grass beside the animal on the big screens.
  const floor = got.filter((g) => !g.worn);
  const side = height >= 360;
  const base = height * (side ? 0.25 : 0.3);
  const front = floor.slice(0, Math.ceil(floor.length / 2));
  const back = floor.slice(front.length);
  const row = (list: Gift[], y: number, x0: number) => {
    let x = x0;
    for (const g of list) {
      const s = Math.round(base * (g.scale ?? 0.8));
      const ge = h('div', { class: 'companion-gift', role: 'button', 'aria-label': `Dát ${t.animal.dat} ${g.name}`, style: { left: `${Math.round(x)}px`, top: `${Math.round(y - s)}px`, width: `${s}px`, height: `${s}px` }, html: g.icon(s) });
      onTap(ge, () => void give(c, ge, g));
      el.append(ge);
      x += s * (side ? 0.95 : 0.78);
    }
  };
  if (side) {
    row(back, height * 0.95, width * 0.78);
    row(front, height * 1.02, width * 0.7);
  } else {
    row(back, height * 0.97, width * 0.55);
    row(front, height * 1.04, width * 0.45);
  }
  return el;
}

/**
 * Give a treat or present to the animal: food flies into its mouth and gets eaten,
 * then the treat appears back in its place (presents stay visible); other presents make it happy.
 */
export async function give(c: Critter, item: HTMLElement, g: { food?: boolean }, keep = true) {
  if (item.dataset.busy) return;
  item.dataset.busy = '1';
  if (g.food) {
    const from = item.getBoundingClientRect();
    const to = c.mouthPoint();
    const k = from.width / (item.offsetWidth || from.width) || 1;
    const dx = (to.x - (from.left + from.width / 2)) / k;
    const dy = (to.y - (from.top + from.height / 2)) / k;
    await item
      .animate(
        [
          { transform: 'translate(0,0) scale(1) rotate(0)' },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(1.1) rotate(-20deg)`, offset: 0.5 },
          { transform: `translate(${dx}px, ${dy}px) scale(0.35) rotate(10deg)` },
        ],
        { duration: 650, easing: 'ease-in', fill: 'forwards' },
      )
      .finished.catch(() => {});
    item.style.visibility = 'hidden';
    item.getAnimations().forEach((a) => a.cancel());
    await c.eat();
    if (keep) {
      item.style.visibility = '';
      await item.animate([{ transform: 'scale(0.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,1.6,.5,1)' }).finished.catch(() => {});
    }
  } else {
    await item.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 450 }).finished.catch(() => {});
    await c.trick('hops');
  }
  delete item.dataset.busy;
}

/** Small brush for the yellow dot hints: soft ragged edges, a few specks. */
const DOT_BRUSH = { angle: 60, dry: 0.42, zone: 3, edge: 1.1, bristle: 2.4, grain: 0.5, tone: 0.4, speck: 0.35, speckRange: 4 };

/** Big round number button used by all "pick the number" activities. */
export function numberButton(n: number, onPick: (btn: HTMLButtonElement) => void, size = 150): HTMLButtonElement {
  const hint = needsHint(n);
  const fs = Math.round(size * (n >= 10 ? 0.5 : 0.66) * (hint ? 0.8 : 1));
  const b = h('button', { class: `num-btn ${hint ? 'hinted' : ''}`, 'aria-label': `Číslo ${n}`, style: { width: `${size}px`, height: `${size}px`, fontSize: `${fs}px` } }, h('span', {}, String(n)));
  if (hint) {
    const dots = (s: number) => dotPattern(n, s, true, '#E2B13F');
    if (n <= 6) {
      const hs = Math.round(size * 0.34);
      b.append(h('span', { class: 'dot-hint', html: paintedImg(dots(hs), [0, 0, hs, hs], hs, hs, DOT_BRUSH) }));
    } else {
      // Ten-frame is wide and flat: crop the square pattern to its middle band.
      const w = Math.round(size * 0.66);
      b.append(h('span', { class: 'dot-hint', html: paintedImg(dots(w), [0, w * 0.3, w, w * 0.4], w, w * 0.4, DOT_BRUSH) }));
    }
  }
  onTap(b, () => onPick(b));
  return b;
}

/** Hidden long-press zone (top-right corner) that opens the parent screen. */
export function parentCorner(onOpen: () => void): HTMLElement {
  const z = h('div', { class: 'parent-corner', 'aria-hidden': 'true' });
  let timer = 0;
  const cancel = () => clearTimeout(timer);
  z.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    timer = window.setTimeout(onOpen, 1500);
  });
  z.addEventListener('pointerup', cancel);
  z.addEventListener('pointerleave', cancel);
  z.addEventListener('pointercancel', cancel);
  return z;
}

/** Shown over everything while the iPad is held upright: the game is landscape only. */
export function rotateHint(): HTMLElement {
  return h(
    'div',
    { class: 'rotate-hint', role: 'alert', 'aria-label': 'Otoč tablet na šířku' },
    h('img', { src: theme().head, alt: '', class: 'rotate-horse' }),
    frag(`<svg class="rotate-tablet" width="220" height="220" viewBox="0 0 220 220" aria-hidden="true">
      <rect x="70" y="30" width="80" height="120" rx="12" fill="#FFFFFF" stroke="#20150E" stroke-width="6"/>
      <circle cx="110" cy="138" r="4" fill="#20150E"/>
      <path d="M40,170 A80,80 0 0 0 180,170" fill="none" stroke="#8FAA66" stroke-width="7" stroke-linecap="round"/>
      <path d="M180,170 l-4,-22 M180,170 l-20,-8" stroke="#8FAA66" stroke-width="7" stroke-linecap="round"/>
    </svg>`),
  );
}

/** Enter fullscreen where the browser allows it (iPad Safari, desktop); ignored elsewhere. */
export function goFullscreen() {
  const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
  const doc = document as Document & { webkitFullscreenElement?: Element };
  if (document.fullscreenElement || doc.webkitFullscreenElement) return;
  // Where supported (Chrome/Android), also lock to landscape once fullscreen.
  const lock = () => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => {});
  try {
    if (el.requestFullscreen) void el.requestFullscreen({ navigationUI: 'hide' }).then(lock, () => {});
    else el.webkitRequestFullscreen?.();
  } catch {
    /* not supported – the home-screen app is fullscreen anyway */
  }
}

/** A soft confetti burst over the stage. */
export function confetti(parent: HTMLElement, count = 40) {
  const cols = ['#D9617F', '#7FA7C4', '#E2B13F', '#8FAA66', '#B07A3F'];
  for (let i = 0; i < count; i++) {
    const c = h('div', {
      class: 'confetti',
      style: {
        left: `${100 + Math.random() * 980}px`,
        background: cols[i % cols.length],
        animationDelay: `${Math.random() * 0.6}s`,
        animationDuration: `${1.8 + Math.random() * 1.4}s`,
        transform: `rotate(${Math.random() * 360}deg)`,
      },
    });
    parent.append(c);
    setTimeout(() => c.remove(), 4000);
  }
}
