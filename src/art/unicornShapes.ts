/**
 * The unicorn: the horse's front-view bust in a pale lilac coat, a rainbow mane and a golden horn.
 * Flat shapes for the brush plus crisp ink details.
 */
import type { Layer } from '../paint/brush';
import { NECK_D, HEAD_D, EAR_L_D, EAR_R_D } from './horseShapes';

export const UNICORN_VB: [number, number, number, number] = [120, 160, 1260, 1780];

const COAT = '#EFE5F2';
const SHADE = '#D8C8E4';
const MUZZLE = '#F2C3CE';
const INNER = '#E59AAE';
const HORN = '#E2B13F';
const INK = '#20150E';
const TONGUE = '#E07A86';
const RAINBOW = ['#D9617F', '#E89A4A', '#E2B13F', '#8FAA66', '#7FA7C4', '#A487C9'];

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

export const UNICORN_PIVOT = {
  head: [730, 1000] as const,
  earL: [560, 430] as const,
  earR: [900, 430] as const,
};

const HORN_D = 'M688,392 C700,310 716,230 730,172 C744,230 760,310 772,392 C750,404 710,404 688,392 Z';

/** Mane strands down the neck: one curl per rainbow colour. */
const neckMane = RAINBOW.map((c, i) => {
  const x = 880 + i * 30;
  const y = 440 + i * 36;
  return p(`M${x},${y} C${x + 110},${y + 300} ${x + 150},${y + 800} ${x + 170},${y + 1250} C${x + 172},${y + 1310} ${x + 120},${y + 1320} ${x + 112},${y + 1270} C${x + 90},${y + 820} ${x + 40},${y + 380} ${x - 40},${y + 80} Z`, c);
}).reverse();

/** Forelock: rainbow strands falling between the ears. */
const forelock = RAINBOW.slice(0, 5)
  .map((c, i) => {
    const x = 620 + i * 52;
    const tilt = (i - 2) * 22;
    return p(`M${x},330 C${x + 30},310 ${x + 70},310 ${x + 80},336 C${x + 84 + tilt},420 ${x + 60 + tilt},500 ${x + 30 + tilt},560 C${x + 6 + tilt},500 ${x - 6},420 ${x},330 Z`, c);
  })
  .join('');

export const UNICORN_PARTS: Record<'body' | 'head' | 'earL' | 'earR', Layer[]> = {
  body: [
    { svg: p(NECK_D, COAT), brush: { angle: 95, dry: 0.36, zone: 40, edge: 5, bristle: 14, grain: 4, tone: 0.16, seed: 151 } },
    { svg: p('M420,1900 C450,1480 500,1180 560,960 L580,960 C540,1200 500,1500 480,1900 Z', SHADE), brush: { angle: 95, dry: 0.6, zone: 40, edge: 6, bristle: 14, grain: 4, tone: 0.2, seed: 152 } },
    { svg: neckMane.join(''), brush: { angle: 75, dry: 0.42, zone: 30, edge: 6, bristle: 24, grain: 4, tone: 0.25, speck: 0.3, speckRange: 40, seed: 153 } },
  ],
  head: [
    { svg: p(HEAD_D, COAT), brush: { angle: 90, dry: 0.36, zone: 36, edge: 5, bristle: 12, grain: 3.5, tone: 0.16, seed: 154 } },
    { svg: p('M500,430 C460,540 470,720 506,850 C526,930 498,1020 508,1092 C514,1130 540,1160 570,1180 C540,1000 530,700 560,420 Z', SHADE), brush: { angle: 92, dry: 0.5, zone: 30, edge: 6, bristle: 12, grain: 3.5, tone: 0.2, seed: 155 } },
    { svg: `<ellipse cx="730" cy="1090" rx="214" ry="122" fill="${MUZZLE}"/>`, brush: { angle: 88, dry: 0.42, zone: 40, edge: 6, bristle: 8, grain: 3.5, tone: 0.2, seed: 156 } },
    { svg: `<ellipse cx="586" cy="790" rx="48" ry="30" fill="${INNER}"/><ellipse cx="874" cy="790" rx="48" ry="30" fill="${INNER}"/>`, brush: { angle: 10, dry: 0.5, zone: 20, edge: 6, bristle: 8, grain: 3, tone: 0.2, seed: 157 } },
    { svg: forelock, brush: { angle: 95, dry: 0.42, zone: 26, edge: 6, bristle: 18, grain: 4, tone: 0.25, seed: 158 } },
    { svg: p(HORN_D, HORN), brush: { angle: 90, dry: 0.3, zone: 18, edge: 3, bristle: 6, grain: 3, tone: 0.3, seed: 159 } },
  ],
  earL: [
    { svg: p(EAR_L_D, COAT), brush: { angle: 70, dry: 0.36, zone: 26, edge: 5, bristle: 10, grain: 3.5, tone: 0.16, seed: 160 } },
    { svg: p('M520,320 C512,270 512,220 522,190 C556,226 580,280 584,330 Z', INNER), brush: { angle: 70, dry: 0.45, zone: 30, edge: 6, bristle: 10, grain: 3.5, tone: 0.25, seed: 161 } },
  ],
  earR: [
    { svg: p(EAR_R_D, COAT), brush: { angle: 110, dry: 0.36, zone: 26, edge: 5, bristle: 10, grain: 3.5, tone: 0.16, seed: 162 } },
    { svg: p('M940,320 C948,270 948,220 938,190 C904,226 880,280 876,330 Z', INNER), brush: { angle: 110, dry: 0.45, zone: 30, edge: 6, bristle: 10, grain: 3.5, tone: 0.25, seed: 163 } },
  ],
};

export function unicornFaceSvg(): string {
  const lashes = (x: number, dir: number) =>
    [0, 1, 2].map((i) => `<path d="M${x + dir * (8 + i * 22)},${598 - i * 4} l${dir * (14 + i * 6)},-${26 - i * 4}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`).join('');
  return `<path d="M716,360 L746,330 M710,300 L744,274 M720,240 L740,224" stroke="#A97E1E" stroke-width="9" stroke-linecap="round"/>
    <g class="eyes"><g class="pupils"><ellipse class="pupil" cx="596" cy="636" rx="34" ry="40" fill="${INK}"/><ellipse class="pupil" cx="864" cy="636" rx="34" ry="40" fill="${INK}"/></g>
      <path class="joy" d="M560,644 Q596,600 632,644 M828,644 Q864,600 900,644" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/></g>
    <g class="lashes">${lashes(576, -1)}${lashes(884, 1)}</g>
    <g class="brows"><path d="M552,540 C572,524 604,520 626,528" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M834,528 C856,520 888,524 908,540" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/></g>
    <ellipse cx="660" cy="1070" rx="18" ry="26" fill="#A8435C" transform="rotate(-14 660 1070)"/><ellipse cx="800" cy="1070" rx="18" ry="26" fill="#A8435C" transform="rotate(14 800 1070)"/>
    <g class="m-tongue"><path d="M712,1164 C700,1210 712,1250 738,1252 C764,1254 776,1214 766,1166 Z" fill="${TONGUE}"/></g>
    <path class="m-smile" d="M664,1150 C700,1182 764,1182 798,1150" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <g class="m-open"><path d="M660,1140 C664,1200 700,1232 732,1232 C766,1232 800,1200 802,1140 C760,1156 700,1156 660,1140 Z" fill="${INK}"/><path d="M690,1200 C700,1226 766,1226 776,1200 C752,1210 712,1210 690,1200 Z" fill="${TONGUE}"/></g>`;
}
