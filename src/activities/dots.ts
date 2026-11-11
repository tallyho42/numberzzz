import { paintedImage } from '../paint/runtime';
import type { Activity } from './types';
import { h, frag, flash, wait } from '../core/dom';
import { pickFresh } from '../core/progress';
import { card, horseGuide } from '../core/ui';
import { acceptPointer, localPoint, capture } from '../core/pointer';
import { numWord } from '../core/czech';
import { count } from '../core/sound';

const W = 620;
const H = 600;
type Pt = [number, number];

/**
 * Dot-to-dot pictures: ten dots in order, `closed` adds the line 10→1 at the end,
 * `art` is the coloured picture revealed when done (drawn under the child's lines).
 */
interface DotShape {
  name: string;
  /** Spoken when the picture comes alive. */
  done: string;
  pts: Pt[];
  closed: boolean;
  art: (d: string) => string;
  /** Label offsets for dots where "away from the centre" would land inside the picture. */
  labels?: Record<number, Pt>;
}

const filled = (fill: string, stroke: string, extra = '') => (d: string) =>
  `<path d="${d} Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>${extra}`;
const eye = (x: number, y: number, r = 14) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2B2B2B"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/>`;

export const SHAPES: DotShape[] = [
  {
    name: 'podkova',
    done: 'Podkova pro štěstí!',
    pts: [[170, 100], [160, 210], [170, 320], [210, 420], [280, 485], [360, 485], [430, 420], [470, 320], [480, 210], [470, 100]],
    closed: false,
    art: (d) => `<path d="${d}" fill="none" stroke="#A97E1E" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${d}" fill="none" stroke="#E2B13F" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>
      ${[[160, 210], [210, 420], [360, 485], [470, 320], [470, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#A97E1E"/>`).join('')}`,
  },
  {
    name: 'hvězdička',
    done: 'Hvězdička! Svítí jako na nebi.',
    pts: [[310, 105], [362, 244], [510, 250], [394, 342], [433, 485], [310, 403], [187, 485], [226, 342], [110, 250], [258, 244]],
    closed: true,
    art: filled('#E2B13F', '#A97E1E'),
  },
  {
    name: 'srdíčko',
    done: 'Srdíčko! Mám tě rád.',
    pts: [[310, 222], [354, 150], [496, 163], [496, 316], [354, 450], [310, 520], [266, 450], [124, 316], [124, 163], [266, 150]],
    closed: true,
    art: () => `<path d="M310,215 C350,120 510,120 505,250 C500,360 380,430 310,520 C240,430 120,360 115,250 C110,120 270,120 310,215 Z" fill="#F07A8E" stroke="#D6455E" stroke-width="8" stroke-linejoin="round"/>`,
  },
  {
    name: 'domeček',
    done: 'Domeček! Tady se bydlí.',
    pts: [[150, 520], [150, 330], [100, 330], [205, 225], [310, 120], [415, 225], [520, 330], [470, 330], [470, 520], [310, 520]],
    closed: true,
    art: filled('#F6C9A0', '#C9814A', `<path d="M100,330 L310,120 L520,330 Z" fill="#D9617F" stroke="#B8346A" stroke-width="8" stroke-linejoin="round"/>
      <rect x="270" y="420" width="80" height="100" rx="10" fill="#9B6A3C"/><rect x="185" y="370" width="60" height="55" rx="6" fill="#BFE3F7" stroke="#C9814A" stroke-width="5"/><rect x="375" y="370" width="60" height="55" rx="6" fill="#BFE3F7" stroke="#C9814A" stroke-width="5"/>`),
  },
  {
    name: 'loďka',
    done: 'Loďka! Pluje po vodě.',
    pts: [[300, 80], [460, 360], [530, 400], [450, 500], [310, 510], [170, 500], [90, 400], [200, 400], [300, 400], [300, 240]],
    closed: true,
    labels: { 8: [0, -40], 9: [-44, 0] },
    art: () => `<path d="M300,80 L460,360 L300,360 Z" fill="#FFFFFF" stroke="#7FA7C4" stroke-width="8" stroke-linejoin="round"/>
      <line x1="300" y1="80" x2="300" y2="400" stroke="#9B6A3C" stroke-width="10" stroke-linecap="round"/>
      <path d="M90,400 L530,400 L450,500 L170,500 Z" fill="#C8433A" stroke="#B8382E" stroke-width="8" stroke-linejoin="round"/>
      <path d="M60,540 q40,-24 80,0 t80,0 t80,0 t80,0 t80,0 t80,0" fill="none" stroke="#7FA7C4" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    name: 'rybička',
    done: 'Rybička! Plave a mává ocáskem.',
    pts: [[490, 310], [410, 220], [330, 160], [290, 215], [190, 285], [100, 205], [100, 415], [190, 335], [290, 405], [410, 400]],
    closed: true,
    art: filled('#E07B2C', '#C9661A', eye(420, 285)),
  },
  {
    name: 'balónek',
    done: 'Balónek! Letí až do nebe.',
    pts: [[310, 80], [398, 113], [453, 201], [453, 309], [398, 397], [310, 430], [222, 397], [167, 309], [167, 201], [222, 113]],
    closed: true,
    art: filled('#7FA7C4', '#4F7FA3', `<path d="M296,430 L324,430 L316,448 L304,448 Z" fill="#4F7FA3"/><path d="M310,448 q-30,30 0,60 t0,60" fill="none" stroke="#7A7A7A" stroke-width="5"/><ellipse cx="250" cy="190" rx="22" ry="40" fill="#fff" opacity="0.5" transform="rotate(25 250 190)"/>`),
  },
  {
    name: 'měsíček',
    done: 'Měsíček! Dobrou noc.',
    pts: [[435, 128], [265, 110], [138, 225], [138, 395], [265, 510], [435, 492], [349, 444], [299, 359], [299, 261], [349, 176]],
    closed: true,
    art: filled('#FFE17A', '#A97E1E'),
    labels: { 6: [42, 10], 7: [44, 0], 8: [44, 0], 9: [42, -10] },
  },
  {
    name: 'kočička',
    done: 'Kočička! Mňau!',
    pts: [[170, 100], [250, 200], [370, 200], [450, 100], [470, 260], [450, 380], [380, 450], [240, 450], [170, 380], [150, 260]],
    closed: true,
    art: filled('#BDBDBD', '#7A7A7A', `${eye(250, 300, 18)}${eye(370, 300, 18)}<path d="M296,350 L324,350 L310,368 Z" fill="#F07A8E"/>
      <path d="M310,368 q-14,22 -34,14 M310,368 q14,22 34,14" fill="none" stroke="#555" stroke-width="5" stroke-linecap="round"/>
      <path d="M230,360 L150,345 M230,375 L150,390 M390,360 L470,345 M390,375 L470,390" stroke="#555" stroke-width="4" stroke-linecap="round"/>`),
  },
  {
    name: 'raketa',
    done: 'Raketa! Tři, dva, jedna, start!',
    pts: [[310, 70], [390, 200], [390, 390], [470, 480], [390, 450], [310, 490], [230, 450], [150, 480], [230, 390], [230, 200]],
    closed: true,
    art: filled('#E8E8F0', '#7A7A9A', `<path d="M390,390 L470,480 L390,450 Z M230,390 L150,480 L230,450 Z" fill="#C8433A" stroke="#B8382E" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="310" cy="250" r="38" fill="#BFE3F7" stroke="#7FA7C4" stroke-width="8"/>
      <path d="M270,470 Q310,580 350,470 Z" fill="#E2B13F" stroke="#E07B2C" stroke-width="6" stroke-linejoin="round"/>`),
  },
  {
    name: 'mrkev',
    done: 'Mrkev! Mňam.',
    pts: [[310, 530], [250, 350], [220, 230], [170, 100], [270, 190], [310, 70], [350, 190], [450, 100], [400, 230], [370, 350]],
    closed: true,
    art: () => `<path d="M220,230 L170,100 L270,190 L310,70 L350,190 L450,100 L400,230 Z" fill="#5CB85C" stroke="#3A8A3A" stroke-width="8" stroke-linejoin="round"/>
      <path d="M310,530 L250,350 L220,230 Q310,200 400,230 L370,350 Z" fill="#E07B2C" stroke="#C9661A" stroke-width="8" stroke-linejoin="round"/>
      <path d="M250,300 L290,295 M330,350 L365,345 M270,410 L300,405" stroke="#C9661A" stroke-width="6" stroke-linecap="round"/>`,
  },
];

/** Connect the dots 1→10; only the next dot accepts the line, at the end the picture comes alive. */
export const dots: Activity<Record<string, never>> = (api) => {
  const shape = pickFresh('dots', SHAPES, (sh) => sh.name);
  const PTS = shape.pts;
  // Label sits outside the picture: pushed away from the centre of the dots.
  const cx = PTS.reduce((a, p) => a + p[0], 0) / PTS.length;
  const cy = PTS.reduce((a, p) => a + p[1], 0) / PTS.length;
  const labelAt = ([x, y]: Pt, i: number): Pt => {
    const o = shape.labels?.[i];
    if (o) return [x + o[0], y + o[1]];
    const len = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / len) * 40, y + ((y - cy) / len) * 40];
  };
  api.layer.append(horseGuide(40, 14, 300));
  const c = card(400, 136, W, H);
  const pathD = PTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const svg = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;touch-action:none" role="img" aria-label="Spojovačka od 1 do 10">
    <g class="reveal" opacity="0">${paintedImage(shape.art(pathD), [0, 0, W, H], W / 2, H / 2, W, W, { zone: 12, edge: 2, bristle: 6, grain: 1.4, speck: 0.15, speckRange: 10 })}</g>
    <g class="lines"></g>
    <line class="drag" stroke="${api.ink}" stroke-width="10" stroke-linecap="round" visibility="hidden"/>
    <circle class="next-ring" r="30" fill="#FBEFD2"/>
    ${PTS.map(([x, y], i) => `<circle class="dot" data-i="${i}" cx="${x}" cy="${y}" r="13" fill="${i === 0 ? '#6E9B4C' : '#B3A794'}"/>`).join('')}
  </svg>`);
  c.append(svg);
  for (let i = 0; i < PTS.length; i++) {
    const [lx, ly] = labelAt(PTS[i], i);
    c.append(h('div', { class: 'dot-label', style: { left: `${lx - 24}px`, top: `${ly - 24}px` } }, String(i + 1)));
  }
  api.layer.append(c);

  const lines = svg.querySelector('.lines') as SVGGElement;
  const drag = svg.querySelector('.drag') as SVGLineElement;
  const ring = svg.querySelector('.next-ring') as SVGCircleElement;
  let k = 0; // last connected dot index
  let pid = -1;
  let moved = 0;

  const setRing = () => {
    svg.querySelectorAll('.dot').forEach((d) => {
      const i = Number((d as SVGElement).dataset.i);
      d.setAttribute('fill', i === 0 ? '#6E9B4C' : i <= k ? api.ink : i === k + 1 ? '#E2B13F' : '#B3A794');
    });
    const n = PTS[k + 1];
    if (!n) return ring.setAttribute('visibility', 'hidden');
    ring.setAttribute('cx', String(n[0]));
    ring.setAttribute('cy', String(n[1]));
  };
  setRing();

  const startDrag = (x: number, y: number) => {
    drag.setAttribute('x1', String(PTS[k][0]));
    drag.setAttribute('y1', String(PTS[k][1]));
    drag.setAttribute('x2', String(x));
    drag.setAttribute('y2', String(y));
    drag.setAttribute('visibility', 'visible');
  };

  svg.addEventListener('pointerdown', (e) => {
    if (!acceptPointer(e) || pid !== -1 || k >= PTS.length - 1) return;
    const p = localPoint(e, svg, W, H);
    if (Math.hypot(p.x - PTS[k][0], p.y - PTS[k][1]) > 55) {
      void api.say(`Začni u čísla ${numWord(k + 1)}.`);
      return;
    }
    pid = e.pointerId;
    moved = 0;
    capture(svg, e.pointerId);
    startDrag(p.x, p.y);
  });

  svg.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    const p = localPoint(e, svg, W, H);
    moved++;
    drag.setAttribute('x2', String(p.x));
    drag.setAttribute('y2', String(p.y));
    const n = PTS[k + 1];
    if (n && Math.hypot(p.x - n[0], p.y - n[1]) < 34) {
      lines.insertAdjacentHTML('beforeend', `<line x1="${PTS[k][0]}" y1="${PTS[k][1]}" x2="${n[0]}" y2="${n[1]}" stroke="${api.ink}" stroke-width="10" stroke-linecap="round"/>`);
      k++;
      count(k + 1);
      setRing();
      void api.say(numWord(k + 1));
      if (k >= PTS.length - 1) {
        drag.setAttribute('visibility', 'hidden');
        pid = -1;
        void finish();
        return;
      }
      startDrag(p.x, p.y);
    }
  });

  const end = (e: PointerEvent) => {
    if (e.pointerId !== pid) return;
    pid = -1;
    drag.setAttribute('visibility', 'hidden');
    if (moved > 8 && k < PTS.length - 1) void api.say(`Jeď k číslu ${numWord(k + 2)}.`);
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  async function finish() {
    if (shape.closed) {
      const [a, b] = [PTS[PTS.length - 1], PTS[0]];
      lines.insertAdjacentHTML('beforeend', `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${api.ink}" stroke-width="10" stroke-linecap="round"/>`);
      await wait(500);
    }
    const reveal = svg.querySelector('.reveal') as SVGGElement;
    reveal.setAttribute('opacity', '1');
    lines.setAttribute('opacity', '0.35');
    flash(c, 'bounce');
    await api.say(shape.done);
    api.success();
  }

  void api.instruct('Spoj tečky od jedničky až do desítky.');
};
