/**
 * Big painted pieces baked by the atelier: the meadow background, the animals' homes,
 * the paper card (9-slice), round button blobs and the medal.
 */
import type { Layer } from '../paint/brush';

export interface Baked {
  name: string;
  vb: [number, number, number, number];
  px: number;
  layers: Layer[];
  png?: boolean;
}

export const PAPER = '#F6F0E4';
export const INK = '#20150E';
export const SAGE = '#8FAA66';
export const SAGE_LIGHT = '#B8C88F';
export const OCHRE = '#B07A3F';
export const MUSTARD = '#E2B13F';
export const ROSE = '#D9617F';
export const SKY = '#7FA7C4';
export const BRICK = '#B4513A';

const p = (d: string, fill: string) => `<path d="${d}" fill="${fill}"/>`;

export const SCENE_LAYERS: Baked[] = [
  {
    name: 'bg-meadow',
    vb: [0, 0, 1180, 820],
    px: 1600,
    layers: [
      { svg: `<ellipse cx="250" cy="170" rx="120" ry="26" fill="#DCE5E6"/><ellipse cx="320" cy="150" rx="70" ry="24" fill="#DCE5E6"/><ellipse cx="860" cy="110" rx="90" ry="18" fill="#DCE5E6"/>`, brush: { angle: 0, dry: 0.5, zone: 20, edge: 4, bristle: 30, grain: 3, tone: 0.1, seed: 51 } },
      { svg: `<circle cx="1050" cy="150" r="62" fill="${MUSTARD}"/>`, brush: { angle: 35, dry: 0.3, zone: 18, edge: 3, bristle: 8, grain: 3, tone: 0.25, seed: 52 } },
      { svg: p('M0,610 C220,540 420,575 600,620 C800,670 980,575 1180,600 L1180,820 L0,820 Z', SAGE_LIGHT), brush: { angle: 2, dry: 0.42, zone: 40, edge: 5, bristle: 40, grain: 4, tone: 0.3, seed: 53 } },
      { svg: p('M0,700 C260,655 520,710 760,700 C930,694 1060,665 1180,680 L1180,820 L0,820 Z', SAGE), brush: { angle: -2, dry: 0.38, zone: 40, edge: 5, bristle: 40, grain: 4, tone: 0.3, speck: 0.2, seed: 54 } },
    ],
  },
  {
    name: 'home-dog',
    vb: [0, 0, 600, 560],
    px: 900,
    layers: [
      { svg: p('M70,250 L300,70 L530,250 Z', BRICK), brush: { angle: 20, dry: 0.4, zone: 26, edge: 4, bristle: 22, grain: 3, tone: 0.3, speck: 0.2, seed: 61 } },
      { svg: `<rect x="120" y="230" width="360" height="300" fill="${OCHRE}"/>`, brush: { angle: 90, dry: 0.38, zone: 26, edge: 4, bristle: 14, grain: 3, tone: 0.35, seed: 62 } },
      { svg: p('M220,530 L220,400 A80,80 0 0 1 380,400 L380,530 Z', INK), brush: { angle: 90, dry: 0.3, zone: 20, edge: 4, bristle: 10, grain: 3, tone: 0.2, seed: 63 } },
      { svg: `<rect x="40" y="520" width="520" height="22" fill="${SAGE}"/>`, brush: { angle: 0, dry: 0.5, zone: 10, edge: 4, bristle: 40, grain: 3, tone: 0.3, seed: 64 } },
    ],
  },
  {
    name: 'home-horse',
    vb: [0, 0, 600, 560],
    px: 900,
    layers: [
      { svg: p('M60,250 L300,60 L540,250 Z', '#7A3B2A'), brush: { angle: 20, dry: 0.4, zone: 26, edge: 4, bristle: 22, grain: 3, tone: 0.3, speck: 0.2, seed: 71 } },
      { svg: `<rect x="100" y="230" width="400" height="300" fill="${BRICK}"/>`, brush: { angle: 90, dry: 0.38, zone: 26, edge: 4, bristle: 14, grain: 3, tone: 0.35, seed: 72 } },
      { svg: `<rect x="220" y="330" width="160" height="200" fill="#F2E6CC"/>`, brush: { angle: 90, dry: 0.3, zone: 16, edge: 3, bristle: 8, grain: 3, tone: 0.1, seed: 73 } },
      { svg: `<path d="M226,336 L374,524 M374,336 L226,524" stroke="${OCHRE}" stroke-width="18"/>`, brush: { angle: 50, dry: 0.4, zone: 10, edge: 3, bristle: 8, grain: 2.5, tone: 0.2, seed: 74 } },
      { svg: `<rect x="40" y="520" width="520" height="22" fill="${SAGE}"/>`, brush: { angle: 0, dry: 0.5, zone: 10, edge: 4, bristle: 40, grain: 3, tone: 0.3, seed: 75 } },
    ],
  },
  {
    name: 'home-turtle',
    vb: [0, 0, 600, 560],
    px: 900,
    layers: [
      // reeds behind the pond
      { svg: `<g fill="#6E8A45"><path d="M430,420 C426,320 432,220 446,150 L456,150 C448,230 446,330 452,420 Z"/><path d="M470,420 C474,330 490,250 512,190 L522,194 C504,260 494,340 494,420 Z"/><path d="M400,420 C390,350 380,290 360,240 L370,236 C394,290 410,350 420,420 Z"/><path d="M120,430 C116,360 122,300 136,250 L146,252 C136,310 136,370 142,430 Z"/></g>`, brush: { angle: 85, dry: 0.4, zone: 8, edge: 3, bristle: 14, grain: 2.5, tone: 0.3, seed: 171 } },
      { svg: `<g fill="#7A4A26"><rect x="438" y="130" width="22" height="70" rx="11"/><rect x="503" y="172" width="20" height="62" rx="10"/><rect x="348" y="226" width="18" height="50" rx="9" transform="rotate(-20 357 251)"/></g>`, brush: { angle: 90, dry: 0.35, zone: 8, edge: 2, bristle: 6, grain: 2.5, tone: 0.3, seed: 172 } },
      // grassy bank
      { svg: `<path d="M20,420 C120,380 480,380 580,420 L580,540 L20,540 Z" fill="${SAGE}"/>`, brush: { angle: 0, dry: 0.42, zone: 20, edge: 4, bristle: 30, grain: 3, tone: 0.3, seed: 173 } },
      // water
      { svg: `<ellipse cx="300" cy="455" rx="250" ry="78" fill="${SKY}"/>`, brush: { angle: 0, dry: 0.36, zone: 26, edge: 4, bristle: 30, grain: 3, tone: 0.3, seed: 174 } },
      { svg: `<g fill="#B9D2E2"><rect x="150" y="430" width="120" height="10" rx="5"/><rect x="330" y="462" width="90" height="9" rx="4"/><rect x="200" y="490" width="70" height="8" rx="4"/></g>`, brush: { angle: 0, dry: 0.5, zone: 6, edge: 2, bristle: 20, grain: 2, tone: 0.1, seed: 175 } },
      // lily pads with a pink flower, a stone
      { svg: `<g fill="#5E8C3A"><path d="M380,440 A44,22 0 1 0 424,440 L402,440 Z"/><path d="M120,470 A36,18 0 1 0 156,470 L138,470 Z"/></g>`, brush: { angle: 0, dry: 0.35, zone: 10, edge: 3, bristle: 10, grain: 2.5, tone: 0.3, seed: 176 } },
      { svg: `<g fill="${ROSE}"><circle cx="402" cy="424" r="13"/><circle cx="390" cy="430" r="10"/><circle cx="414" cy="430" r="10"/></g><circle cx="402" cy="428" r="6" fill="${MUSTARD}"/>`, brush: { angle: 30, dry: 0.3, zone: 6, edge: 2, bristle: 4, grain: 2, tone: 0.2, seed: 177 } },
      { svg: `<path d="M40,420 C40,380 80,360 120,366 C160,372 176,400 170,428 Z" fill="#9C978C"/>`, brush: { angle: 20, dry: 0.36, zone: 16, edge: 3, bristle: 10, grain: 3, tone: 0.3, seed: 178 } },
    ],
  },
  {
    name: 'home-unicorn',
    vb: [0, 0, 600, 560],
    px: 900,
    layers: [
      // castle walls and towers
      { svg: `<g fill="#EBD9E6"><rect x="170" y="250" width="260" height="280"/><rect x="80" y="200" width="110" height="330"/><rect x="410" y="200" width="110" height="330"/></g>`, brush: { angle: 90, dry: 0.36, zone: 22, edge: 4, bristle: 12, grain: 3, tone: 0.2, seed: 181 } },
      { svg: `<g fill="#EBD9E6"><rect x="170" y="226" width="40" height="34"/><rect x="240" y="226" width="40" height="34"/><rect x="320" y="226" width="40" height="34"/><rect x="390" y="226" width="40" height="34"/></g>`, brush: { angle: 90, dry: 0.36, zone: 10, edge: 3, bristle: 8, grain: 3, tone: 0.2, seed: 182 } },
      // roofs
      { svg: `<g fill="${ROSE}"><path d="M66,206 L135,60 L204,206 Z"/><path d="M396,206 L465,60 L534,206 Z"/></g>`, brush: { angle: 70, dry: 0.4, zone: 20, edge: 4, bristle: 18, grain: 3, tone: 0.3, speck: 0.2, seed: 183 } },
      { svg: `<g fill="${MUSTARD}"><path d="M135,62 L135,20 L170,32 L135,44 Z"/><path d="M465,62 L465,20 L500,32 L465,44 Z"/></g>`, brush: { angle: 0, dry: 0.3, zone: 6, edge: 2, bristle: 6, grain: 2, tone: 0.2, seed: 184 } },
      // door and windows
      { svg: `<path d="M240,530 L240,420 A60,60 0 0 1 360,420 L360,530 Z" fill="#8E5B2A"/><g fill="${SKY}"><path d="M118,330 L118,290 A17,17 0 0 1 152,290 L152,330 Z"/><path d="M448,330 L448,290 A17,17 0 0 1 482,290 L482,330 Z"/><path d="M283,340 L283,310 A17,17 0 0 1 317,310 L317,340 Z"/></g>`, brush: { angle: 90, dry: 0.3, zone: 10, edge: 3, bristle: 8, grain: 2.5, tone: 0.2, seed: 185 } },
      { svg: `<rect x="40" y="520" width="520" height="22" fill="${SAGE}"/>`, brush: { angle: 0, dry: 0.5, zone: 10, edge: 4, bristle: 40, grain: 3, tone: 0.3, seed: 186 } },
    ],
  },
];

const blob = (name: string, fill: string, shade: string, seed: number): Baked => ({
  name,
  vb: [0, 0, 400, 400],
  px: 320,
  png: true,
  layers: [
    { svg: `<circle cx="200" cy="212" r="176" fill="${shade}"/>`, brush: { angle: 0, dry: 0.3, zone: 16, edge: 4, bristle: 10, grain: 3, tone: 0.1, seed } },
    { svg: `<circle cx="200" cy="196" r="176" fill="${fill}"/>`, brush: { angle: 80, dry: 0.28, zone: 22, edge: 4, bristle: 12, grain: 3, tone: fill === '#FFFFFF' ? 0.03 : 0.25, seed: seed + 1, clean: fill === '#FFFFFF' } },
  ],
});

export const UI_ART: Baked[] = [
  {
    name: 'card',
    vb: [0, 0, 400, 400],
    px: 400,
    png: true,
    layers: [
      { svg: `<rect x="22" y="30" width="356" height="356" rx="44" fill="#E4D8C2"/>`, brush: { angle: 0, dry: 0.3, zone: 14, edge: 3, bristle: 10, grain: 3, tone: 0.1, seed: 81, clean: true } },
      { svg: `<rect x="22" y="16" width="356" height="356" rx="44" fill="#FFFFFF"/>`, brush: { angle: 90, dry: 0.35, zone: 18, edge: 3, bristle: 10, grain: 3, tone: 0.02, seed: 82, clean: true } },
    ],
  },
  blob('blob-white', '#FFFFFF', '#E4D8C2', 91),
  blob('blob-green', SAGE, '#5F7A40', 93),
  blob('blob-ochre', OCHRE, '#7E5428', 95),
  blob('blob-rose', ROSE, '#A8435C', 97),
  blob('blob-mustard', MUSTARD, '#A97E1E', 99),
  {
    name: 'medal',
    vb: [0, 0, 400, 480],
    px: 520,
    png: true,
    layers: [
      { svg: p('M120,20 L200,20 L170,200 L100,170 Z', SKY), brush: { angle: 100, dry: 0.4, zone: 20, edge: 3, bristle: 12, grain: 3, tone: 0.3, seed: 101 } },
      { svg: p('M280,20 L200,20 L230,200 L300,170 Z', ROSE), brush: { angle: 80, dry: 0.4, zone: 20, edge: 3, bristle: 12, grain: 3, tone: 0.3, seed: 102 } },
      { svg: `<circle cx="200" cy="300" r="160" fill="${MUSTARD}"/>`, brush: { angle: 60, dry: 0.3, zone: 26, edge: 4, bristle: 14, grain: 3, tone: 0.3, seed: 103 } },
      { svg: `<circle cx="200" cy="300" r="124" fill="#F0CF73"/>`, brush: { angle: 120, dry: 0.4, zone: 26, edge: 4, bristle: 10, grain: 3, tone: 0.2, seed: 104 } },
    ],
  },
];
