/**
 * The presents: flat drawings in a 100×100 frame (the brush paints them when shown).
 * Every animal gets 8 – accessory, treat, accessory, treat… – the treats grow from a small
 * bite to a huge cake, the accessories stay on the animal wherever Meda puts them.
 */
import type { Gift } from './types';
import { paintedImg } from '../paint/runtime';

const INK = '#20150E';

const icon = (svg: string) => (size: number) => paintedImg(svg, [0, 0, 100, 100], size);

export const treat = (name: string, art: string, scale: number): Gift => ({ name, art, icon: icon(art), scale, food: true });
export const accessory = (name: string, art: string, worn: NonNullable<Gift['worn']>): Gift => ({ name, art, icon: icon(art), scale: 0.8, worn });

const cake = (cream: string, top: string, deco = '') =>
  `<rect x="10" y="50" width="80" height="40" rx="7" fill="#EDE0C4"/><rect x="10" y="66" width="80" height="6" fill="${cream}"/>` +
  `<path d="M10,50 L90,50 L90,60 C84,68 78,56 72,62 C66,70 60,56 54,62 C48,70 42,56 36,62 C30,70 24,56 18,62 C14,66 12,60 10,60 Z" fill="${cream}"/>` +
  `<rect x="46" y="24" width="8" height="26" fill="${top}"/><path d="M50,8 C56,16 56,22 50,24 C44,22 44,16 50,8 Z" fill="#E2B13F"/>${deco}`;

export const ART = {
  // ---- treats
  biscuit: `<rect x="10" y="34" width="80" height="32" rx="16" fill="#E2B35E"/><g fill="#FFF6E0"><circle cx="28" cy="46" r="3"/><circle cx="44" cy="54" r="3"/><circle cx="58" cy="44" r="3"/><circle cx="72" cy="54" r="3"/></g>`,
  sausage: `<g transform="rotate(-20 50 50)"><path d="M14,46 C14,36 22,34 50,36 C78,34 86,36 86,46 C86,58 78,62 50,60 C22,62 14,58 14,46 Z" fill="#B9533C"/><path d="M14,48 L6,44 M6,52 L14,50 M86,48 L94,44 M94,52 L86,50" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></g>`,
  bigBone: `<g transform="rotate(-25 50 50)"><path d="M28,42 C22,26 2,30 4,44 C-4,50 0,64 10,64 C12,78 30,78 28,64 L72,64 C70,78 88,78 90,64 C100,64 104,50 96,44 C98,30 78,26 72,42 Z" fill="#EDE0C4"/></g>`,
  dogCake: cake('#B9773F', '#7FA7C4', `<g transform="translate(30 30) scale(0.4)"><path d="M28,42 C22,26 2,30 4,44 C-4,50 0,64 10,64 C12,78 30,78 28,64 L72,64 C70,78 88,78 90,64 C100,64 104,50 96,44 C98,30 78,26 72,42 Z" fill="#B9773F"/></g>`),
  sugar: `<path d="M28,40 L58,30 L80,42 L50,52 Z" fill="#FFFFFF"/><path d="M28,40 L50,52 L50,80 L28,68 Z" fill="#E9E1D3"/><path d="M50,52 L80,42 L80,70 L50,80 Z" fill="#D6CCBA"/>`,
  apple: `<path d="M50,30 C34,18 14,30 16,52 C18,74 36,90 50,84 C64,90 82,74 84,52 C86,30 66,18 50,30 Z" fill="#C8433A"/><path d="M50,30 L52,14" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M53,20 C60,10 74,12 76,16 C68,24 60,24 53,20 Z" fill="#5E8C3A"/>`,
  carrots: [-24, 0, 24]
    .map((r) => `<g transform="rotate(${r} 50 90)"><path d="M46,30 L42,14 M52,30 L58,12" stroke="#5E8C3A" stroke-width="6" stroke-linecap="round"/><path d="M40,32 C46,26 56,26 60,32 L52,92 C51,96 49,96 48,92 Z" fill="#E07B2C"/></g>`)
    .join(''),
  carrotCake: cake('#E07B2C', '#8FAA66', `<g transform="translate(64 28) rotate(30) scale(0.35)"><path d="M40,32 C46,26 56,26 60,32 L52,92 C51,96 49,96 48,92 Z" fill="#E07B2C"/></g>`),
  strawberry: `<path d="M50,30 C72,22 88,36 84,56 C80,76 62,90 50,92 C38,90 20,76 16,56 C12,36 28,22 50,30 Z" fill="#D9473F"/><path d="M50,30 L28,18 L42,28 L50,10 L58,28 L72,18 Z" fill="#5E8C3A"/><g fill="#F2D978"><circle cx="36" cy="48" r="3"/><circle cx="62" cy="46" r="3"/><circle cx="50" cy="60" r="3"/><circle cx="34" cy="68" r="3"/><circle cx="66" cy="68" r="3"/><circle cx="50" cy="78" r="3"/></g>`,
  lettuce: `<path d="M50,12 C74,20 88,44 80,66 C74,82 60,90 50,90 C40,90 26,82 20,66 C12,44 26,20 50,12 Z" fill="#7DA44A"/><path d="M50,22 L50,88 M50,42 L66,32 M50,58 L70,48 M50,42 L34,32 M50,58 L30,48" stroke="#C9DB94" stroke-width="4" stroke-linecap="round"/>`,
  melon: `<path d="M8,38 L92,38 A42,42 0 0 1 8,38 Z" fill="#8FAA66"/><path d="M16,38 L84,38 A34,34 0 0 1 16,38 Z" fill="#E0566A"/><g fill="${INK}"><ellipse cx="36" cy="50" rx="2.5" ry="4"/><ellipse cx="50" cy="58" rx="2.5" ry="4"/><ellipse cx="64" cy="50" rx="2.5" ry="4"/></g>`,
  fruitCake: cake('#8FAA66', '#D9617F', `<circle cx="28" cy="46" r="6" fill="#D9473F"/><circle cx="72" cy="46" r="6" fill="#D9473F"/>`),
  candy: `<path d="M30,50 L12,36 L14,64 Z M70,50 L88,36 L86,64 Z" fill="#E2B13F"/><circle cx="50" cy="50" r="22" fill="#D9617F"/><path d="M36,40 C46,48 54,52 64,60" stroke="#F7D2DC" stroke-width="6" stroke-linecap="round"/>`,
  cupcake: `<path d="M24,54 L76,54 L68,92 L32,92 Z" fill="#7FA7C4"/><path d="M38,54 L40,92 M50,54 L50,92 M62,54 L60,92" stroke="#5C86A5" stroke-width="3"/><path d="M18,56 C14,36 30,28 40,30 C42,16 58,16 60,30 C70,28 86,36 82,56 Z" fill="#F2B6C6"/><circle cx="50" cy="18" r="8" fill="#C8433A"/>`,
  iceCream: `<path d="M34,52 L66,52 L50,96 Z" fill="#D9A55E"/><path d="M38,58 L58,80 M62,58 L44,80" stroke="#B07A3F" stroke-width="3"/><circle cx="38" cy="44" r="15" fill="#D9617F"/><circle cx="62" cy="44" r="15" fill="#7FA7C4"/><circle cx="50" cy="26" r="15" fill="#E2B13F"/>`,
  rainbowCake:
    `<rect x="10" y="38" width="80" height="54" rx="7" fill="#EDE0C4"/>` +
    ['#D9617F', '#E2B13F', '#8FAA66', '#7FA7C4'].map((c, i) => `<rect x="10" y="${48 + i * 11}" width="80" height="8" fill="${c}"/>`).join('') +
    `<path d="M10,38 L90,38 L90,46 C80,52 70,42 60,48 C50,54 40,42 30,48 C20,54 14,44 10,46 Z" fill="#F2B6C6"/><rect x="46" y="14" width="8" height="24" fill="#A487C9"/><path d="M50,0 C56,8 56,12 50,14 C44,12 44,8 50,0 Z" fill="#E2B13F"/>`,
  // ---- accessories
  collar: `<path d="M8,30 Q50,66 92,30" fill="none" stroke="#C8433A" stroke-width="13" stroke-linecap="round"/><circle cx="50" cy="62" r="11" fill="#E2B13F"/><circle cx="50" cy="51" r="3" fill="#A97E1E"/>`,
  bow: (c: string, knot: string) => `<path d="M50,50 L18,30 C12,40 12,60 18,70 Z M50,50 L82,30 C88,40 88,60 82,70 Z" fill="${c}"/><circle cx="50" cy="50" r="9" fill="${knot}"/>`,
  bandana: `<path d="M8,26 L92,26 L50,84 Z" fill="#7FA7C4"/><g fill="#FFFFFF"><circle cx="34" cy="36" r="4"/><circle cx="62" cy="38" r="4"/><circle cx="48" cy="54" r="4"/><circle cx="52" cy="70" r="3"/></g>`,
  cap: `<path d="M18,62 C18,30 82,30 82,62 Z" fill="#D9617F"/><path d="M14,60 L96,60 C92,72 70,74 50,70 L14,66 Z" fill="#A8435C"/><circle cx="50" cy="32" r="5" fill="#A8435C"/>`,
  halter: `<path d="M10,46 Q50,58 90,46" fill="none" stroke="#7A4A26" stroke-width="7" stroke-linecap="round"/><path d="M12,46 L6,2 M88,46 L94,2" stroke="#7A4A26" stroke-width="7" stroke-linecap="round"/><circle cx="12" cy="46" r="6" fill="#E2B13F"/><circle cx="88" cy="46" r="6" fill="#E2B13F"/><circle cx="50" cy="56" r="6" fill="#E2B13F"/>`,
  bell: `<path d="M8,20 Q50,46 92,20" fill="none" stroke="#B4513A" stroke-width="9" stroke-linecap="round"/><path d="M34,74 L66,74 L62,68 L62,54 C62,44 57,38 50,38 C43,38 38,44 38,54 L38,68 Z" fill="#E2B13F"/><circle cx="50" cy="80" r="5" fill="#A97E1E"/>`,
  crown: `<path d="M14,74 L18,30 L36,48 L50,22 L64,48 L82,30 L86,74 Z" fill="#E2B13F"/><circle cx="50" cy="60" r="6" fill="#D9617F"/>`,
  beanie: `<path d="M16,70 C14,34 30,20 50,20 C70,20 86,34 84,70 Z" fill="#7FA7C4"/><rect x="12" y="64" width="76" height="16" rx="8" fill="#5C86A5"/><circle cx="50" cy="16" r="11" fill="#F2E6CC"/>`,
  flower: (petal: string, mid: string) => `<path d="M50,52 C48,66 46,78 40,92" fill="none" stroke="#5E8C3A" stroke-width="6" stroke-linecap="round"/><g fill="${petal}"><circle cx="50" cy="26" r="13"/><circle cx="71" cy="41" r="13"/><circle cx="63" cy="64" r="13"/><circle cx="37" cy="64" r="13"/><circle cx="29" cy="41" r="13"/></g><circle cx="50" cy="46" r="12" fill="${mid}"/>`,
  beads: Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / 8);
    return `<circle cx="${50 - Math.cos(a) * 40}" cy="${30 + Math.sin(a) * 40}" r="8" fill="${['#D9617F', '#E2B13F', '#7FA7C4'][i % 3]}"/>`;
  }).join(''),
  star: `<path d="M50,10 L61,37 L90,38 L67,56 L75,85 L50,68 L25,85 L33,56 L10,38 L39,37 Z" fill="#E2B13F"/>`,
  wreath: Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (1.08 + (0.84 * i) / 6);
    const x = 50 + Math.cos(a) * 42;
    const y = 74 + Math.sin(a) * 42;
    return `<circle cx="${x}" cy="${y}" r="9" fill="#8FAA66"/><circle cx="${x}" cy="${y - 3}" r="7" fill="${['#D9617F', '#E2B13F', '#A487C9', '#7FA7C4'][i % 4]}"/>`;
  }).join(''),
  necklace: `<path d="M14,20 C24,56 76,56 86,20" fill="none" stroke="#E2B13F" stroke-width="5"/><path d="M38,50 L44,42 L56,42 L62,50 L50,70 Z" fill="#7FA7C4"/>`,
};
