export interface P {
  x: number;
  y: number;
}

export const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

export function pathLength(pts: P[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  return L;
}

export function centroid(pts: P[]): P {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function bbox(pts: P[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/** Points spaced ~`step` apart along a polyline (keeps the first point). */
export function resampleStep(pts: P[], step: number): P[] {
  if (pts.length < 2) return pts.slice();
  const out: P[] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let seg = dist(a, b);
    while (acc + seg >= step) {
      const t = (step - acc) / seg;
      const q = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
      out.push(q);
      a = q;
      seg = dist(a, b);
      acc = 0;
    }
    acc += seg;
  }
  return out;
}

/** Minimum distance from p to any of the sample points. */
export function nearestDist(p: P, samples: P[]): number {
  let best = Infinity;
  for (const s of samples) {
    const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/** Group strokes into clusters: strokes join when any of their points come within `gap`. */
export function clusterStrokes(strokes: P[][], gap: number): number[][] {
  const pts = strokes.map((s) => (s.length > 1 ? resampleStep(s, gap / 3) : s));
  const parent = strokes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < strokes.length; i++) {
    for (let j = i + 1; j < strokes.length; j++) {
      if (find(i) === find(j)) continue;
      let close = false;
      for (const a of pts[i]) {
        for (const b of pts[j]) {
          if (dist(a, b) < gap) {
            close = true;
            break;
          }
        }
        if (close) break;
      }
      if (close) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, number[]>();
  strokes.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  });
  return [...groups.values()];
}

export function insideEllipse(p: P, cx: number, cy: number, rx: number, ry: number) {
  return ((p.x - cx) / rx) ** 2 + ((p.y - cy) / ry) ** 2 <= 1;
}
