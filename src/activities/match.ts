import { theme } from '../themes';
import type { Activity } from './types';
import { frag, shuffle, pick } from '../core/dom';
import { card } from '../core/ui';
import { acceptPointer, localPoint, capture } from '../core/pointer';
import { itemGroup, type ItemKind } from '../art/art';
import { dotPattern } from './choice';
import { recordResult } from '../core/progress';
import { soft, pop } from '../core/sound';
import { placeItems } from './choice';

const W = 1000;
const H = 600;
const ROWS = [110, 300, 490];
const LA = 318; // left anchor x
const RA = 742; // right anchor x

function representation(n: number, kind: 'items' | 'dice', cy: number, item: ItemKind): string {
  if (kind === 'dice') {
    return `<g transform="translate(125,${cy - 55})"><rect width="110" height="110" rx="20" fill="#FFFFFF" stroke="#20150E" stroke-width="4"/>${dotPattern(n, 110).replaceAll('#E07B2C', '#20150E')}</g>`;
  }
  const pts = placeItems(n, 220, 130, n > 6 ? 46 : 62);
  return pts.map((p) => itemGroup(item, 70 + p.x, cy - 65 + p.y, n > 6 ? 1.05 : 1.35)).join('');
}

/** Ten-frame drawn for any n (0–10) — dotPattern switches to a ten-frame from 7, so force it here. */
function tenFrame(n: number, cy: number): string {
  const cell = 40;
  const x0 = 80;
  const y0 = cy - 40;
  let s = `<rect x="${x0}" y="${y0}" width="200" height="80" rx="6" fill="#FFFFFF" stroke="#20150E" stroke-width="3"/>`;
  for (let i = 1; i < 5; i++) s += `<path d="M${x0 + i * cell},${y0} V${y0 + 80}" stroke="#20150E" stroke-width="2"/>`;
  s += `<path d="M${x0},${y0 + 40} H${x0 + 200}" stroke="#20150E" stroke-width="2"/>`;
  for (let i = 0; i < n; i++) s += `<circle cx="${x0 + (i % 5) * cell + 20}" cy="${y0 + Math.floor(i / 5) * cell + 20}" r="13" fill="#E07B2C"/>`;
  return s;
}

/** Match groups (items, dice, ten-frame) on the left with shuffled numbers on the right by drawing a line. */
export const match: Activity<{ nums: number[] }> = (api, { nums }) => {
  const item: ItemKind = pick(theme().items);
  const left = nums.slice(0, 3);
  let right = shuffle(left);
  for (let i = 0; i < 5 && right.every((v, j) => v === left[j]); i++) right = shuffle(left);
  const kinds = shuffle(['items', 'dice', 'frame'] as const).map((k, i) => (k === 'dice' && (left[i] < 1 || left[i] > 6) ? 'frame' : k));

  const c = card(90, 140, W, H);
  // Scaled down from the right so the animal in the bottom-left corner stays visible.
  Object.assign(c.style, { transform: 'scale(0.9)', transformOrigin: 'right top' });
  const tiles = ROWS.map((cy) => `<rect x="60" y="${cy - 75}" width="240" height="150" rx="28" fill="#FBF7EF" stroke="#EDE4D3" stroke-width="2"/><rect x="760" y="${cy - 75}" width="160" height="150" rx="28" fill="#FBF7EF" stroke="#EDE4D3" stroke-width="2"/>`).join('');
  const reps = left
    .map((n, i) => {
      const k = kinds[i];
      return k === 'frame' ? tenFrame(n, ROWS[i]) : representation(n, k, ROWS[i], item);
    })
    .join('');
  const digits = right.map((n, i) => `<text x="840" y="${ROWS[i] + 38}" text-anchor="middle" font-family="Andika, system-ui, sans-serif" font-weight="700" font-size="110" fill="#20150E">${n}</text>`).join('');
  const anchors = ROWS.map((cy, i) => `<circle class="anchor-l" data-i="${i}" cx="${LA}" cy="${cy}" r="14" fill="#6E9B4C"/><circle class="anchor-r" data-i="${i}" cx="${RA}" cy="${cy}" r="14" fill="#FFFFFF" stroke="#9CCB94" stroke-width="4"/>`).join('');
  const svg = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;touch-action:none" role="img" aria-label="Spoj skupiny se správným číslem">
    ${tiles}${reps}${digits}<g class="lines"></g><line class="drag" stroke="${api.ink}" stroke-width="10" stroke-linecap="round" visibility="hidden"/>${anchors}</svg>`);
  c.append(svg);
  api.layer.append(c);
  const lines = svg.querySelector('.lines')!;
  const drag = svg.querySelector('.drag') as SVGLineElement;
  const doneL = new Set<number>();
  const doneR = new Set<number>();
  let from: { side: 'l' | 'r'; i: number } | null = null;
  let pid = -1;

  const anchorAt = (p: { x: number; y: number }, side: 'l' | 'r', r = 60) => {
    const x = side === 'l' ? LA : RA;
    for (let i = 0; i < 3; i++) if (Math.hypot(p.x - x, p.y - ROWS[i]) < r) return i;
    return -1;
  };

  svg.addEventListener('pointerdown', (e) => {
    if (!acceptPointer(e) || from) return;
    const p = localPoint(e, svg, W, H);
    for (const side of ['l', 'r'] as const) {
      const i = anchorAt(p, side, 80);
      if (i >= 0 && !(side === 'l' ? doneL : doneR).has(i)) {
        from = { side, i };
        pid = e.pointerId;
        capture(svg, e.pointerId);
        drag.setAttribute('x1', String(side === 'l' ? LA : RA));
        drag.setAttribute('y1', String(ROWS[i]));
        drag.setAttribute('x2', String(p.x));
        drag.setAttribute('y2', String(p.y));
        drag.setAttribute('visibility', 'visible');
        return;
      }
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (!from || e.pointerId !== pid) return;
    const p = localPoint(e, svg, W, H);
    drag.setAttribute('x2', String(p.x));
    drag.setAttribute('y2', String(p.y));
  });
  const end = (e: PointerEvent) => {
    if (!from || e.pointerId !== pid) return;
    const p = localPoint(e, svg, W, H);
    drag.setAttribute('visibility', 'hidden');
    const other = from.side === 'l' ? 'r' : 'l';
    const j = anchorAt(p, other, 90);
    const li = from.side === 'l' ? from.i : j;
    const ri = from.side === 'l' ? j : from.i;
    from = null;
    if (j < 0) return; // let go somewhere else: nothing happens
    if ((other === 'r' ? doneR : doneL).has(j)) return;
    const ok = left[li] === right[ri];
    const line = frag<SVGLineElement>(`<svg xmlns="http://www.w3.org/2000/svg"><line x1="${LA}" y1="${ROWS[li]}" x2="${RA}" y2="${ROWS[ri]}" stroke="${api.ink}" stroke-width="10" stroke-linecap="round"/></svg>`).firstElementChild as SVGLineElement;
    lines.append(line);
    if (ok) {
      pop();
      doneL.add(li);
      doneR.add(ri);
      svg.querySelector(`.anchor-r[data-i="${ri}"]`)?.setAttribute('fill', '#6E9B4C');
      if (doneL.size === 3) {
        left.forEach((n) => recordResult('other', n, true));
        api.success();
      }
    } else {
      soft();
      api.fail();
      line.classList.add('fade-out');
      setTimeout(() => line.remove(), 700);
      void api.say('Tyhle k sobě nepatří. Spočítej to ještě jednou.');
    }
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  void api.instruct('Spoj každou skupinu se správným číslem. Táhni čáru od zelené tečky.');
};
