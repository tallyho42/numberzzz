import type { Theme, Gift } from './types';
import { HORSE_HEAD, STAR_PATH } from '../art/art';

const icon24 = (d: string, fill: string, stroke: string) => (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;

const FLOWER = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
  <path d="M50,52 C48,66 46,78 40,92" fill="none" stroke="#3DAA5C" stroke-width="5" stroke-linecap="round"/>
  <path d="M46,74 C36,66 26,70 24,78 C34,82 42,80 46,74 Z" fill="#5CB85C" stroke="#3A8A3A" stroke-width="3"/>
  <g fill="#F07A8E" stroke="#D6455E" stroke-width="3"><circle cx="50" cy="26" r="12"/><circle cx="70" cy="40" r="12"/><circle cx="62" cy="62" r="12"/><circle cx="38" cy="62" r="12"/><circle cx="30" cy="40" r="12"/></g>
  <circle cx="50" cy="45" r="11" fill="#FFCC33" stroke="#E0A800" stroke-width="3"/></svg>`;

const gifts: Gift[] = [
  {
    name: 'mašli',
    icon: icon24('M12 12 L4 7 L4 17 Z M12 12 L20 7 L20 17 Z', '#E2558C', '#A8335F'),
    worn: '<path d="M92,104 L72,92 L74,118 Z M92,104 L112,94 L108,120 Z" fill="#E2558C" stroke="#A8335F" stroke-width="2.5" stroke-linejoin="round"/><circle cx="92" cy="105" r="5" fill="#A8335F"/>',
  },
  {
    name: 'hvězdičku',
    icon: icon24(STAR_PATH, '#FFCC33', '#E0A800'),
    worn: '<path d="M184,92 l2.6,5.4 5.9,0.8 -4.3,4.1 1,5.9 -5.2,-2.8 -5.2,2.8 1,-5.9 -4.3,-4.1 5.9,-0.8z" fill="#FFCC33" stroke="#E0A800" stroke-width="1.2"/>',
  },
  {
    name: 'zvoneček',
    icon: icon24('M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4z M10.5 19a1.5 1.5 0 0 0 3 0z', '#FFCC33', '#B88A00'),
    worn: '<path d="M72,198 Q100,214 130,204" fill="none" stroke="#B5442F" stroke-width="5" stroke-linecap="round"/><path d="M93,222 h16 l-2,-3 v-6 a6,6 0 0 0 -12,0 v6z" fill="#FFCC33" stroke="#B88A00" stroke-width="2"/>',
  },
  { name: 'jablíčko', icon: icon24('M12 7c-3-2-7 0-7 5s3 9 7 8c4 1 7-3 7-8s-4-7-7-5z M12 7l1-3', '#E8574B', '#A8352B'), at: { x: 345, y: 462, size: 62 } },
  { name: 'zlatou podkovu', icon: icon24('M6 4h3v9a3 3 0 0 0 6 0V4h3v9a6 6 0 0 1-12 0z', '#FFCC33', '#B88A00'), at: { x: 240, y: 86, size: 96 } },
  { name: 'srdíčko', icon: icon24('M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z', '#E2558C', '#A8335F'), at: { x: 405, y: 90, size: 80, rot: -8 } },
  {
    name: 'korunku',
    icon: icon24('M4 17l1-9 4 4 3-6 3 6 4-4 1 9z', '#FFCC33', '#B88A00'),
    worn: '<path d="M107,74 L110,50 L118,61 L125,44 L132,61 L140,50 L143,74 Z" fill="#FFCC33" stroke="#B88A00" stroke-width="2.4" stroke-linejoin="round"/><circle cx="125" cy="66" r="3.5" fill="#E2558C"/>',
  },
  { name: 'sedlo', icon: icon24('M4 12c3 0 4-4 8-4s5 4 8 4v3H4z', '#8A5A35', '#5A3A20'), at: { x: 95, y: 118, size: 120 } },
  { name: 'mrkev', icon: icon24('M15 5l4 4-11 11-3-3z', '#F28C28', '#B85C12'), at: { x: 418, y: 458, size: 74 } },
  {
    name: 'kytičku',
    icon: FLOWER,
    worn: '<g transform="translate(84 118) scale(0.32) translate(-50 -50)">' + FLOWER(100).replace(/<\/?svg[^>]*>/g, '') + '</g>',
  },
];

export const HORSE: Theme = {
  id: 'horse',
  animal: { nom: 'koník', gen: 'koníka', dat: 'koníkovi', ins: 'koníkem', Nom: 'Koník' },
  head: HORSE_HEAD,
  home: { nom: 'stáj', loc: 've stáji', acc: 'do stáje' },
  items: ['carrot', 'apple', 'horseshoe'],
  food: 'carrot',
  gifts,
};
