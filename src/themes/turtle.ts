import type { Theme, Gift } from './types';
import { TURTLE_VB, TURTLE_PIVOT, turtleFaceSvg, turtleFrontInk } from '../art/turtleShapes';
import { artUrl } from '../core/critter';
import { squeak, hum } from '../core/sound';
import { paintedImg, paintedImage } from '../paint/runtime';

const INK = '#20150E';
const icon = (svg: string) => (size: number) => paintedImg(svg, [0, 0, 100, 100], size);

const STRAWBERRY = `<path d="M50,30 C72,22 88,36 84,56 C80,76 62,90 50,92 C38,90 20,76 16,56 C12,36 28,22 50,30 Z" fill="#D9473F"/><path d="M50,30 L28,18 L42,28 L50,10 L58,28 L72,18 Z" fill="#5E8C3A"/><g fill="#F2D978"><circle cx="36" cy="48" r="3"/><circle cx="62" cy="46" r="3"/><circle cx="50" cy="60" r="3"/><circle cx="34" cy="68" r="3"/><circle cx="66" cy="68" r="3"/><circle cx="50" cy="78" r="3"/></g>`;
const BOW = `<path d="M50,50 L18,30 C12,40 12,60 18,70 Z M50,50 L82,30 C88,40 88,60 82,70 Z" fill="#7FA7C4"/><circle cx="50" cy="50" r="9" fill="#5C86A5"/>`;
const LETTUCE = `<path d="M50,12 C74,20 88,44 80,66 C74,82 60,90 50,90 C40,90 26,82 20,66 C12,44 26,20 50,12 Z" fill="#7DA44A"/><path d="M50,22 L50,88 M50,42 L66,32 M50,58 L70,48 M50,42 L34,32 M50,58 L30,48" stroke="#C9DB94" stroke-width="4" stroke-linecap="round"/>`;
const BALL = `<circle cx="50" cy="52" r="36" fill="#E2B13F"/><path d="M16,46 C36,56 64,56 84,46" fill="none" stroke="#D9617F" stroke-width="10"/><path d="M50,16 C40,36 40,68 50,88" fill="none" stroke="#7FA7C4" stroke-width="8"/>`;
const FLOWER = `<path d="M50,52 C48,66 46,78 40,92" fill="none" stroke="#5E8C3A" stroke-width="6" stroke-linecap="round"/><g fill="#E2B13F"><circle cx="50" cy="26" r="13"/><circle cx="71" cy="41" r="13"/><circle cx="63" cy="64" r="13"/><circle cx="37" cy="64" r="13"/><circle cx="29" cy="41" r="13"/></g><circle cx="50" cy="46" r="12" fill="#D9617F"/>`;
const BUCKET = `<path d="M22,36 L78,36 L70,88 L30,88 Z" fill="#D9617F"/><path d="M22,36 C22,10 78,10 78,36" fill="none" stroke="${INK}" stroke-width="4"/><rect x="18" y="32" width="64" height="10" rx="5" fill="#A8435C"/><path d="M84,30 L70,80" stroke="#E2B13F" stroke-width="7" stroke-linecap="round"/><path d="M62,76 L78,82 L74,96 L60,92 Z" fill="#E2B13F"/>`;
const BEADS = `<g>${Array.from({ length: 9 }, (_, i) => {
  const a = Math.PI * (0.1 + (0.8 * i) / 8);
  return `<circle cx="${50 - Math.cos(a) * 40}" cy="${30 + Math.sin(a) * 40}" r="8" fill="${['#D9617F', '#E2B13F', '#7FA7C4'][i % 3]}"/>`;
}).join('')}</g>`;
const MELON = `<path d="M10,40 L90,40 A40,40 0 0 1 10,40 Z" fill="#8FAA66"/><path d="M18,40 L82,40 A32,32 0 0 1 18,40 Z" fill="#E0566A"/><g fill="${INK}"><ellipse cx="36" cy="52" rx="2.5" ry="4"/><ellipse cx="50" cy="60" rx="2.5" ry="4"/><ellipse cx="64" cy="52" rx="2.5" ry="4"/></g>`;
const HAT = `<ellipse cx="50" cy="66" rx="46" ry="14" fill="#E9CF86"/><path d="M26,64 C26,34 74,34 74,64 Z" fill="#E9CF86"/><path d="M27,56 C40,60 60,60 73,56 L74,64 C60,68 40,68 26,64 Z" fill="#D9617F"/>`;
const CAKE = `<rect x="14" y="52" width="72" height="36" rx="6" fill="#EDE0C4"/><path d="M14,52 L86,52 L86,62 C80,70 74,58 68,64 C62,72 56,58 50,64 C44,72 38,58 32,64 C26,72 20,58 14,62 Z" fill="#8FAA66"/><rect x="46" y="26" width="8" height="26" fill="#D9617F"/><path d="M50,10 C56,18 56,24 50,26 C44,24 44,18 50,10 Z" fill="#E2B13F"/><circle cx="30" cy="48" r="5" fill="#D9473F"/><circle cx="70" cy="48" r="5" fill="#D9473F"/>`;

/** An icon placed in the turtle's art frame (centre x,y, size in frame units). */
const at = (svg: string, x: number, y: number, size: number, rot = 0) =>
  paintedImage(svg, [0, 0, 100, 100], x, y, size, size * 0.3, undefined, rot ? `rotate(${rot} ${x} ${y})` : '');

const gifts: Gift[] = [
  { name: 'jahodu', icon: icon(STRAWBERRY), scale: 0.6, food: true },
  { name: 'mašli', icon: icon(BOW), worn: { on: 'head', svg: at(BOW, 556, 610, 230, -34) } },
  { name: 'lísteček salátu', icon: icon(LETTUCE), scale: 0.7, food: true },
  { name: 'míček', icon: icon(BALL), scale: 0.75 },
  { name: 'kytičku', icon: icon(FLOWER), worn: { on: 'head', svg: at(FLOWER, 906, 580, 180, 24) } },
  { name: 'kyblíček', icon: icon(BUCKET), scale: 0.85 },
  { name: 'korálky', icon: icon(BEADS), worn: { on: 'body', svg: at(BEADS, 730, 1100, 420) } },
  { name: 'kousek melounu', icon: icon(MELON), scale: 0.9, food: true },
  { name: 'klobouček', icon: icon(HAT), worn: { on: 'head', svg: at(HAT, 740, 470, 330, 6) } },
  { name: 'dort', icon: icon(CAKE), scale: 1, food: true },
];

export const TURTLE: Theme = {
  id: 'turtle',
  animal: { nom: 'želvička', gen: 'želvičky', dat: 'želvičce', ins: 'želvičkou', Nom: 'Želvička', g: 'f', plural: { one: 'želvička', few: 'želvičky', many: 'želviček' } },
  bowl: 'misky',
  meadow: ['se procházely', 'se procházelo'],
  critter: { id: 'turtle', vb: TURTLE_VB, parts: ['tail', 'body', 'head', 'front'], pivot: TURTLE_PIVOT, face: turtleFaceSvg(), frontInk: turtleFrontInk(), call: squeak, song: hum, shell: true,
    anchor: { mouth: [730, 880], nose: [730, 790], top: [730, 500], ground: [735, 1890] } },
  head: artUrl('turtle-face'),
  full: artUrl('turtle-full'),
  home: { nom: 'jezírko', loc: 'u jezírka', acc: 'k jezírku', art: artUrl('home-turtle'), of: 'želviččino' },
  items: ['strawberry', 'leaf', 'shell'],
  food: 'strawberry',
  gifts,
};
