/**
 * The horse, drawn as a sibling of the dog: front view bust in the same 1260×1780 frame,
 * flat shapes for the brush plus crisp ink details.
 */
import type { Layer } from '../paint/brush';

export const HORSE_VB: [number, number, number, number] = [120, 160, 1260, 1780];

const COAT = '#9E5A33';
const MUZZLE = '#B7784C';
const INK = '#20150E';
const TONGUE = '#E07A86';

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

export const NECK_D = 'M560,960 L900,960 C960,1180 1010,1480 1050,1900 L420,1900 C450,1480 500,1180 560,960 Z';
export const HEAD_D =
  'M500,430 C560,330 900,330 960,430 C1012,530 994,700 954,850 C934,930 962,1020 952,1092 C942,1172 862,1214 730,1214 C598,1214 518,1172 508,1092 C498,1020 526,930 506,850 C466,700 448,530 500,430 Z';
export const EAR_L_D = 'M530,470 C480,370 468,260 496,170 C566,214 616,316 616,410 Z';
export const EAR_R_D = 'M930,470 C980,370 992,260 964,170 C894,214 844,316 844,410 Z';

export const HORSE_PIVOT = {
  head: [730, 1000] as const,
  earL: [560, 430] as const,
  earR: [900, 430] as const,
};

export const HORSE_PARTS: Record<'body' | 'head' | 'earL' | 'earR', Layer[]> = {
  body: [
    { svg: p(NECK_D, COAT), brush: { angle: 95, dry: 0.42, zone: 40, edge: 5, bristle: 14, grain: 4, tone: 0.3, seed: 31 } },
    // mane down the neck
    { svg: p('M842,940 C930,1100 1000,1380 1040,1700 C1050,1760 1000,1770 990,1720 C950,1440 900,1200 820,1000 Z', INK), brush: { angle: 80, dry: 0.5, zone: 60, edge: 10, bristle: 30, grain: 5, tone: 0.3, speck: 0.5, speckRange: 60, seed: 32 } },
    // chest blaze of light brush
    { svg: p('M640,1500 C680,1440 800,1440 840,1500 C860,1600 850,1760 830,1900 L650,1900 C630,1760 620,1600 640,1500 Z', MUZZLE), brush: { angle: 92, dry: 0.5, zone: 50, edge: 6, bristle: 10, grain: 4, tone: 0.3, seed: 33 } },
  ],
  head: [
    { svg: p(HEAD_D, COAT), brush: { angle: 90, dry: 0.4, zone: 36, edge: 5, bristle: 12, grain: 3.5, tone: 0.3, seed: 34 } },
    { svg: `<ellipse cx="730" cy="1090" rx="214" ry="122" fill="${MUZZLE}"/>`, brush: { angle: 88, dry: 0.45, zone: 40, edge: 6, bristle: 8, grain: 3.5, tone: 0.3, seed: 35 } },
    { svg: p('M702,700 C692,800 694,880 704,960 L756,960 C766,880 768,800 758,700 C746,680 714,680 702,700 Z', '#FFFFFF'), brush: { angle: 92, dry: 0.5, zone: 30, edge: 5, bristle: 12, grain: 3, tone: 0.05, seed: 36 } },
    { svg: `<ellipse cx="584" cy="612" rx="86" ry="90" fill="#FFFFFF"/><ellipse cx="876" cy="612" rx="86" ry="90" fill="#FFFFFF"/>`, brush: { angle: 75, dry: 0.42, zone: 40, edge: 8, bristle: 8, grain: 3, tone: 0.06, seed: 37 } },
    // forelock
    { svg: p('M622,340 C680,290 790,290 840,342 C830,430 790,500 744,536 C700,500 640,440 622,340 Z', INK), brush: { angle: 100, dry: 0.5, zone: 60, edge: 10, bristle: 26, grain: 5, tone: 0.3, speck: 0.5, speckRange: 50, seed: 38 } },
  ],
  earL: [
    { svg: p(EAR_L_D, COAT), brush: { angle: 70, dry: 0.4, zone: 26, edge: 5, bristle: 10, grain: 3.5, tone: 0.3, seed: 39 } },
    { svg: p('M520,320 C512,270 512,220 522,190 C556,226 580,280 584,330 Z', INK), brush: { angle: 70, dry: 0.55, zone: 30, edge: 6, bristle: 14, grain: 3.5, tone: 0.3, seed: 40 } },
  ],
  earR: [
    { svg: p(EAR_R_D, COAT), brush: { angle: 110, dry: 0.4, zone: 26, edge: 5, bristle: 10, grain: 3.5, tone: 0.3, seed: 41 } },
    { svg: p('M940,320 C948,270 948,220 938,190 C904,226 880,280 876,330 Z', INK), brush: { angle: 110, dry: 0.55, zone: 30, edge: 6, bristle: 14, grain: 3.5, tone: 0.3, seed: 42 } },
  ],
};

export function horseFaceSvg(): string {
  return `<g class="eyes"><g class="pupils"><ellipse class="pupil" cx="596" cy="630" rx="30" ry="34" fill="${INK}"/><ellipse class="pupil" cx="864" cy="630" rx="30" ry="34" fill="${INK}"/></g>
      <path class="joy" d="M562,640 Q596,598 630,640 M830,640 Q864,598 898,640" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/></g>
    <g class="brows"><path d="M546,516 C566,496 600,492 622,502" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M838,502 C860,492 894,496 914,516" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>
    <ellipse cx="652" cy="1070" rx="26" ry="36" fill="${INK}" transform="rotate(-14 652 1070)"/><ellipse cx="808" cy="1070" rx="26" ry="36" fill="${INK}" transform="rotate(14 808 1070)"/>
    <g class="m-tongue"><path d="M712,1164 C700,1210 712,1250 738,1252 C764,1254 776,1214 766,1166 Z" fill="${TONGUE}"/></g>
    <path class="m-smile" d="M664,1150 C700,1182 764,1182 798,1150" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <g class="m-open"><path d="M660,1140 C664,1200 700,1232 732,1232 C766,1232 800,1200 802,1140 C760,1156 700,1156 660,1140 Z" fill="${INK}"/><path d="M690,1200 C700,1226 766,1226 776,1200 C752,1210 712,1210 690,1200 Z" fill="${TONGUE}"/></g>`;
}
