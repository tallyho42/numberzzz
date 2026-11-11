import { paintedImg, paintedImage } from '../paint/runtime';
import { artUrl } from '../core/critter';
export type ItemKind = 'carrot' | 'apple' | 'horseshoe' | 'bone' | 'ball' | 'sausage';

const INK = '#20150E';

/** Item drawings centred on (0,0), roughly 40 units across: flat shapes, the brush adds the texture. */
const ITEM_BODY: Record<ItemKind, string> = {
  carrot: `<g transform="rotate(-20)">
    <path d="M3,-10 L-1,-19 M5,-9 L9,-18 M7,-7 L15,-12" stroke="#5E8C3A" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M-7,-8 C1,-13 11,-7 9,0 L-9,17 C-12,19 -14,17 -13,14 Z" fill="#E07B2C"/>
    <path d="M-3,-3 L1,-1.5 M-6,4 L-2,5.5" stroke="${INK}" stroke-width="1" stroke-linecap="round"/></g>`,
  apple: `<path d="M0,-8 C-8,-14 -16,-6 -14,4 C-12,14 -4,18 0,15 C4,18 12,14 14,4 C16,-6 8,-14 0,-8 Z" fill="#C8433A"/>
    <path d="M0,-8 L1,-15" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M1,-13 C5,-18 11,-16 11,-14 C8,-11 3,-11 1,-13 Z" fill="#5E8C3A"/>`,
  horseshoe: `<path d="M-10,-13 L-10,0 A10,10 0 0 0 10,0 L10,-13" fill="none" stroke="#7C848C" stroke-width="7.5" stroke-linecap="round"/>
    <circle cx="-10" cy="-5" r="1.1" fill="${INK}"/><circle cx="10" cy="-5" r="1.1" fill="${INK}"/><circle cx="-7" cy="5" r="1.1" fill="${INK}"/><circle cx="7" cy="5" r="1.1" fill="${INK}"/>`,
  bone: `<g transform="rotate(-25)"><path d="M-11,-4 C-14,-10 -21,-9 -20,-3 C-24,-1 -23,6 -18,6 C-15,10 -9,8 -10,3 L10,3 C9,8 15,10 18,6 C23,6 24,-1 20,-3 C21,-9 14,-10 11,-4 Z" fill="#E6CFA4"/></g>`,
  ball: `<circle r="14" fill="#C8433A"/><path d="M-13,-5 C-4,-1 4,-1 13,-5 M-13,5 C-4,9 4,9 13,5" fill="none" stroke="#F2E6CC" stroke-width="3.4"/>`,
  sausage: `<g transform="rotate(-18) scale(1.3)"><path d="M-16,-3 C-16,-8 -12,-9 0,-8 C12,-9 16,-8 16,-3 C16,3 12,6 0,5 C-12,6 -16,3 -16,-3 Z" fill="#B9533C"/>
    <path d="M-16,-2 L-20,-4 M-20,0 L-16,-1 M16,-2 L20,-4 M20,0 L16,-1" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/></g>`,
};

export const ITEM_NAMES: Record<ItemKind, { one: string; few: string; many: string; g: 'm' | 'f' | 'n' }> = {
  carrot: { one: 'mrkev', few: 'mrkve', many: 'mrkví', g: 'f' },
  apple: { one: 'jablíčko', few: 'jablíčka', many: 'jablíček', g: 'n' },
  horseshoe: { one: 'podkova', few: 'podkovy', many: 'podkov', g: 'f' },
  bone: { one: 'kost', few: 'kosti', many: 'kostí', g: 'f' },
  ball: { one: 'míček', few: 'míčky', many: 'míčků', g: 'm' },
  sausage: { one: 'párek', few: 'párky', many: 'párků', g: 'm' },
};

const ITEM_VB: [number, number, number, number] = [-24, -24, 48, 48];

/** One painted item, `size` px square. */
export function itemSvg(kind: ItemKind, size: number, rotate = 0): string {
  return paintedImg(ITEM_BODY[kind], ITEM_VB, size, size, undefined, `style="display:block;transform:rotate(${rotate}deg)"`);
}

/** Item as an image inside a larger SVG (whose units are CSS px). */
export function itemGroup(kind: ItemKind, x: number, y: number, scale: number, rotate = 0): string {
  return paintedImage(ITEM_BODY[kind], ITEM_VB, x, y, 48 * scale, 48 * scale, undefined, `rotate(${rotate} ${x} ${y})`);
}

export const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z';

const icon = (paths: string, size = 40, stroke = '#20150E', sw = 2.2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  speaker: (s = 40) => icon('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>', s),
  undo: (s = 38) => icon('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', s),
  home: (s = 40, c = '#20150E') => icon('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>', s, c),
  eye: (s = 44) => icon('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', s),
  check: (s = 96, c = '#5F7A40') => icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', s, c, 2.6),
  play: (s = 90) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg>`,
  barn: (s = 56) => icon('<path d="M3 10l9-6 9 6"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/><path d="M9 14l6 6M15 14l-6 6"/>', s, '#B4513A'),
  retry: (s = 40) => icon('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>', s),
};

/** The painted medal (ribbons + gold disc), `size` px tall. */
export function medalSvg(size: number) {
  return `<img src="${artUrl('medal')}" width="${Math.round(size * 400 / 480)}" height="${size}" alt="" draggable="false">`;
}

/** Dot pattern for quick recognition: dice faces up to 6, ten-frame above. */
export function dotPattern(n: number, size: number): string {
  const c = size / 2;
  const o = size * 0.3;
  const dice: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  if (n <= 6) {
    const r = size * 0.13;
    return (dice[n] ?? []).map(([x, y]) => `<circle cx="${c + x * o}" cy="${c + y * o}" r="${r}" fill="#E07B2C"/>`).join('');
  }
  const cell = size / 5.6;
  const x0 = c - cell * 2.5;
  const y0 = c - cell;
  let s = `<rect x="${x0}" y="${y0}" width="${cell * 5}" height="${cell * 2}" rx="6" fill="#FFFFFF" stroke="#20150E" stroke-width="3"/>`;
  for (let i = 1; i < 5; i++) s += `<path d="M${x0 + i * cell},${y0} V${y0 + cell * 2}" stroke="#20150E" stroke-width="2"/>`;
  s += `<path d="M${x0},${y0 + cell} H${x0 + cell * 5}" stroke="#20150E" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) s += `<circle cx="${x0 + (i % 5) * cell + cell / 2}" cy="${y0 + Math.floor(i / 5) * cell + cell / 2}" r="${cell * 0.34}" fill="#E07B2C"/>`;
  return s;
}
