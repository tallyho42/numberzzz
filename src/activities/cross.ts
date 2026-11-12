/**
 * Crossing off counted things: a tap (or a pencil stroke) over a picture strikes it through with
 * one painted brush stroke; another tap takes the stroke away. Works in every counting screen.
 */
import { h } from '../core/dom';
import { paintedImg } from '../paint/runtime';
import { swish } from '../core/sound';
import type { P } from '../core/geometry';

const STROKE = (ink: string) =>
  `<path d="M5,74 C24,64 44,50 60,38 C72,29 82,22 92,13 C97,18 99,26 96,31 C84,41 73,50 62,59 C45,72 28,83 11,93 C5,90 2,81 5,74 Z" fill="${ink}"/>`;
const BRUSH = { angle: -34, dry: 0.42, zone: 3, edge: 1.2, bristle: 6, grain: 0.8, tone: 0.3, speck: 0.4, speckRange: 5 };

export interface Crossable {
  /** Strike item i through (or take the stroke away when `on` is false). */
  set(i: number, on?: boolean): void;
  isCrossed(i: number): boolean;
}

/**
 * Overlay `parent` (positioned) with cross-off marks for things at `pts` (centres in parent px),
 * each about `size` px big. With `tap`, each thing gets its own tap target.
 */
export function crossable(parent: HTMLElement, pts: P[], size: number, ink: string, opts: { tap?: boolean; scale?: number } = {}): Crossable {
  const layer = h('div', { class: 'cross-layer' });
  parent.append(layer);
  const s = Math.round(size * 1.15);
  const marks: (HTMLElement | null)[] = pts.map(() => null);

  function set(i: number, on = !marks[i]) {
    if (on === !!marks[i]) return;
    if (on) {
      const p = pts[i];
      const tilt = ((i * 37) % 21) - 10;
      const m = h('div', { class: 'cross-mark', style: { left: `${p.x - s / 2}px`, top: `${p.y - s / 2}px`, width: `${s}px`, height: `${s}px`, transform: `rotate(${tilt}deg)` }, html: paintedImg(STROKE(ink), [0, 0, 100, 100], s, s, BRUSH) });
      layer.append(m);
      marks[i] = m;
      swish();
      m.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 220, easing: 'ease-out' });
    } else {
      const m = marks[i]!;
      marks[i] = null;
      void m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished.then(() => m.remove(), () => m.remove());
    }
  }

  if (opts.tap !== false) {
    pts.forEach((p, i) => {
      const r = size * 0.55;
      const hit = h('div', { class: 'cross-hit', style: { left: `${p.x - r}px`, top: `${p.y - r}px`, width: `${2 * r}px`, height: `${2 * r}px` } });
      // The thing may sit on something tappable (a plate in "Kde je víc"): crossing off never counts as that tap.
      hit.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        set(i);
      });
      for (const ev of ['pointerup', 'click'] as const) hit.addEventListener(ev, (e) => e.stopPropagation());
      layer.append(hit);
    });
  }
  return { set, isCrossed: (i) => !!marks[i] };
}
