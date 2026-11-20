/**
 * The second unicorn: a rounder head, long pointed ears, a pale sky-blue coat,
 * a curly pink-and-violet mane and a pearly pink horn. Flat shapes for the brush plus crisp ink.
 */
import type { Layer } from '../paint/brush';
import { NECK_D } from './horseShapes';

export const UNICORN2_VB: [number, number, number, number] = [120, 160, 1260, 1780];

const COAT = '#DCEAF5';
const SHADE = '#BCD2E6';
const MUZZLE = '#F6D3C6';
const INNER = '#EFA3BC';
const HORN = '#F2B6C6';
const INK = '#20150E';
const TONGUE = '#E07A86';
const CURLS = ['#E86A9A', '#F2A2C0', '#B88AD6', '#8E6CC4'];

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1460 - Number(x)},${y}`);

const HEAD_D =
  'M520,420 C600,330 860,330 940,420 C1000,500 1010,640 990,760 C975,850 960,920 955,1000 C950,1110 870,1190 730,1190 C590,1190 510,1110 505,1000 C500,920 485,850 470,760 C450,640 460,500 520,420 Z';
const EAR_L_D = 'M548,470 C500,370 496,250 524,140 C592,204 636,316 638,430 Z';
const EAR_L_IN = 'M548,330 C536,270 536,220 546,180 C580,220 600,280 602,340 Z';
const HORN_D = 'M694,396 C704,316 718,236 730,168 C742,236 756,316 766,396 C746,408 714,408 694,396 Z';

export const UNICORN2_PIVOT = {
  head: [730, 1000] as const,
  earL: [580, 440] as const,
  earR: [880, 440] as const,
};

/** Curly mane down the neck: overlapping painted curls, alternating colours. */
const neckCurls = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  const x = 930 + t * 150 + (i % 2 ? 30 : -10);
  const y = 470 + t * 1330;
  const r = 92 - t * 22;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${CURLS[i % CURLS.length]}"/>`;
}).join('');

/** Curly forelock between the ears. */
const forelock = [
  [650, 400, 62], [730, 370, 66], [812, 400, 62], [690, 470, 56], [776, 470, 56], [730, 530, 48],
].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${CURLS[(i + 1) % CURLS.length]}"/>`).join('');

export const UNICORN2_PARTS: Record<'body' | 'head' | 'earL' | 'earR', Layer[]> = {
  body: [
    { svg: p(NECK_D, COAT), brush: { angle: 95, dry: 0.36, zone: 40, edge: 5, bristle: 14, grain: 4, tone: 0.18, seed: 201 } },
    { svg: p('M420,1900 C450,1480 500,1180 560,960 L580,960 C540,1200 500,1500 480,1900 Z', SHADE), brush: { angle: 95, dry: 0.6, zone: 40, edge: 6, bristle: 14, grain: 4, tone: 0.2, seed: 202 } },
    { svg: neckCurls, brush: { angle: 60, dry: 0.4, zone: 30, edge: 6, bristle: 16, grain: 4, tone: 0.25, speck: 0.3, speckRange: 40, seed: 203 } },
  ],
  head: [
    { svg: p(HEAD_D, COAT), brush: { angle: 88, dry: 0.36, zone: 36, edge: 5, bristle: 12, grain: 3.5, tone: 0.18, seed: 204 } },
    { svg: p('M520,430 C470,540 470,720 490,820 C500,900 505,980 515,1060 C525,1110 545,1140 570,1160 C540,980 520,700 550,430 Z', SHADE), brush: { angle: 92, dry: 0.5, zone: 30, edge: 6, bristle: 12, grain: 3.5, tone: 0.2, seed: 205 } },
    { svg: `<ellipse cx="730" cy="1070" rx="222" ry="116" fill="${MUZZLE}"/>`, brush: { angle: 88, dry: 0.42, zone: 40, edge: 6, bristle: 8, grain: 3.5, tone: 0.2, seed: 206 } },
    { svg: `<ellipse cx="572" cy="810" rx="50" ry="30" fill="${INNER}"/><ellipse cx="888" cy="810" rx="50" ry="30" fill="${INNER}"/>`, brush: { angle: 10, dry: 0.5, zone: 20, edge: 6, bristle: 8, grain: 3, tone: 0.2, seed: 207 } },
    { svg: forelock, brush: { angle: 40, dry: 0.4, zone: 22, edge: 5, bristle: 12, grain: 3.5, tone: 0.25, seed: 208 } },
    { svg: p(HORN_D, HORN), brush: { angle: 90, dry: 0.3, zone: 18, edge: 3, bristle: 6, grain: 3, tone: 0.3, seed: 209 } },
  ],
  earL: [
    { svg: p(EAR_L_D, COAT), brush: { angle: 70, dry: 0.36, zone: 26, edge: 5, bristle: 10, grain: 3.5, tone: 0.18, seed: 210 } },
    { svg: p(EAR_L_IN, INNER), brush: { angle: 70, dry: 0.45, zone: 26, edge: 6, bristle: 10, grain: 3.5, tone: 0.25, seed: 211 } },
  ],
  earR: [
    { svg: p(mirror(EAR_L_D), COAT), brush: { angle: 110, dry: 0.36, zone: 26, edge: 5, bristle: 10, grain: 3.5, tone: 0.18, seed: 212 } },
    { svg: p(mirror(EAR_L_IN), INNER), brush: { angle: 110, dry: 0.45, zone: 26, edge: 6, bristle: 10, grain: 3.5, tone: 0.25, seed: 213 } },
  ],
};

export function unicorn2FaceSvg(): string {
  const eye = (cx: number) =>
    `<g class="pupil"><ellipse cx="${cx}" cy="650" rx="44" ry="52" fill="${INK}"/><circle cx="${cx + 14}" cy="630" r="13" fill="#FFFFFF"/></g>`;
  const lashes = (x: number, dir: number) =>
    [0, 1].map((i) => `<path d="M${x + dir * (10 + i * 26)},${604 - i * 6} l${dir * (16 + i * 6)},-${24 - i * 4}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`).join('');
  return `<path d="M712,370 L748,344 M712,310 L746,288 M720,252 L740,238" stroke="#C97A93" stroke-width="9" stroke-linecap="round"/>
    <g class="eyes"><g class="pupils">${eye(604)}${eye(856)}</g>
      <path class="joy" d="M560,660 Q604,612 648,660 M812,660 Q856,612 900,660" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/></g>
    <g class="lashes">${lashes(566, -1)}${lashes(894, 1)}</g>
    <g class="brows"><path d="M560,560 C580,546 612,542 636,550" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M824,550 C848,542 880,546 900,560" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/></g>
    <ellipse cx="664" cy="1062" rx="16" ry="22" fill="#C97A93" transform="rotate(-14 664 1062)"/><ellipse cx="796" cy="1062" rx="16" ry="22" fill="#C97A93" transform="rotate(14 796 1062)"/>
    <g class="m-tongue"><path d="M712,1156 C700,1200 712,1238 738,1240 C764,1242 776,1204 766,1158 Z" fill="${TONGUE}"/></g>
    <path class="m-smile" d="M660,1140 C700,1176 762,1176 800,1140" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <g class="m-open"><path d="M658,1132 C662,1190 700,1222 732,1222 C766,1222 798,1190 802,1132 C760,1148 700,1148 658,1132 Z" fill="${INK}"/><path d="M690,1190 C700,1214 764,1214 774,1190 C750,1200 712,1200 690,1190 Z" fill="${TONGUE}"/></g>`;
}
