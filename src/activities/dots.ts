import type { Activity } from './types';
import { h, frag, flash } from '../core/dom';
import { card, horseGuide } from '../core/ui';
import { acceptPointer, localPoint, capture } from '../core/pointer';
import { numWord } from '../core/czech';
import { pop } from '../core/sound';

const W = 620;
const H = 600;
/** Horseshoe for luck: dot i+1 at PTS[i], label offset in [dx, dy]. */
const PTS: [number, number, number, number][] = [
  [170, 100, -40, 0], [160, 210, -40, 0], [170, 320, -40, 0], [210, 420, -36, 20], [280, 485, 0, 46],
  [360, 485, 0, 46], [430, 420, 36, 20], [470, 320, 40, 0], [480, 210, 40, 0], [470, 100, 44, 0],
];

/** Connect the dots 1→10; only the next dot accepts the line, at the end the picture comes alive. */
export const dots: Activity<Record<string, never>> = (api) => {
  api.layer.append(horseGuide(50, -6, 300));
  const c = card(400, 136, W, H);
  const pathD = PTS.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const svg = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;touch-action:none" role="img" aria-label="Spojovačka od 1 do 10">
    <g class="reveal" opacity="0">
      <path d="${pathD}" fill="none" stroke="#B88A00" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${pathD}" fill="none" stroke="#FFCC33" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>
      ${PTS.filter((_, i) => i % 2 === 1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#B88A00"/>`).join('')}
    </g>
    <g class="lines"></g>
    <line class="drag" stroke="${api.ink}" stroke-width="10" stroke-linecap="round" visibility="hidden"/>
    <circle class="next-ring" r="30" fill="#FFF3D1"/>
    ${PTS.map(([x, y], i) => `<circle class="dot" data-i="${i}" cx="${x}" cy="${y}" r="13" fill="${i === 0 ? '#3DAA5C' : '#9AA79B'}"/>`).join('')}
  </svg>`);
  c.append(svg);
  for (let i = 0; i < PTS.length; i++) {
    const [x, y, dx, dy] = PTS[i];
    c.append(h('div', { class: 'dot-label', style: { left: `${x + dx - 24}px`, top: `${y + dy - 24}px` } }, String(i + 1)));
  }
  api.layer.append(c);

  const lines = svg.querySelector('.lines')!;
  const drag = svg.querySelector('.drag') as SVGLineElement;
  const ring = svg.querySelector('.next-ring') as SVGCircleElement;
  let k = 0; // last connected dot index
  let pid = -1;
  let moved = 0;

  const setRing = () => {
    const n = PTS[k + 1];
    if (!n) return ring.setAttribute('visibility', 'hidden');
    ring.setAttribute('cx', String(n[0]));
    ring.setAttribute('cy', String(n[1]));
    svg.querySelectorAll('.dot').forEach((d) => {
      const i = Number((d as SVGElement).dataset.i);
      d.setAttribute('fill', i === 0 ? '#3DAA5C' : i <= k ? api.ink : i === k + 1 ? '#F2B400' : '#9AA79B');
    });
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
      pop();
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
    const reveal = svg.querySelector('.reveal') as SVGGElement;
    reveal.setAttribute('opacity', '1');
    flash(c, 'bounce');
    await api.say('Podkova pro štěstí!');
    api.success();
  }

  void api.instruct('Spoj tečky od jedničky až do desítky.');
};
