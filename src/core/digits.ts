import type { P } from './geometry';

/** Stroke skeletons of digits in a 100×160 frame; each path is one stroke, its start = green dot. */
export const DIGITS: Record<string, string[]> = {
  '0': ['M50,10 C8,10 8,150 50,150 C92,150 92,10 50,10'],
  '1': ['M28,52 L64,10 L64,150'],
  '2': ['M18,48 C18,8 84,6 82,48 C80,80 40,112 16,150 L88,150'],
  '3': ['M20,32 C34,4 86,8 80,44 C76,70 52,78 44,78 C58,78 88,86 86,116 C84,156 30,160 14,128'],
  '4': ['M56,10 L14,102 L90,102', 'M68,56 L68,150'],
  '5': ['M30,12 L26,74 C50,56 88,66 86,106 C84,152 30,158 14,128', 'M30,12 L82,12'],
  '6': ['M76,22 C56,2 18,22 18,96 C18,140 38,150 52,150 C78,150 88,128 86,108 C84,82 58,72 42,80 C28,86 20,96 18,104'],
  '7': ['M14,12 L86,12 L38,150'],
  '8': ['M50,8 C22,8 20,36 34,52 C48,68 80,80 80,116 C80,156 20,156 20,116 C20,80 52,68 66,52 C80,36 78,8 50,8'],
  '9': ['M80,42 C76,6 22,8 22,46 C22,82 78,80 80,42 L72,150'],
};

export const FRAME_W = 100;
export const FRAME_H = 160;
/** Ten = "1" and "0" side by side, shifted by 0.82 of a digit width. */
const TEN_OFFSET = 82;

export interface DigitPath {
  d: string;
  dx: number;
}

export function digitPaths(n: number): DigitPath[] {
  if (n === 10) {
    return [...DIGITS['1'].map((d) => ({ d, dx: 0 })), ...DIGITS['0'].map((d) => ({ d, dx: TEN_OFFSET }))];
  }
  return DIGITS[String(n)].map((d) => ({ d, dx: 0 }));
}

export const digitWidth = (n: number) => (n === 10 ? FRAME_W + TEN_OFFSET : FRAME_W);

let probe: SVGPathElement | null = null;

function getProbe(): SVGPathElement {
  if (!probe) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.append(probe);
    document.body.append(svg);
  }
  return probe;
}

export function samplePath(d: string, step = 1, dx = 0): P[] {
  const p = getProbe();
  p.setAttribute('d', d);
  const L = p.getTotalLength();
  const n = Math.max(2, Math.ceil(L / step));
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const q = p.getPointAtLength((L * i) / n);
    out.push({ x: q.x + dx, y: q.y });
  }
  return out;
}

const cache = new Map<string, P[][]>();

/** Sampled stroke polylines of a digit in frame units. */
export function digitStrokes(n: number, step = 1): P[][] {
  const key = `${n}@${step}`;
  if (!cache.has(key)) cache.set(key, digitPaths(n).map((p) => samplePath(p.d, step, p.dx)));
  return cache.get(key)!;
}

/** SVG markup of the digit paths (inside a viewBox of the digit frame). */
export function digitPathMarkup(n: number, attrs: string): string {
  return digitPaths(n)
    .map((p) => `<path d="${p.d}" transform="translate(${p.dx},0)" ${attrs}></path>`)
    .join('');
}
