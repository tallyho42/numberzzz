import { h, onTap, frag, box, flash } from './dom';
import { ICONS, STAR_PATH, dotPattern, medalSvg } from '../art/art';
import { theme, giftsIn } from '../themes';
import { needsHint } from './progress';

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
      stars.append(h('span', { class: 'step-medal', html: medalSvg(44) }));
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

/** The theme's animal as a guide in the corner (kept for older call sites). */
export function horseGuide(left: number, bottom: number, size = 300): HTMLElement {
  return companion(left, bottom, size);
}

/**
 * The theme's animal with every present it has earned so far: worn ones drawn on it,
 * the others lying on the grass beside it. Shown on every screen.
 */
export function companion(left: number, bottom: number, size = 260, extraClass = ''): HTMLElement {
  const t = theme();
  const got = t.gifts.slice(0, giftsIn(t));
  const el = h('div', { class: `companion guide ${extraClass}`, style: { position: 'absolute', left: `${left}px`, bottom: `${bottom}px`, width: `${size}px`, height: `${size}px` } });
  el.append(h('img', { src: t.head, alt: t.animal.Nom, style: { position: 'absolute', inset: '0', width: '100%', height: '100%' } }));
  const worn = got.map((g) => g.worn ?? '').join('');
  if (worn) el.append(frag(`<svg width="${size}" height="${size}" viewBox="0 0 240 240" style="position:absolute;inset:0;overflow:visible" aria-hidden="true">${worn}</svg>`));
  const floor = got.filter((g) => !g.worn);
  const gs = Math.round(size * 0.2);
  floor.forEach((g, i) => {
    el.append(h('div', { class: 'companion-gift', style: { left: `${Math.round(size * 0.55 + i * size * 0.19)}px`, top: `${Math.round(size * 0.78)}px`, width: `${gs}px`, height: `${gs}px` }, html: g.icon(gs) }));
  });
  return el;
}

/** Big round number button used by all "pick the number" activities. */
export function numberButton(n: number, onPick: (btn: HTMLButtonElement) => void, size = 150): HTMLButtonElement {
  const hint = needsHint(n);
  const fs = Math.round(size * (n >= 10 ? 0.5 : 0.66) * (hint ? 0.8 : 1));
  const b = h('button', { class: `num-btn ${hint ? 'hinted' : ''}`, 'aria-label': `Číslo ${n}`, style: { width: `${size}px`, height: `${size}px`, fontSize: `${fs}px` } }, h('span', {}, String(n)));
  if (hint) {
    const dots = (s: number) => dotPattern(n, s).replaceAll('#F28C28', '#F2B400');
    if (n <= 6) {
      const hs = Math.round(size * 0.34);
      b.append(frag(`<svg class="dot-hint" width="${hs}" height="${hs}" viewBox="0 0 ${hs} ${hs}" aria-hidden="true">${dots(hs)}</svg>`));
    } else {
      // Ten-frame is wide and flat: crop the square pattern to its middle band.
      const w = Math.round(size * 0.66);
      b.append(frag(`<svg class="dot-hint" width="${w}" height="${Math.round(w * 0.4)}" viewBox="0 ${w * 0.3} ${w} ${w * 0.4}" aria-hidden="true">${dots(w)}</svg>`));
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
      <rect x="70" y="30" width="80" height="120" rx="12" fill="#FFFFFF" stroke="#2E6B3A" stroke-width="6"/>
      <circle cx="110" cy="138" r="4" fill="#2E6B3A"/>
      <path d="M40,170 A80,80 0 0 0 180,170" fill="none" stroke="#3DAA5C" stroke-width="7" stroke-linecap="round"/>
      <path d="M180,170 l-4,-22 M180,170 l-20,-8" stroke="#3DAA5C" stroke-width="7" stroke-linecap="round"/>
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
