/**
 * Dev-only atelier (atelier.html): paints the big art, shows it next to the reference
 * and bakes it into public/art/*.webp through the dev server.
 *   await bakeAll()   – paint + save everything
 *   await compare()   – dog next to the reference, flattened into zz-preview.png
 */
import { paint, type Layer } from './brush';
import { DOG_PARTS, DOG_VB } from '../art/dogShapes';
import { dogFaceSvg } from '../art/dog';
import { HORSE_PARTS, HORSE_VB, horseFaceSvg } from '../art/horseShapes';
import { TURTLE_PARTS, TURTLE_VB, turtleFaceSvg, turtleFrontInk } from '../art/turtleShapes';
import { UNICORN_PARTS, UNICORN_VB, unicornFaceSvg } from '../art/unicornShapes';
import { SCENE_LAYERS, UI_ART } from '../art/sceneArt';

const out = document.getElementById('out')!;
const PART_W = 760;

function show(c: HTMLCanvasElement, label: string, w = 240) {
  const f = document.createElement('figure');
  c.style.width = `${w}px`;
  c.style.background = '#f4efe6';
  const cap = document.createElement('figcaption');
  cap.textContent = label;
  f.append(c, cap);
  out.append(f);
}

async function save(name: string, c: HTMLCanvasElement, type: 'webp' | 'png' = 'webp') {
  const url = c.toDataURL(`image/${type}`, 0.88);
  await fetch(`/__atelier/save?name=${name}.${type}`, { method: 'POST', body: url });
}

async function svgImage(inner: string, vb: number[], w: number, h: number) {
  const img = new Image();
  const style = '<style>.joy,.m-open,.m-tongue{display:none}</style>';
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb.join(' ')}">${style}${inner}</svg>`)}`;
  await img.decode();
  return img;
}

/** Draw canvases and SVG overlays (in order) into one canvas. */
async function flatten(items: (HTMLCanvasElement | string)[], vb: number[], w: number, h: number, bg?: string) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }
  for (const it of items) ctx.drawImage(typeof it === 'string' ? await svgImage(it, vb, w, h) : it, 0, 0, w, h);
  return c;
}

/** Crop a canvas to a view-box sub-rectangle and scale to width `w`. */
function crop(src: HTMLCanvasElement, vb: number[], sub: number[], w: number) {
  const k = src.width / vb[2];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = Math.round((w * sub[3]) / sub[2]);
  c.getContext('2d')!.drawImage(src, (sub[0] - vb[0]) * k, (sub[1] - vb[1]) * k, sub[2] * k, sub[3] * k, 0, 0, c.width, c.height);
  return c;
}

interface CritterArt {
  id: string;
  vb: [number, number, number, number];
  parts: Record<string, Layer[]>;
  order: string[];
  face: string;
  bodyInk?: string;
  frontInk?: string;
  /** Square crop around the head for buttons and the medal. */
  headBox: number[];
}

const CRITTERS: CritterArt[] = [
  { id: 'dog', vb: DOG_VB, parts: DOG_PARTS, order: ['tail', 'body', 'head', 'earL', 'earR'], face: dogFaceSvg('face'), bodyInk: dogFaceSvg('legs'), headBox: [150, 170, 1210, 1210] },
  { id: 'horse', vb: HORSE_VB, parts: HORSE_PARTS, order: ['body', 'head', 'earL', 'earR'], face: horseFaceSvg(), headBox: [180, 140, 1100, 1100] },
  { id: 'turtle', vb: TURTLE_VB, parts: TURTLE_PARTS, order: ['tail', 'body', 'head', 'front'], face: turtleFaceSvg(), frontInk: turtleFrontInk(), headBox: [400, 420, 660, 660] },
  { id: 'unicorn', vb: UNICORN_VB, parts: UNICORN_PARTS, order: ['body', 'head', 'earL', 'earR'], face: unicornFaceSvg(), headBox: [180, 140, 1100, 1100] },
];

async function bakeCritter(a: CritterArt, doSave: boolean) {
  const w = PART_W;
  const h = Math.round((w * a.vb[3]) / a.vb[2]);
  const painted: Record<string, HTMLCanvasElement> = {};
  for (const part of a.order) {
    painted[part] = await paint(a.parts[part], a.vb, w);
    if (doSave) await save(`${a.id}-${part}`, painted[part]);
  }
  const ears = a.order.filter((p) => p.startsWith('ear')).map((p) => painted[p]);
  const front = painted.front ? [painted.front, a.frontInk ?? ''] : [];
  const full = await flatten([...(painted.tail ? [painted.tail] : []), painted.body, a.bodyInk ?? '', painted.head, a.face, ...ears, ...front], a.vb, w, h);
  const headOnly = await flatten([painted.head, a.face, ...ears, ...front], a.vb, w, h);
  const face = crop(headOnly, a.vb, a.headBox, 360);
  const small = crop(full, a.vb, a.vb, 260);
  show(full, `${a.id} celý`);
  show(face, `${a.id} hlava`, 160);
  if (doSave) {
    await save(`${a.id}-face`, face);
    await save(`${a.id}-full`, small);
  }
  if (ears.length) {
    const bare = crop(await flatten([painted.head, a.face], a.vb, w, h), a.vb, a.headBox, 560);
    show(bare, `${a.id} bez uší`, 160);
    if (doSave) await save(`${a.id}-earless`, bare);
  }
  return full;
}

async function bakeScenes(doSave: boolean) {
  for (const s of [...SCENE_LAYERS, ...UI_ART]) {
    const c = await paint(s.layers, s.vb, s.px);
    show(c, s.name, Math.min(480, s.vb[2] / 2));
    if (doSave) await save(s.name, c);
  }
}

async function bakeAll(doSave = true) {
  out.innerHTML = '';
  for (const a of CRITTERS) await bakeCritter(a, doSave);
  await bakeScenes(doSave);
  return 'ok';
}

async function compare() {
  out.innerHTML = '';
  const full = await bakeCritter(CRITTERS[0], false);
  const flat = await flatten([full], DOG_VB, full.width, full.height, '#fff');
  await save('zz-preview', flat, 'png');
}

/** App icons: the painted dog head on paper. Saved to public/art, then moved to public/ by hand. */
async function bakeIcons() {
  const img = new Image();
  img.src = '/art/dog-face.webp?' + Date.now();
  await img.decode();
  for (const [name, size] of [['icon-512', 512], ['icon-192', 192], ['apple-touch-icon', 180]] as const) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#F6F0E4';
    ctx.fillRect(0, 0, size, size);
    const m = size * 0.06;
    ctx.drawImage(img, m, m * 1.4, size - 2 * m, size - 2 * m);
    await save(name, c, 'png');
  }
  return 'ok';
}

/** Paint (and optionally save) only the named animals and scenes. */
async function bakeOnly(names: string[], doSave = true) {
  out.innerHTML = '';
  for (const a of CRITTERS) if (names.includes(a.id)) await bakeCritter(a, doSave);
  for (const s of [...SCENE_LAYERS, ...UI_ART]) {
    if (!names.includes(s.name)) continue;
    const c = await paint(s.layers, s.vb, s.px);
    show(c, s.name, Math.min(480, s.vb[2] / 2));
    if (doSave) await save(s.name, c);
  }
  return 'ok';
}

Object.assign(window, { bakeIcons, bakeAll, bakeOnly, compare, bakeCritter, bakeScenes, CRITTERS });
const mode = new URLSearchParams(location.search).get('m');
if (mode === 'scenes') await bakeScenes(false);
else if (mode !== 'none') await bakeAll(false);
