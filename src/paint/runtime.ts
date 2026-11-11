/**
 * Painting small art at runtime: an SVG drawing goes through the dry-brush painter once,
 * the result is cached as an image URL and every <img>/<image> showing it is updated in place.
 * Until then (or if the browser refuses to read the canvas) the flat SVG is shown.
 */
import { paint, type Brush } from './brush';

/** Brush in screen pixels (converted to the drawing's own units when painting). */
export type PxBrush = Brush;

const done = new Map<string, string>();
const queued = new Set<string>();
const jobs: (() => Promise<void>)[] = [];
let running = false;

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

const flatUrl = (svg: string, vb: number[]) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}">${svg}</svg>`)}`;

async function pump() {
  if (running) return;
  running = true;
  while (jobs.length) {
    await jobs.shift()!();
    await new Promise((r) => setTimeout(r, 0));
  }
  running = false;
}

export const DEFAULT_PX_BRUSH: PxBrush = { angle: 75, dry: 0.36, zone: 7, edge: 1.1, bristle: 3, grain: 0.9, tone: 0.3, speck: 0.15, speckRange: 6 };

/**
 * URL of the painted drawing (or of the flat SVG while it is being painted) plus the cache key.
 * `width` is the displayed width in CSS px; the brush is given in CSS px too.
 */
export function paintedUrl(svg: string, vb: [number, number, number, number], width: number, brush: PxBrush = {}): { url: string; key: string } {
  // At most ~2× the screen size and ~350k pixels: big pictures are painted a little softer.
  const budget = Math.sqrt((350000 * vb[2]) / vb[3]);
  const px = Math.min(budget, Math.ceil((width * Math.min(2, window.devicePixelRatio || 1)) / 32) * 32) | 0;
  const b = { ...DEFAULT_PX_BRUSH, ...brush };
  const key = `p${hashStr(svg + vb.join() + JSON.stringify(b))}-${px}`;
  const hit = done.get(key);
  if (hit) return { url: hit, key };
  if (!queued.has(key)) {
    queued.add(key);
    const unit = vb[2] / width; // design units per CSS px
    const scaled: Brush = { ...b, zone: b.zone! * unit, edge: b.edge! * unit, bristle: b.bristle! * unit, grain: b.grain! * unit, speckRange: b.speckRange! * unit };
    jobs.push(async () => {
      try {
        const c = await paint([{ svg, brush: scaled }], vb, px);
        const url = await new Promise<string>((res) => c.toBlob((bl) => res(bl ? URL.createObjectURL(bl) : c.toDataURL()), 'image/png'));
        done.set(key, url);
        document.querySelectorAll(`[data-paint="${key}"]`).forEach((el) => {
          if (el instanceof HTMLImageElement) el.src = url;
          else el.setAttribute('href', url);
        });
      } catch {
        /* canvas not readable here: the flat drawing stays */
      }
    });
    void pump();
  }
  return { url: flatUrl(svg, vb), key };
}

/** `<img>` markup of a painted drawing, `w`×`h` CSS px. */
export function paintedImg(svg: string, vb: [number, number, number, number], w: number, h = (w * vb[3]) / vb[2], brush?: PxBrush, extra = ''): string {
  const { url, key } = paintedUrl(svg, vb, w, brush);
  return `<img data-paint="${key}" src="${url}" width="${Math.round(w)}" height="${Math.round(h)}" alt="" draggable="false" ${extra}>`;
}

/** `<image>` markup for use inside a larger SVG: drawing centred on (x, y), `w` wide in that SVG's units. */
export function paintedImage(svg: string, vb: [number, number, number, number], x: number, y: number, w: number, screenW = w, brush?: PxBrush, transform = ''): string {
  const { url, key } = paintedUrl(svg, vb, screenW, brush);
  const h = (w * vb[3]) / vb[2];
  return `<image data-paint="${key}" href="${url}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" ${transform ? `transform="${transform}"` : ''}/>`;
}
