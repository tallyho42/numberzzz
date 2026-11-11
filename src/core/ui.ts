import { h, frag, box, flash } from './dom';
import { ICONS, STAR_PATH, HORSE_HEAD } from '../art/art';

export const W = 1180;
export const H = 820;

/** Meadow scene background (sky, sun, clouds, two hills). */
export function meadow(): SVGSVGElement {
  return frag(`<svg class="scene" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <rect width="${W}" height="${H}" fill="#CFE9F8"/>
    <circle cx="1040" cy="150" r="70" fill="#FFD95A"/>
    <ellipse class="cloud" cx="230" cy="170" rx="90" ry="28" fill="#FFFFFF" opacity="0.85"/>
    <ellipse class="cloud" cx="290" cy="150" rx="60" ry="26" fill="#FFFFFF" opacity="0.85"/>
    <ellipse class="cloud slow" cx="880" cy="110" rx="70" ry="20" fill="#FFFFFF" opacity="0.7"/>
    <path d="M0,600 C220,520 420,560 600,610 C800,665 980,560 1180,590 L1180,820 L0,820 Z" fill="#A8D99C"/>
    <path d="M0,690 C260,640 520,700 760,690 C930,684 1060,650 1180,670 L1180,820 L0,820 Z" fill="#8CCB82"/>
  </svg>`);
}

export function roundButton(html: string, label: string, onClick: () => void, size = 76): HTMLButtonElement {
  return h('button', { class: 'round-btn', 'aria-label': label, style: { width: `${size}px`, height: `${size}px` }, html, onClick });
}

export interface TopBar {
  el: HTMLElement;
  setStars(done: number, total: number): void;
  starDone(index: number): void;
  setUndo(fn: (() => void) | null): void;
}

export function topBar(onSpeaker: () => void, onSkip: () => void): TopBar {
  const undoSlot = h('div', { style: { width: '76px', height: '76px' } });
  const stars = h('div', { class: 'stars' });
  // Parent helper: three quick taps on the star bar skip the current screen.
  let taps: number[] = [];
  stars.addEventListener('click', () => {
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
    starDone(i) {
      const s = stars.children[i];
      if (s) {
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

export function horseGuide(left: number, bottom: number, size = 300): HTMLImageElement {
  return h('img', { class: 'guide', src: HORSE_HEAD, alt: 'Koník průvodce', style: { position: 'absolute', left: `${left}px`, bottom: `${bottom}px`, width: `${size}px`, height: `${size}px` } });
}

/** Big round number button used by all "pick the number" activities. */
export function numberButton(n: number, onPick: (btn: HTMLButtonElement) => void, size = 150): HTMLButtonElement {
  const b = h('button', { class: 'num-btn', 'aria-label': `Číslo ${n}`, style: { width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * (n >= 10 ? 0.5 : 0.66))}px` } }, String(n));
  b.addEventListener('click', () => onPick(b));
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

/** A soft confetti burst over the stage. */
export function confetti(parent: HTMLElement, count = 40) {
  const cols = ['#E2558C', '#4A8FE0', '#FFCC33', '#3DAA5C', '#F28C28'];
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
