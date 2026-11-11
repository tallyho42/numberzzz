import { tap } from './sound';
type Child = Node | string | null | undefined | false;

/** Small element factory. `style` may be an object, `on*` props become listeners, `html` sets innerHTML. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'onClick' && typeof v === 'function') onTap(el, v as () => void);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k === 'html') el.innerHTML = String(v);
    else if (k === 'class') el.className = String(v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) if (c != null && c !== false) el.append(c);
  return el;
}

/**
 * Reliable tap for buttons: fires on pointerup inside the element, without waiting for `click`.
 * iPadOS drops the `click` when the finger or Pencil moves a hair during the tap, so a plain
 * click listener sometimes needs a second tap. `click` stays as the fallback (keyboard, tests)
 * and is ignored right after a pointer tap so the handler never runs twice.
 */
export function onTap(el: HTMLElement, fn: () => void) {
  let downId: number | null = null;
  let lastTap = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.button === 0) downId = e.pointerId;
  });
  el.addEventListener('pointercancel', () => (downId = null));
  el.addEventListener('pointerup', (e) => {
    if (e.pointerId !== downId) return;
    downId = null;
    const r = el.getBoundingClientRect();
    const pad = 12;
    if (e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad || e.clientY > r.bottom + pad) return;
    lastTap = Date.now();
    tap();
    fn();
  });
  el.addEventListener('click', () => {
    if (Date.now() - lastTap < 800) return;
    tap();
    fn();
  });
}

/** Parse an SVG (or any single-root) markup string into an element. */
export function frag<T extends Element = SVGSVGElement>(markup: string): T {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild as T;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Absolute box style helper. */
export function box(left: number, top: number, width?: number, height?: number): Partial<CSSStyleDeclaration> {
  const s: Partial<CSSStyleDeclaration> = { position: 'absolute', left: `${left}px`, top: `${top}px` };
  if (width != null) s.width = `${width}px`;
  if (height != null) s.height = `${height}px`;
  return s;
}

/** Replay a CSS animation class on an element. */
export function flash(el: Element, cls: string) {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

/** Answer choices: the correct number plus distinct nearby distractors, shuffled. */
export function choices(correct: number, count = 3, min = 0, max = 10): number[] {
  const set = new Set([correct]);
  const near = shuffle([-1, 1, -2, 2, -3, 3]);
  for (const d of near) {
    if (set.size >= count) break;
    const v = correct + d;
    if (v >= min && v <= max) set.add(v);
  }
  return shuffle([...set]);
}
