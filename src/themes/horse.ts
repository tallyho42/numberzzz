import type { Theme, Gift } from './types';
import { HORSE_VB, HORSE_PIVOT, horseFaceSvg } from '../art/horseShapes';
import { artUrl } from '../core/critter';
import { neigh } from '../core/sound';
import { paintedImg, paintedImage } from '../paint/runtime';

const INK = '#20150E';
const icon = (svg: string) => (size: number) => paintedImg(svg, [0, 0, 100, 100], size);

const BOW = `<path d="M50,50 L18,30 C12,40 12,60 18,70 Z M50,50 L82,30 C88,40 88,60 82,70 Z" fill="#D9617F"/><circle cx="50" cy="50" r="9" fill="#A8435C"/>`;
const STAR = `<path d="M50,10 L61,37 L90,38 L67,56 L75,85 L50,68 L25,85 L33,56 L10,38 L39,37 Z" fill="#E2B13F"/>`;
const BELL = `<path d="M24,72 L76,72 L70,64 L70,46 C70,32 62,24 50,24 C38,24 30,32 30,46 L30,64 Z" fill="#E2B13F"/><circle cx="50" cy="80" r="7" fill="#A97E1E"/><path d="M50,24 L50,16" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
const APPLE = `<path d="M50,30 C34,18 14,30 16,52 C18,74 36,90 50,84 C64,90 82,74 84,52 C86,30 66,18 50,30 Z" fill="#C8433A"/><path d="M50,30 L52,14" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M53,20 C60,10 74,12 76,16 C68,24 60,24 53,20 Z" fill="#5E8C3A"/>`;
const SHOE = `<path d="M26,18 L26,52 A24,24 0 0 0 74,52 L74,18" fill="none" stroke="#E2B13F" stroke-width="16" stroke-linecap="round"/><circle cx="26" cy="34" r="2.6" fill="${INK}"/><circle cx="74" cy="34" r="2.6" fill="${INK}"/><circle cx="32" cy="60" r="2.6" fill="${INK}"/><circle cx="68" cy="60" r="2.6" fill="${INK}"/>`;
const HEART = `<path d="M50,86 C30,72 12,58 12,38 C12,24 22,16 33,16 C41,16 47,21 50,28 C53,21 59,16 67,16 C78,16 88,24 88,38 C88,58 70,72 50,86 Z" fill="#D9617F"/>`;
const CROWN = `<path d="M14,74 L18,30 L36,48 L50,22 L64,48 L82,30 L86,74 Z" fill="#E2B13F"/><circle cx="50" cy="60" r="6" fill="#D9617F"/>`;
const SADDLE = `<path d="M10,52 C26,52 30,32 50,32 C70,32 74,52 90,52 L90,66 L10,66 Z" fill="#7A4A26"/><path d="M44,66 L44,86 M38,86 L50,86" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
const CARROT = `<path d="M60,24 L56,8 M64,26 L74,12 M68,30 L86,24" stroke="#5E8C3A" stroke-width="7" stroke-linecap="round"/><path d="M48,26 C62,18 78,30 72,42 L28,86 C22,90 16,86 18,80 Z" fill="#E07B2C"/>`;
const FLOWER = `<path d="M50,52 C48,66 46,78 40,92" fill="none" stroke="#5E8C3A" stroke-width="6" stroke-linecap="round"/><g fill="#D9617F"><circle cx="50" cy="26" r="13"/><circle cx="71" cy="41" r="13"/><circle cx="63" cy="64" r="13"/><circle cx="37" cy="64" r="13"/><circle cx="29" cy="41" r="13"/></g><circle cx="50" cy="46" r="12" fill="#E2B13F"/>`;

/** An icon placed in the horse's art frame (centre x,y, size in frame units). */
const at = (svg: string, x: number, y: number, size: number, rot = 0) =>
  paintedImage(svg, [0, 0, 100, 100], x, y, size, size * 0.3, undefined, rot ? `rotate(${rot} ${x} ${y})` : '');

const gifts: Gift[] = [
  { name: 'mašli', icon: icon(BOW), worn: { on: 'head', svg: at(BOW, 630, 400, 230, -14) } },
  { name: 'hvězdičku', icon: icon(STAR), worn: { on: 'head', svg: at(STAR, 730, 650, 140) } },
  { name: 'zvoneček', icon: icon(BELL), worn: { on: 'body', svg: `<path d="M560,1240 Q730,1310 900,1240" fill="none" stroke="#B4513A" stroke-width="30" stroke-linecap="round"/>${at(BELL, 730, 1330, 170)}` } },
  { name: 'jablíčko', icon: icon(APPLE), scale: 0.8, food: true },
  { name: 'zlatou podkovu', icon: icon(SHOE), scale: 0.9 },
  { name: 'srdíčko', icon: icon(HEART), scale: 0.8 },
  { name: 'korunku', icon: icon(CROWN), worn: { on: 'head', svg: at(CROWN, 730, 240, 300) } },
  { name: 'sedlo', icon: icon(SADDLE), scale: 1 },
  { name: 'mrkev', icon: icon(CARROT), scale: 0.9, food: true },
  { name: 'kytičku', icon: icon(FLOWER), worn: { on: 'head', svg: at(FLOWER, 925, 430, 220, 20) } },
];

export const HORSE: Theme = {
  id: 'horse',
  animal: { nom: 'koník', gen: 'koníka', dat: 'koníkovi', ins: 'koníkem', Nom: 'Koník', g: 'm', plural: { one: 'koník', few: 'koníci', many: 'koníků' } },
  bowl: 'žlabu',
  meadow: ['se pásli', 'se páslo'],
  critter: { id: 'horse', vb: HORSE_VB, parts: ['body', 'head', 'earL', 'earR'], pivot: HORSE_PIVOT, face: horseFaceSvg(), call: neigh, song: neigh,
    anchor: { mouth: [730, 1180], nose: [730, 1070], top: [730, 240], ground: [735, 1890] } },
  head: artUrl('horse-face'),
  full: artUrl('horse-full'),
  earless: artUrl('horse-earless'),
  earZones: [
    { cx: 200, cy: 130, rx: 78, ry: 108 },
    { cx: 400, cy: 130, rx: 78, ry: 108 },
  ],
  home: { nom: 'stáj', loc: 've stáji', acc: 'do stáje', art: artUrl('home-horse'), of: 'koníkova' },
  items: ['carrot', 'apple', 'horseshoe'],
  food: 'carrot',
  gifts,
};
