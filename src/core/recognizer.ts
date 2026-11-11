import { digitStrokes } from './digits';
import type { P } from './geometry';

/**
 * $P point-cloud recognizer (Vatavu, Anthony, Wobbrock 2012).
 * Order- and direction-independent, so it suits a child's free writing.
 * Templates are generated from the digit skeletons (plus slants and mirror images).
 */

interface Pt {
  x: number;
  y: number;
  id: number;
}

const N = 32;

function cloudLength(pts: Pt[]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return d;
}

function resample(input: Pt[], n: number): Pt[] {
  const pts = input.slice();
  const I = cloudLength(pts) / (n - 1);
  if (I === 0) return Array.from({ length: n }, () => ({ ...pts[0] }));
  let D = 0;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id !== pts[i - 1].id) continue;
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (D + d >= I && d > 0) {
      const t = (I - D) / d;
      const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
      out.push(q);
      pts.splice(i, 0, q);
      D = 0;
    } else D += d;
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function normalize(strokes: P[][]): Pt[] {
  const flat: Pt[] = [];
  strokes.forEach((s, id) => s.forEach((p) => flat.push({ x: p.x, y: p.y, id })));
  let pts = resample(flat, N);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  pts = pts.map((p) => ({ x: (p.x - minX) / size, y: (p.y - minY) / size, id: p.id }));
  const cx = pts.reduce((a, p) => a + p.x, 0) / N;
  const cy = pts.reduce((a, p) => a + p.y, 0) / N;
  return pts.map((p) => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

function cloudDistance(a: Pt[], b: Pt[], start: number) {
  const matched = new Array(N).fill(false);
  let sum = 0;
  let i = start;
  do {
    let min = Infinity;
    let index = -1;
    for (let j = 0; j < N; j++) {
      if (matched[j]) continue;
      const d = Math.hypot(a[i].x - b[j].x, a[i].y - b[j].y);
      if (d < min) { min = d; index = j; }
    }
    matched[index] = true;
    const weight = 1 - ((i - start + N) % N) / N;
    sum += weight * min;
    i = (i + 1) % N;
  } while (i !== start);
  return sum;
}

function greedyMatch(a: Pt[], b: Pt[]) {
  const step = Math.floor(Math.pow(N, 0.5));
  let min = Infinity;
  for (let i = 0; i < N; i += step) min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  return min;
}

function transform(strokes: P[][], fn: (p: P) => P): P[][] {
  return strokes.map((s) => s.map(fn));
}

export interface Match {
  label: string;
  score: number;
}

export class Recognizer {
  private templates: { label: string; pts: Pt[] }[] = [];

  constructor() {
    for (let d = 0; d <= 10; d++) {
      const base = digitStrokes(d, 2);
      const variants = [0, -0.14, 0.14].map((shear) => transform(base, (p) => ({ x: p.x - shear * (p.y - 80), y: p.y })));
      variants.push(transform(base, (p) => ({ x: p.x * 1.25, y: p.y })));
      variants.push(transform(base, (p) => ({ x: p.x * 0.8, y: p.y })));
      for (const v of variants) this.templates.push({ label: String(d), pts: normalize(v) });
      if (![0, 1, 8, 10].includes(d)) {
        this.templates.push({ label: `${d}m`, pts: normalize(transform(base, (p) => ({ x: -p.x, y: p.y }))) });
      }
    }
  }

  /** Best score per label, ascending (lower = better). */
  classify(strokes: P[][]): Match[] {
    const cand = normalize(strokes);
    const best = new Map<string, number>();
    for (const t of this.templates) {
      const s = greedyMatch(cand, t.pts);
      if (!best.has(t.label) || s < best.get(t.label)!) best.set(t.label, s);
    }
    return [...best.entries()].map(([label, score]) => ({ label, score })).sort((a, b) => a.score - b.score);
  }
}

let instance: Recognizer | null = null;
export const recognizer = () => (instance ??= new Recognizer());

export type WriteVerdict = 'ok' | 'mirror' | 'no';

/** Is this writing the expected digit? `leniency` ≥ 1 accepts the expected label when it is close to the best match. */
export function judgeWriting(strokes: P[][], expected: number, leniency: number): { verdict: WriteVerdict; matches: Match[] } {
  const matches = recognizer().classify(strokes);
  const e = String(expected);
  const best = matches[0];
  const mine = matches.find((m) => m.label === e)!;
  if (best.label === e) return { verdict: 'ok', matches };
  if (best.label === `${e}m`) return { verdict: 'mirror', matches };
  if (mine.score <= best.score * leniency) return { verdict: 'ok', matches };
  return { verdict: 'no', matches };
}
