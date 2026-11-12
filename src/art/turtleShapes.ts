/**
 * The turtle, a sibling of the dog: sitting up and facing us in the same 1260×1780 frame.
 * Shell behind, the belly plate (`front`) in front of the head so it can hide inside,
 * flat shapes for the brush plus crisp ink details.
 */
import type { Layer } from '../paint/brush';

export const TURTLE_VB: [number, number, number, number] = [120, 160, 1260, 1780];

const SHELL = '#6E8A45';
const SCUTE = '#4E682F';
const SKIN = '#A9BE70';
const SKIN_DARK = '#8DA45A'; // spots on the head
const PLATE = '#E9CF86';
const PLATE_LINE = '#B98F45';
const INK = '#20150E';
const TONGUE = '#E07A86';

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${1460 - Number(x)},${y}`);

// Shell: an oval with a scalloped rim.
const SHELL_C = [730, 1360, 410, 520];
const scallops = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2;
  return `<circle cx="${SHELL_C[0] + Math.cos(a) * SHELL_C[2]}" cy="${SHELL_C[1] + Math.sin(a) * SHELL_C[3]}" r="74"/>`;
}).join('');

const ARM_L = 'M570,1130 C480,1140 370,1230 316,1360 C290,1430 340,1480 396,1452 C460,1400 530,1330 600,1250 Z';
const FOOT_L = 'M640,1720 C560,1712 480,1752 466,1820 C458,1866 500,1890 560,1890 L660,1890 C690,1850 690,1760 640,1720 Z';
const TAIL_D = 'M1040,1752 C1100,1756 1170,1780 1214,1818 C1170,1838 1100,1840 1040,1830 Z';
export const PLATE_D =
  'M512,1050 C600,1018 860,1018 948,1050 C1000,1200 1010,1420 970,1620 C940,1760 846,1846 730,1856 C614,1846 520,1760 490,1620 C450,1420 460,1200 512,1050 Z';
const HEAD_D = 'M730,500 C870,500 966,590 966,716 C966,850 866,936 730,936 C594,936 494,850 494,716 C494,590 590,500 730,500 Z';
const NECK_D = 'M640,860 C630,960 620,1060 614,1170 L846,1170 C840,1060 830,960 820,860 Z';

export const TURTLE_PIVOT = {
  head: [730, 1120] as const,
  tail: [1050, 1790] as const,
};

export const TURTLE_PARTS: Record<'tail' | 'body' | 'head' | 'front', Layer[]> = {
  tail: [{ svg: p(TAIL_D, SKIN), brush: { angle: 10, dry: 0.36, zone: 14, edge: 3, bristle: 10, grain: 3, tone: 0.3, seed: 121 } }],
  body: [
    { svg: `<g fill="${SHELL}"><ellipse cx="${SHELL_C[0]}" cy="${SHELL_C[1]}" rx="${SHELL_C[2]}" ry="${SHELL_C[3]}"/>${scallops}</g>`, brush: { angle: 70, dry: 0.36, zone: 44, edge: 6, bristle: 16, grain: 4, tone: 0.32, speck: 0.3, speckRange: 50, seed: 122 } },
    // lighter plates of the shell peeking out at the sides
    {
      svg: `<g fill="${SCUTE}"><path d="M372,1100 L452,1040 L520,1100 L520,1260 L440,1300 L372,1250 Z"/><path d="M360,1330 L440,1300 L500,1360 L500,1520 L420,1560 L362,1500 Z"/><path d="M400,1600 L470,1570 L530,1640 L520,1760 L450,1780 Z"/>
        <path d="${mirror('M372,1100 L452,1040 L520,1100 L520,1260 L440,1300 L372,1250 Z')}"/><path d="${mirror('M360,1330 L440,1300 L500,1360 L500,1520 L420,1560 L362,1500 Z')}"/><path d="${mirror('M400,1600 L470,1570 L530,1640 L520,1760 L450,1780 Z')}"/>
        <path d="M560,900 L660,860 L730,900 L800,860 L900,900 L940,1000 L520,1000 Z"/></g>`,
      brush: { angle: 60, dry: 0.45, zone: 30, edge: 6, bristle: 10, grain: 3.5, tone: 0.3, seed: 123 },
    },
    { svg: p(ARM_L, SKIN) + p(mirror(ARM_L), SKIN), brush: { angle: 120, dry: 0.36, zone: 24, edge: 4, bristle: 10, grain: 3.5, tone: 0.3, seed: 124 } },
    // the dark opening the head hides in
    { svg: `<ellipse cx="730" cy="1040" rx="190" ry="80" fill="#3A4C24"/>`, brush: { angle: 0, dry: 0.3, zone: 20, edge: 4, bristle: 10, grain: 3, tone: 0.2, seed: 125 } },
    // ground strokes
    { svg: `<rect x="380" y="1878" width="330" height="16" fill="${INK}"/><rect x="760" y="1882" width="420" height="14" fill="${INK}"/>`, brush: { angle: 0, dry: 0.6, zone: 8, edge: 3, bristle: 60, grain: 2.5, tone: 0.2, speck: 0.5, seed: 126 } },
  ],
  head: [
    { svg: p(NECK_D, SKIN) + p(HEAD_D, SKIN), brush: { angle: 85, dry: 0.36, zone: 36, edge: 5, bristle: 12, grain: 3.5, tone: 0.32, seed: 131 } },
    { svg: `<g fill="${SKIN_DARK}"><ellipse cx="700" cy="560" rx="34" ry="22"/><ellipse cx="780" cy="548" rx="26" ry="18"/><ellipse cx="836" cy="588" rx="20" ry="14"/><ellipse cx="626" cy="590" rx="18" ry="13"/></g>`, brush: { angle: 30, dry: 0.4, zone: 14, edge: 3, bristle: 6, grain: 3, tone: 0.3, seed: 132 } },
    { svg: `<ellipse cx="636" cy="690" rx="66" ry="72" fill="#FFFFFF"/><ellipse cx="824" cy="690" rx="66" ry="72" fill="#FFFFFF"/>`, brush: { angle: 75, dry: 0.42, zone: 30, edge: 7, bristle: 6, grain: 3, tone: 0.06, seed: 133 } },
    { svg: `<ellipse cx="572" cy="812" rx="42" ry="26" fill="#E58C98"/><ellipse cx="888" cy="812" rx="42" ry="26" fill="#E58C98"/>`, brush: { angle: 10, dry: 0.5, zone: 20, edge: 6, bristle: 8, grain: 3, tone: 0.2, seed: 134 } },
  ],
  front: [
    { svg: p(PLATE_D, PLATE), brush: { angle: 92, dry: 0.34, zone: 40, edge: 5, bristle: 12, grain: 4, tone: 0.3, seed: 141 } },
    {
      svg: `<g fill="none" stroke="${PLATE_LINE}" stroke-width="16" stroke-linecap="round"><path d="M500,1250 C640,1280 820,1280 960,1250"/><path d="M482,1450 C640,1484 820,1484 978,1450"/><path d="M530,1660 C650,1690 810,1690 930,1660"/><path d="M730,1060 L730,1840"/></g>`,
      brush: { angle: 0, dry: 0.5, zone: 10, edge: 3, bristle: 20, grain: 3, tone: 0.3, seed: 142 },
    },
    { svg: p(FOOT_L, SKIN) + p(mirror(FOOT_L), SKIN), brush: { angle: 20, dry: 0.36, zone: 24, edge: 4, bristle: 10, grain: 3.5, tone: 0.3, seed: 143 } },
  ],
};

/** Ink over the belly plate: toes. */
export function turtleFrontInk(): string {
  const toes = (x: number) => [0, 1, 2].map((i) => `<path d="M${x + i * 36},1872 L${x + i * 36},1890" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`).join('');
  return toes(516) + toes(872);
}

export function turtleFaceSvg(): string {
  return `<g class="eyes"><g class="pupils"><ellipse class="pupil" cx="648" cy="704" rx="30" ry="34" fill="${INK}"/><ellipse class="pupil" cx="812" cy="704" rx="30" ry="34" fill="${INK}"/></g>
      <path class="joy" d="M604,712 Q640,666 676,712 M784,712 Q820,666 856,712" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/></g>
    <g class="brows"><path d="M590,598 C610,580 646,576 670,586" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M790,586 C814,576 850,580 870,598" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/></g>
    <ellipse cx="708" cy="792" rx="9" ry="7" fill="${INK}"/><ellipse cx="752" cy="792" rx="9" ry="7" fill="${INK}"/>
    <g class="m-tongue"><path d="M708,858 C702,898 712,922 730,923 C748,922 758,898 752,858 Z" fill="${TONGUE}"/></g>
    <path class="m-smile" d="M644,836 C690,880 770,880 816,836" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <g class="m-open"><path d="M652,834 C660,896 700,918 730,918 C760,918 800,896 808,834 C770,852 690,852 652,834 Z" fill="${INK}"/><path d="M682,890 C696,912 764,912 778,890 C752,900 708,900 682,890 Z" fill="${TONGUE}"/></g>`;
}
