/**
 * Dry-brush painter: turns flat SVG shapes into painted-looking layers
 * (streaky fill, light gaps near the edges, bristle marks running past the shape, specks).
 * Used only by the dev atelier, which bakes the results into PNGs for the game.
 */

export interface Brush {
  /** Stroke direction in degrees (0 = left→right, 90 = top→bottom). */
  angle?: number;
  /** 0..1 – how many paper gaps show through (dry brush). */
  dry?: number;
  /** Width of the edge zone where gaps gather (design units). */
  zone?: number;
  /** Rough-edge amplitude (design units). */
  edge?: number;
  /** How far bristle marks run past the shape (design units). */
  bristle?: number;
  /** Bristle spacing (design units). */
  grain?: number;
  /** Tonal variation 0..1. */
  tone?: number;
  /** Splatter specks around the shape 0..1. */
  speck?: number;
  /** How far the specks fly (design units). */
  speckRange?: number;
  seed?: number;
  /** Keep the inside clean: gaps and scratches only near the edge (paper cards). */
  clean?: boolean;
}

export interface Layer {
  /** SVG markup in the design coordinate system. */
  svg: string;
  brush?: Brush;
}

const DEF: Required<Brush> = { angle: 90, dry: 0.3, zone: 30, edge: 3, bristle: 0, grain: 3, tone: 0.35, speck: 0, speckRange: 40, seed: 1, clean: false };

function hash(x: number, y: number, s: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Value noise from a fixed lattice table (much faster than hashing every corner).
const PERM = new Uint8Array(512);
const VAL = new Float32Array(256);
{
  let r = 12345;
  const rand = () => ((r = Math.imul(r ^ (r >>> 15), 2246822519) + 0x9e3779b9) >>> 0) / 4294967296;
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) VAL[i] = rand();
}

function noise(x: number, y: number, s: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const X = (xi + s * 37) & 255;
  const Y = (yi + s * 71) & 255;
  const X1 = (X + 1) & 255;
  const Y1 = (Y + 1) & 255;
  const a = VAL[PERM[PERM[X] + Y]];
  const b = VAL[PERM[PERM[X1] + Y]];
  const c = VAL[PERM[PERM[X] + Y1]];
  const d = VAL[PERM[PERM[X1] + Y1]];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Squared Euclidean distance to the nearest seed pixel (dead-reckoning), plus that seed's position. */
function distance(seed: Uint8Array, w: number, h: number) {
  const n = w * h;
  const d = new Float32Array(n).fill(1e18);
  const sx = new Int32Array(n).fill(-1);
  const sy = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i++) if (seed[i]) {
    d[i] = 0;
    sx[i] = i % w;
    sy[i] = (i / w) | 0;
  }
  const relax = (x: number, y: number, i: number, nx: number, ny: number) => {
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const j = ny * w + nx;
    if (sx[j] < 0) return;
    const dx = x - sx[j];
    const dy = y - sy[j];
    const dd = dx * dx + dy * dy;
    if (dd < d[i]) {
      d[i] = dd;
      sx[i] = sx[j];
      sy[i] = sy[j];
    }
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    relax(x, y, i, x - 1, y - 1); relax(x, y, i, x, y - 1); relax(x, y, i, x + 1, y - 1); relax(x, y, i, x - 1, y);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    relax(x, y, i, x + 1, y + 1); relax(x, y, i, x, y + 1); relax(x, y, i, x - 1, y + 1); relax(x, y, i, x + 1, y);
  }
  return { d, sx, sy };
}

async function rasterize(svg: string, vb: [number, number, number, number], w: number, h: number) {
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb.join(' ')}">${svg}</svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(doc)}`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/** Paint one layer; returns RGBA pixels (straight alpha) at w×h. */
async function paintOne(layer: Layer, vb: [number, number, number, number], w: number, h: number): Promise<ImageData> {
  const b = { ...DEF, ...layer.brush };
  const k = w / vb[2]; // px per design unit
  const src = await rasterize(layer.svg, vb, w, h);
  const s = src.data;
  const n = w * h;
  const inside = new Uint8Array(n);
  const outside = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (s[i * 4 + 3] >= 128) inside[i] = 1;
    else outside[i] = 1;
  }
  const din = distance(outside, w, h).d;
  const dout = distance(inside, w, h);
  const out = new ImageData(w, h);
  const o = out.data;
  const ca = Math.cos((b.angle * Math.PI) / 180);
  const sa = Math.sin((b.angle * Math.PI) / 180);
  const grain = Math.max(0.6, b.grain * k);
  const edge = b.edge * k;
  const zone = Math.max(1, b.zone * k);
  const bristle = b.bristle * k;
  const speckR = b.speckRange * k;
  const reach = Math.max(bristle, b.speck > 0 ? speckR : 0) + edge + 2;
  const reach2 = reach * reach;
  const seed = b.seed * 7919;
  const toneScale = 60 * k;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    const d2 = inside[i] ? din[i] : dout.d[i];
    if (!inside[i] && d2 > reach2) continue;
    const sd = inside[i] ? Math.sqrt(d2) : -Math.sqrt(d2);
    const u = x * ca + y * sa;
    const v = -x * sa + y * ca;
    const warp = (noise(x / (90 * k), y / (90 * k), seed + 1) - 0.5) * grain * 5;
    const vv = (v + warp) / grain;
    const st =
      0.55 * noise(u / (grain * 16), vv, seed) +
      0.3 * noise(u / (grain * 6), vv * 2.3, seed + 2) +
      0.15 * noise(u / (grain * 2), vv * 4.1, seed + 5);
    const e = (noise(x / (edge * 2.5 + 1.5), y / (edge * 2.5 + 1.5), seed + 3) - 0.5) * 2 * edge + (st - 0.5) * edge * 0.8;
    const sp = sd + e;
    let a = 0;
    // Pixels outside the drawn shape borrow the colour of the nearest painted pixel.
    let si = inside[i] ? i : dout.sy[i] * w + dout.sx[i];
    if (sp >= 0) {
      const near = Math.max(0, 1 - sp / zone);
      const gap = b.dry * ((b.clean ? 0 : 0.14) + 0.86 * near * near);
      // thin dry scratches scattered over the whole shape
      const sc = noise(u / (grain * 9), vv * 2.8 + 17, seed + 7);
      const patch = smooth((noise(x / (130 * k), y / (130 * k), seed + 13) - 0.5) / 0.18 + 0.5);
      const scratch = b.clean && near <= 0 ? 0 : smooth((b.dry * 0.3 * patch * (b.clean ? near : 1) - sc) / 0.04 + 0.5);
      a = smooth((st - gap) / 0.1 + 0.5) * (1 - scratch * 0.85) * Math.min(1, sp + 0.6);
    } else {
      const dist = -sp;
      if (bristle > 0) {
        const dx = x - dout.sx[i];
        const dy = y - dout.sy[i];
        const len = Math.hypot(dx, dy) || 1;
        const f = Math.abs((dx * ca + dy * sa) / len);
        const kk = dist / (bristle * (0.25 + 0.75 * f * f));
        if (kk < 1) a = smooth((st - (0.5 + 0.42 * kk)) / 0.07 + 0.5) * (1 - kk * kk * 0.5);
      }
      if (b.speck > 0 && dist < speckR) {
        const cs = Math.max(2, 2.2 * k);
        const cx = Math.floor(x / cs);
        const cy = Math.floor(y / cs);
        const r = hash(cx, cy, seed + 9);
        const fall = 1 - dist / speckR;
        if (r < b.speck * 0.08 * fall * fall) {
          const ox = (hash(cx, cy, seed + 10) * 0.6 + 0.2) * cs;
          const oy = (hash(cx, cy, seed + 11) * 0.6 + 0.2) * cs;
          const rr = cs * (0.25 + 0.3 * hash(cx, cy, seed + 12));
          const dd = Math.hypot(x - cx * cs - ox, y - cy * cs - oy);
          a = Math.max(a, smooth((rr - dd) / 0.8 + 0.5));
        }
      }
    }
    if (a <= 0.004) continue;
    const broad = noise(u / (grain * 60), v / (grain * 14), seed + 6);
    const blot = noise(x / toneScale, y / toneScale, seed + 4);
    const t = b.clean && sp >= zone ? 1 : (1 + b.tone * ((st - 0.5) * 0.4 + (broad - 0.5) * 0.55 + (blot - 0.5) * 0.25)) * (0.94 + 0.12 * hash(x, y, seed + 8));
    o[i * 4] = Math.min(255, s[si * 4] * t);
    o[i * 4 + 1] = Math.min(255, s[si * 4 + 1] * t);
    o[i * 4 + 2] = Math.min(255, s[si * 4 + 2] * t);
    o[i * 4 + 3] = a * 255;
  }
  return out;
}

/** Paint layers bottom-up into one canvas of the given pixel width (height follows the view box). */
export async function paint(layers: Layer[], vb: [number, number, number, number], width: number): Promise<HTMLCanvasElement> {
  const w = Math.round(width);
  const h = Math.round((width * vb[3]) / vb[2]);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext('2d')!;
  for (const l of layers) {
    tctx.putImageData(await paintOne(l, vb, w, h), 0, 0);
    ctx.drawImage(tmp, 0, 0);
  }
  return c;
}
