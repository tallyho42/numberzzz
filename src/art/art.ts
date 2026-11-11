import horseHeadRaw from './kun-hlava.svg?raw';
import horseEarlessRaw from './kun-bez-usi.svg?raw';
import horseFullRaw from './kun-cely.svg?raw';

const toUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const HORSE_HEAD = toUrl(horseHeadRaw);
export const HORSE_EARLESS = toUrl(horseEarlessRaw);
export const HORSE_FULL = toUrl(horseFullRaw);

export type ItemKind = 'carrot' | 'apple' | 'horseshoe';

/** Item drawings centred on (0,0), roughly 40 units across. */
const ITEM_BODY: Record<ItemKind, string> = {
  carrot: `<g transform="rotate(-20)">
    <path d="M-6,-8 C2,-12 10,-6 8,0 L-10,16 C-12,17 -13,16 -12,14 Z" fill="#F28C28" stroke="#B85C12" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M-3,-4 L1,-2 M-6,3 L-2,5" stroke="#B85C12" stroke-width="1" stroke-linecap="round"/>
    <path d="M2,-10 L0,-18 M4,-9 L8,-17 M6,-7 L14,-12" stroke="#3DAA5C" stroke-width="2.4" stroke-linecap="round"/></g>`,
  apple: `<path d="M0,-8 C-8,-14 -16,-6 -14,4 C-12,14 -4,18 0,15 C4,18 12,14 14,4 C16,-6 8,-14 0,-8 Z" fill="#E8574B" stroke="#A8352B" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M0,-8 L1,-15" stroke="#6B4226" stroke-width="2" stroke-linecap="round"/>
    <path d="M1,-13 C5,-17 10,-15 10,-14 C7,-11 3,-11 1,-13 Z" fill="#3DAA5C"/>
    <ellipse cx="-6" cy="-2" rx="2.5" ry="4" fill="#FFFFFF" opacity="0.35"/>`,
  horseshoe: `<path d="M-10,-12 L-10,0 A10,10 0 0 0 10,0 L10,-12" fill="none" stroke="#7E848C" stroke-width="7" stroke-linecap="round"/>
    <path d="M-10,-12 L-10,0 A10,10 0 0 0 10,0 L10,-12" fill="none" stroke="#A9AFB7" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="-10" cy="-4" r="1.2" fill="#55595F"/><circle cx="10" cy="-4" r="1.2" fill="#55595F"/>`,
};

export const ITEM_NAMES: Record<ItemKind, { one: string; few: string; many: string }> = {
  carrot: { one: 'mrkev', few: 'mrkve', many: 'mrkví' },
  apple: { one: 'jablíčko', few: 'jablíčka', many: 'jablíček' },
  horseshoe: { one: 'podkova', few: 'podkovy', many: 'podkov' },
};

/** Standalone SVG of one item, `size` px square. */
export function itemSvg(kind: ItemKind, size: number, rotate = 0): string {
  return `<svg width="${size}" height="${size}" viewBox="-22 -22 44 44" aria-hidden="true"><g transform="rotate(${rotate})">${ITEM_BODY[kind]}</g></svg>`;
}

/** Item as an SVG group placed inside a larger SVG. */
export function itemGroup(kind: ItemKind, x: number, y: number, scale: number, rotate = 0): string {
  return `<g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">${ITEM_BODY[kind]}</g>`;
}

export const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z';

const icon = (paths: string, size = 40, stroke = '#2E6B3A', sw = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  speaker: (s = 40) => icon('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>', s),
  undo: (s = 38) => icon('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>', s),
  home: (s = 40, c = '#2E6B3A') => icon('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>', s, c),
  eye: (s = 44) => icon('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', s),
  check: (s = 96, c = '#3DAA5C') => icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>', s, c, 2.6),
  play: (s = 90) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/></svg>`,
  barn: (s = 56) => icon('<path d="M3 10l9-6 9 6"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/><path d="M9 14l6 6M15 14l-6 6"/>', s, '#A8382F'),
  retry: (s = 40) => icon('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>', s),
};

export function medalSvg(size: number) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h3l1 6-3 1z" fill="#4A8FE0"/><path d="M16 2h-3l-1 6 3 1z" fill="#E2558C"/><circle cx="12" cy="15" r="7" fill="#FFCC33" stroke="#E0A800" stroke-width="1.5"/></svg>`;
}

/** Collectible items for the horse's stable (unlocked one per medal). */
export const STABLE_ITEMS: { name: string; d: string; fill: string; stroke: string }[] = [
  { name: 'mašli', d: 'M12 12 L4 7 L4 17 Z M12 12 L20 7 L20 17 Z', fill: '#E2558C', stroke: '#A8335F' },
  { name: 'hvězdičku', d: STAR_PATH, fill: '#FFCC33', stroke: '#E0A800' },
  { name: 'zvoneček', d: 'M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4z M10.5 19a1.5 1.5 0 0 0 3 0z', fill: '#FFCC33', stroke: '#B88A00' },
  { name: 'jablíčko', d: 'M12 7c-3-2-7 0-7 5s3 9 7 8c4 1 7-3 7-8s-4-7-7-5z M12 7l1-3', fill: '#E8574B', stroke: '#A8352B' },
  { name: 'zlatou podkovu', d: 'M6 4h3v9a3 3 0 0 0 6 0V4h3v9a6 6 0 0 1-12 0z', fill: '#FFCC33', stroke: '#B88A00' },
  { name: 'srdíčko', d: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z', fill: '#E2558C', stroke: '#A8335F' },
  { name: 'korunku', d: 'M4 17l1-9 4 4 3-6 3 6 4-4 1 9z', fill: '#FFCC33', stroke: '#B88A00' },
  { name: 'sedlo', d: 'M4 12c3 0 4-4 8-4s5 4 8 4v3H4z', fill: '#8A5A35', stroke: '#5A3A20' },
  { name: 'mrkev', d: 'M15 5l4 4-11 11-3-3z', fill: '#F28C28', stroke: '#B85C12' },
];

export const BARN_SVG = (doorOpen: boolean, question: boolean) => `
  <polygon points="336,190 404,128 472,190" fill="#A8382F" stroke="#6E2019" stroke-width="5" stroke-linejoin="round"/>
  <rect x="350" y="188" width="110" height="160" fill="#D9534F" stroke="#6E2019" stroke-width="5"/>
  ${doorOpen
    ? `<rect x="374" y="250" width="62" height="98" fill="#5A1E18" stroke="#6E2019" stroke-width="5"/><rect x="436" y="250" width="22" height="98" fill="#F4E3C3" stroke="#6E2019" stroke-width="4"/>`
    : `<rect x="374" y="250" width="62" height="98" fill="#F4E3C3" stroke="#6E2019" stroke-width="5"/><path d="M374,250 L436,348 M436,250 L374,348" stroke="#C9A877" stroke-width="5"/>`}
  ${question ? `<circle cx="405" cy="299" r="26" fill="#FFFFFF" stroke="#6E2019" stroke-width="4"/><text x="405" y="301" text-anchor="middle" dominant-baseline="central" font-family="Andika, system-ui, sans-serif" font-weight="700" font-size="40" fill="#A8382F">?</text>` : ''}`;
