/**
 * The dog, in the coordinates of the reference painting (1423×2000 px).
 * Painted parts (body, tail, head, ears) are baked into PNGs by the atelier;
 * the crisp ink details (eyes, brows, nose, mouth, freckles, leg lines) stay SVG so they can move.
 */
import type { Layer } from '../paint/brush';

export const DOG_VB: [number, number, number, number] = [120, 160, 1260, 1780];

export const BROWN = '#A8713B';
export const BROWN_DARK = '#8E5B2A';
export const INK = '#20150E';

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

export const HEAD_D =
  'M478,298 C600,282 800,278 905,298 C975,312 1003,360 1005,432 C1010,560 1002,700 992,820 C984,900 952,952 902,988 C842,1024 642,1026 572,992 C502,958 462,902 452,802 C442,682 440,522 446,402 C450,336 458,302 478,298 Z';
export const EAR_L_D =
  'M512,300 C478,282 432,302 402,344 C334,436 234,556 194,648 C172,700 200,782 252,800 C302,816 334,790 354,758 C414,676 474,576 506,466 C522,406 530,330 512,300 Z';
export const EAR_R_D =
  'M880,222 C950,186 1062,214 1134,276 C1226,356 1304,498 1334,618 C1350,690 1324,752 1272,762 C1222,770 1190,742 1170,702 C1110,602 1040,504 990,424 C952,364 846,250 880,222 Z';
export const BODY_D =
  'M604,840 L888,840 C918,960 940,1100 956,1280 C974,1450 1000,1650 1018,1808 C1024,1862 1006,1890 958,1892 L522,1888 C472,1884 446,1854 452,1800 C470,1650 498,1450 518,1280 C534,1120 560,980 604,840 Z';
export const TAIL_D =
  'M980,1726 C1030,1690 1066,1632 1080,1536 C1090,1446 1088,1356 1102,1256 C1108,1218 1128,1196 1146,1208 C1164,1232 1160,1300 1156,1360 C1150,1462 1156,1566 1132,1660 C1110,1736 1060,1784 1000,1806 Z';

export const PIVOT = {
  head: [728, 960] as const,
  earL: [470, 330] as const,
  earR: [930, 260] as const,
  tail: [1000, 1760] as const,
};

/** Painted layers of each moving part. */
export const DOG_PARTS: Record<'body' | 'tail' | 'head' | 'earL' | 'earR', Layer[]> = {
  tail: [
    { svg: p(TAIL_D, BROWN), brush: { angle: 80, dry: 0.35, zone: 12, edge: 3, grain: 3, tone: 0.4, seed: 21 } },
    { svg: `<g clip-path="url(#t)"><clipPath id="t"><path d="${TAIL_D}"/></clipPath><rect x="1090" y="1180" width="80" height="150" fill="${INK}"/><rect x="960" y="1700" width="120" height="120" fill="${INK}"/></g>`, brush: { angle: 80, dry: 0.6, zone: 40, edge: 4, bristle: 30, grain: 3, tone: 0.3, speck: 0.3, seed: 22 } },
  ],
  body: [
    { svg: p(BODY_D, BROWN), brush: { angle: 95, dry: 0.36, zone: 40, edge: 5, bristle: 14, grain: 4, tone: 0.34, seed: 1 } },
    // dark shoulder streak
    { svg: p('M606,972 C574,1040 548,1120 532,1222 C530,1254 548,1262 562,1240 C594,1180 622,1110 642,1040 C652,1000 632,968 606,972 Z', INK), brush: { angle: 108, dry: 0.62, zone: 40, edge: 5, bristle: 40, grain: 4, tone: 0.3, speck: 0.4, seed: 2 } },
    // hind left foot
    { svg: p('M540,1668 C470,1660 390,1690 342,1736 C306,1780 304,1852 332,1888 L552,1890 C556,1820 556,1730 540,1668 Z', BROWN_DARK), brush: { angle: 60, dry: 0.3, zone: 20, edge: 3, grain: 4, tone: 0.4, seed: 3 } },
    { svg: p('M372,1712 C318,1756 300,1840 334,1888 L520,1890 C500,1820 460,1750 372,1712 Z', INK), brush: { angle: 40, dry: 0.6, zone: 40, edge: 5, bristle: 45, grain: 4, tone: 0.3, speck: 0.6, speckRange: 60, seed: 4 } },
    // hind right foot
    { svg: p('M958,1700 C1040,1712 1102,1782 1126,1850 C1132,1882 1102,1892 1050,1892 L958,1892 Z', INK), brush: { angle: 20, dry: 0.62, zone: 50, edge: 5, bristle: 50, grain: 4, tone: 0.35, speck: 0.6, speckRange: 70, seed: 5 } },
    // front paws
    { svg: p('M560,1640 L664,1632 C670,1720 668,1820 662,1890 L548,1894 C550,1820 554,1720 560,1640 Z', INK), brush: { angle: 92, dry: 0.58, zone: 60, edge: 4, bristle: 34, grain: 3.5, tone: 0.3, speck: 0.4, seed: 6 } },
    { svg: p('M782,1648 L896,1640 C900,1720 902,1820 900,1890 L786,1894 C782,1820 780,1720 782,1648 Z', INK), brush: { angle: 88, dry: 0.58, zone: 60, edge: 4, bristle: 34, grain: 3.5, tone: 0.3, speck: 0.4, seed: 7 } },
    // ground strokes
    { svg: `<rect x="330" y="1878" width="320" height="16" fill="${INK}"/><rect x="760" y="1882" width="380" height="14" fill="${INK}"/>`, brush: { angle: 0, dry: 0.6, zone: 8, edge: 3, bristle: 60, grain: 2.5, tone: 0.2, speck: 0.5, seed: 8 } },
  ],
  head: [
    { svg: p(HEAD_D, BROWN), brush: { angle: 88, dry: 0.36, zone: 36, edge: 5, bristle: 12, grain: 3.5, tone: 0.34, seed: 11 } },
    { svg: `<ellipse cx="590" cy="472" rx="90" ry="94" fill="#FFFFFF"/><ellipse cx="862" cy="468" rx="84" ry="90" fill="#FFFFFF"/>`, brush: { angle: 75, dry: 0.42, zone: 40, edge: 8, bristle: 8, grain: 3, tone: 0.06, seed: 12 } },
  ],
  earL: [{ svg: p(EAR_L_D, INK), brush: { angle: 118, dry: 0.36, zone: 55, edge: 12, bristle: 14, grain: 5, tone: 0.3, speck: 0.7, speckRange: 70, seed: 13 } }],
  earR: [{ svg: p(EAR_R_D, INK), brush: { angle: 58, dry: 0.36, zone: 55, edge: 12, bristle: 16, grain: 5, tone: 0.3, speck: 0.7, speckRange: 80, seed: 14 } }],
};

/** Crisp ink details over the painted head (same coordinates). */
export const FACE = {
  pupils: [
    [600, 494, 30, 34],
    [836, 482, 29, 33],
  ] as const,
  browL: 'M552,398 C566,377 594,370 613,379',
  browR: 'M818,372 C838,356 862,357 881,373',
  nose: 'M538,652 C640,628 822,624 912,642 C926,700 892,770 832,816 C802,838 776,850 752,850 C724,848 690,826 650,796 C590,752 538,702 538,652 Z',
  smile: 'M763,852 C768,892 772,926 790,940 C806,951 824,948 836,937',
  freckles: [
    [498, 790, 6], [522, 803, 5.5], [544, 822, 6], [518, 838, 5], [560, 846, 6], [586, 866, 5.5], [606, 884, 6], [642, 882, 5], [562, 876, 5], [602, 852, 5],
    [852, 832, 5.5], [874, 852, 6], [896, 868, 5], [908, 842, 5.5], [886, 892, 5], [862, 882, 5.5],
  ] as const,
  legs: ['M568,1540 C566,1650 569,1760 566,1852', 'M655,1530 C657,1590 656,1650 655,1700', 'M788,1580 C789,1680 786,1780 788,1862', 'M884,1566 C885,1620 884,1660 884,1700'],
};
