import type { Theme, Gift } from './types';
import { DOG_VB, PIVOT } from '../art/dogShapes';
import { dogFaceSvg } from '../art/dog';
import { artUrl } from '../core/critter';
import { bark, howl } from '../core/sound';
import { paintedImg } from '../paint/runtime';

const INK = '#20150E';
const icon = (svg: string) => (size: number) => paintedImg(svg, [0, 0, 100, 100], size);

/** Ten treats, from a single kibble (first medal) to a birthday cake (tenth). */
const TREATS: [string, string][] = [
  ['granulku', `<path d="M50,24 C70,22 82,40 78,58 C74,76 56,82 44,80 C26,76 18,58 22,42 C26,30 38,24 50,24 Z" fill="#8E5A2C"/><circle cx="50" cy="52" r="7" fill="#5C3A1C"/>`],
  ['piškot', `<rect x="10" y="34" width="80" height="32" rx="16" fill="#E2B35E"/><g fill="#FFF6E0"><circle cx="28" cy="46" r="3"/><circle cx="44" cy="54" r="3"/><circle cx="58" cy="44" r="3"/><circle cx="72" cy="54" r="3"/></g>`],
  ['sušenku', `<circle cx="50" cy="50" r="38" fill="#C98B4A"/><g fill="${INK}"><circle cx="36" cy="38" r="5"/><circle cx="60" cy="34" r="4"/><circle cx="64" cy="58" r="5"/><circle cx="40" cy="64" r="4"/><circle cx="52" cy="50" r="3"/></g>`],
  ['párek', `<g transform="rotate(-20 50 50)"><path d="M14,46 C14,36 22,34 50,36 C78,34 86,36 86,46 C86,58 78,62 50,60 C22,62 14,58 14,46 Z" fill="#B9533C"/><path d="M14,48 L6,44 M6,52 L14,50 M86,48 L94,44 M94,52 L86,50" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`],
  ['kousek sýra', `<path d="M10,70 L86,70 L86,36 L10,62 Z" fill="#E8C04A"/><path d="M10,62 L86,36 L70,26 Z" fill="#F2D978"/><g fill="#C79A2A"><circle cx="34" cy="64" r="5"/><circle cx="60" cy="56" r="7"/><circle cx="76" cy="62" r="4"/></g>`],
  ['kostičku', `<g transform="rotate(-20 50 50)"><path d="M30,42 C26,30 12,32 13,42 C6,46 8,58 16,58 C18,68 32,68 30,58 L70,58 C68,68 82,68 84,58 C92,58 94,46 87,42 C88,32 74,30 70,42 Z" fill="#B9773F"/></g>`],
  ['pamlskovou tyčinku', `<g transform="rotate(-35 50 50)"><rect x="10" y="40" width="80" height="20" rx="10" fill="#B4513A"/><path d="M26,40 L20,60 M42,40 L36,60 M58,40 L52,60 M74,40 L68,60" stroke="#F2E6CC" stroke-width="5"/></g>`],
  ['velkou kost', `<g transform="rotate(-25 50 50)"><path d="M28,42 C22,26 2,30 4,44 C-4,50 0,64 10,64 C12,78 30,78 28,64 L72,64 C70,78 88,78 90,64 C100,64 104,50 96,44 C98,30 78,26 72,42 Z" fill="#EDE0C4"/></g>`],
  ['kuřecí stehýnko', `<path d="M58,42 C70,22 92,26 92,46 C92,66 70,72 56,62 Z" fill="#B76E35"/><path d="M58,52 L22,80" stroke="#EDE0C4" stroke-width="10" stroke-linecap="round"/><circle cx="18" cy="76" r="7" fill="#EDE0C4"/><circle cx="24" cy="86" r="7" fill="#EDE0C4"/>`],
  ['dort', `<rect x="14" y="52" width="72" height="36" rx="6" fill="#EDE0C4"/><path d="M14,52 L86,52 L86,62 C80,70 74,58 68,64 C62,72 56,58 50,64 C44,72 38,58 32,64 C26,72 20,58 14,62 Z" fill="#D9617F"/><rect x="46" y="26" width="8" height="26" fill="#7FA7C4"/><path d="M50,10 C56,18 56,24 50,26 C44,24 44,18 50,10 Z" fill="#E2B13F"/><circle cx="30" cy="48" r="5" fill="#B4513A"/><circle cx="70" cy="48" r="5" fill="#B4513A"/>`],
];

const gifts: Gift[] = TREATS.map(([name, svg], i) => ({ name, icon: icon(svg), scale: 0.42 + (0.58 * i) / 9, food: true }));

export const DOG: Theme = {
  id: 'dog',
  animal: { nom: 'pejsek', gen: 'pejska', dat: 'pejskovi', ins: 'pejskem', Nom: 'Pejsek', g: 'm', plural: { one: 'pejsek', few: 'pejsci', many: 'pejsků' } },
  reward: { one: 'pamlsek', many: 'pamlsky' },
  bowl: 'misky',
  meadow: ['si hráli', 'si hrálo'],
  critter: { id: 'dog', vb: DOG_VB, parts: ['tail', 'body', 'head', 'earL', 'earR'], pivot: PIVOT, face: dogFaceSvg('face'), bodyInk: dogFaceSvg('legs'), call: () => bark(1), song: () => howl(1.7), floppy: true,
    anchor: { mouth: [800, 930], nose: [725, 760], top: [728, 300], ground: [735, 1880] } },
  head: artUrl('dog-face'),
  full: artUrl('dog-full'),
  earless: artUrl('dog-earless'),
  earZones: [
    { cx: 115, cy: 215, rx: 86, ry: 130 },
    { cx: 470, cy: 195, rx: 96, ry: 135 },
  ],
  home: { nom: 'bouda', loc: 'v boudě', acc: 'do boudy', art: artUrl('home-dog'), of: 'pejskova' },
  items: ['bone', 'ball', 'sausage'],
  food: 'sausage',
  gifts,
};
