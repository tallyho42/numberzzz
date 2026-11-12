import type { Theme, Gift } from './types';
import { UNICORN_VB, UNICORN_PIVOT, unicornFaceSvg } from '../art/unicornShapes';
import { artUrl } from '../core/critter';
import { neigh, sparkle } from '../core/sound';
import { paintedImg, paintedImage } from '../paint/runtime';

const INK = '#20150E';
const icon = (svg: string) => (size: number) => paintedImg(svg, [0, 0, 100, 100], size);

const HEART = `<path d="M50,86 C30,72 12,58 12,38 C12,24 22,16 33,16 C41,16 47,21 50,28 C53,21 59,16 67,16 C78,16 88,24 88,38 C88,58 70,72 50,86 Z" fill="#D9617F"/>`;
const BOW = `<path d="M50,50 L18,30 C12,40 12,60 18,70 Z M50,50 L82,30 C88,40 88,60 82,70 Z" fill="#A487C9"/><circle cx="50" cy="50" r="9" fill="#7E62A6"/>`;
const CUPCAKE = `<path d="M24,54 L76,54 L68,92 L32,92 Z" fill="#7FA7C4"/><path d="M38,54 L40,92 M50,54 L50,92 M62,54 L60,92" stroke="#5C86A5" stroke-width="3"/><path d="M18,56 C14,36 30,28 40,30 C42,16 58,16 60,30 C70,28 86,36 82,56 Z" fill="#F2B6C6"/><circle cx="50" cy="18" r="8" fill="#C8433A"/>`;
const WAND = `<path d="M20,86 L62,40" stroke="#7A4A26" stroke-width="8" stroke-linecap="round"/><path d="M66,10 L73,28 L92,29 L77,41 L82,60 L66,49 L50,60 L55,41 L40,29 L59,28 Z" fill="#E2B13F"/>`;
const WREATH = Array.from({ length: 7 }, (_, i) => {
  const a = Math.PI * (1.08 + (0.84 * i) / 6);
  const x = 50 + Math.cos(a) * 42;
  const y = 74 + Math.sin(a) * 42;
  const c = ['#D9617F', '#E2B13F', '#A487C9', '#7FA7C4'][i % 4];
  return `<circle cx="${x}" cy="${y}" r="9" fill="#8FAA66"/><circle cx="${x}" cy="${y - 3}" r="7" fill="${c}"/>`;
}).join('');
const RAINBOW = ['#D9617F', '#E89A4A', '#E2B13F', '#8FAA66', '#7FA7C4', '#A487C9']
  .map((c, i) => `<path d="M${8 + i * 7},80 A${42 - i * 7},${42 - i * 7} 0 0 1 ${92 - i * 7},80" fill="none" stroke="${c}" stroke-width="7"/>`)
  .join('');
const NECKLACE = `<path d="M14,20 C24,56 76,56 86,20" fill="none" stroke="#E2B13F" stroke-width="5"/><path d="M38,50 L44,42 L56,42 L62,50 L50,70 Z" fill="#7FA7C4"/>`;
const APPLE = `<path d="M50,30 C34,18 14,30 16,52 C18,74 36,90 50,84 C64,90 82,74 84,52 C86,30 66,18 50,30 Z" fill="#C8433A"/><path d="M50,30 L52,14" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M53,20 C60,10 74,12 76,16 C68,24 60,24 53,20 Z" fill="#5E8C3A"/>`;
const BALLOON = `<path d="M50,64 C66,64 78,48 78,32 C78,16 66,6 50,6 C34,6 22,16 22,32 C22,48 34,64 50,64 Z" fill="#A487C9"/><path d="M46,64 L54,64 L50,70 Z" fill="#7E62A6"/><path d="M50,70 C42,78 58,86 50,96" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
const STAR = `<path d="M50,10 L61,37 L90,38 L67,56 L75,85 L50,68 L25,85 L33,56 L10,38 L39,37 Z" fill="#E2B13F"/>`;

/** An icon placed in the unicorn's art frame (centre x,y, size in frame units). */
const at = (svg: string, x: number, y: number, size: number, rot = 0) =>
  paintedImage(svg, [0, 0, 100, 100], x, y, size, size * 0.3, undefined, rot ? `rotate(${rot} ${x} ${y})` : '');

const gifts: Gift[] = [
  { name: 'srdíčko', icon: icon(HEART), scale: 0.6 },
  { name: 'mašli', icon: icon(BOW), worn: { on: 'head', svg: at(BOW, 1010, 760, 230, 24) } },
  { name: 'dortíček', icon: icon(CUPCAKE), scale: 0.7, food: true },
  { name: 'kouzelnou hůlku', icon: icon(WAND), scale: 0.9 },
  { name: 'věneček', icon: icon(WREATH), worn: { on: 'head', svg: at(WREATH, 730, 410, 420) } },
  { name: 'duhu', icon: icon(RAINBOW), scale: 1 },
  { name: 'náhrdelník', icon: icon(NECKLACE), worn: { on: 'body', svg: at(NECKLACE, 730, 1330, 420) } },
  { name: 'jablíčko', icon: icon(APPLE), scale: 0.75, food: true },
  { name: 'balónek', icon: icon(BALLOON), scale: 0.95 },
  { name: 'hvězdičku', icon: icon(STAR), worn: { on: 'head', svg: at(STAR, 730, 176, 130) } },
];

export const UNICORN: Theme = {
  id: 'unicorn',
  animal: { nom: 'jednorožec', gen: 'jednorožce', dat: 'jednorožci', ins: 'jednorožcem', Nom: 'Jednorožec', g: 'm', plural: { one: 'jednorožec', few: 'jednorožci', many: 'jednorožců' } },
  bowl: 'misky',
  meadow: ['se pásli', 'se páslo'],
  critter: { id: 'unicorn', vb: UNICORN_VB, parts: ['body', 'head', 'earL', 'earR'], pivot: UNICORN_PIVOT, face: unicornFaceSvg(),
    call: () => { neigh(1.35); sparkle(); }, song: () => { neigh(1.15); setTimeout(sparkle, 500); },
    anchor: { mouth: [730, 1180], nose: [730, 1070], top: [730, 240], ground: [735, 1890] } },
  head: artUrl('unicorn-face'),
  full: artUrl('unicorn-full'),
  earless: artUrl('unicorn-earless'),
  earZones: [
    { cx: 200, cy: 130, rx: 78, ry: 108 },
    { cx: 400, cy: 130, rx: 78, ry: 108 },
  ],
  home: { nom: 'zámek', loc: 'na zámku', acc: 'na zámek', art: artUrl('home-unicorn'), of: 'jednorožcův' },
  items: ['cupcake', 'gem', 'heart'],
  food: 'cupcake',
  gifts,
};
