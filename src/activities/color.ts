import type { Activity } from './types';
import { h, flash, pick, wait } from '../core/dom';
import { card } from '../core/ui';
import { numWord, digitNoun } from '../core/czech';
import { recordResult } from '../core/progress';
import { pop, soft } from '../core/sound';

const PICTURES: { name: string; color: string; mask: string[] }[] = [
  {
    name: 'srdíčko',
    color: '#E8574B',
    mask: ['00000000', '01100110', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'],
  },
  {
    name: 'podkova',
    color: '#E0A800',
    mask: ['00000000', '01100110', '01100110', '01100110', '01100110', '01111110', '00111100', '00000000'],
  },
  {
    name: 'hvězdička',
    color: '#F2B400',
    mask: ['00011000', '00011000', '11111111', '01111110', '00111100', '01111110', '01100110', '00000000'],
  },
];

/** Secret spell: tap every cell with the target number; the coloured cells reveal a picture. */
export const color: Activity<{ digit: number }> = (api, { digit }) => {
  const pic = pick(PICTURES);
  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== digit);
  const c = card(150, 128, 620, 620);
  const grid = h('div', { class: 'spell-grid' });
  c.append(grid);
  api.layer.append(c);
  let left = 0;
  let fails = 0;
  let done = false;
  const handlers = new Map<Element, () => void>();
  // Cells react on touch-down (no waiting for a click iPadOS may drop); a touch in the gap picks the nearest cell.
  let lastDown = 0;
  grid.addEventListener('pointerdown', (e) => {
    lastDown = Date.now();
    let cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('.spell-cell');
    if (!cell) {
      let best = Infinity;
      for (const el of handlers.keys()) {
        const r = el.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < best) [best, cell] = [d, el];
      }
    }
    if (cell) handlers.get(cell)?.();
  });
  grid.addEventListener('click', (e) => {
    if (Date.now() - lastDown < 800) return; // already handled on pointerdown
    const cell = (e.target as Element).closest('.spell-cell');
    if (cell) handlers.get(cell)?.();
  });

  for (let r = 0; r < 8; r++) {
    for (let col = 0; col < 8; col++) {
      const target = pic.mask[r][col] === '1';
      const n = target ? digit : pick(others);
      if (target) left++;
      const b = h('button', { class: 'spell-cell', 'aria-label': `Políčko ${n}` }, String(n));
      handlers.set(b, async () => {
        if (done || b.classList.contains('colored')) return;
        if (target) {
          b.classList.add('colored');
          b.style.background = pic.color;
          pop();
          left--;
          if (left === 0) {
            done = true;
            grid.classList.add('revealed');
            await wait(400);
            await api.say(`Kouzlo se povedlo! Je to ${pic.name}.`);
            recordResult('other', digit, fails < 3);
            api.success();
          }
        } else {
          fails++;
          soft();
          flash(b, 'shake');
          api.fail();
          void api.say(`To je ${numWord(n)}. Hledáme ${digitNoun(digit)}.`);
        }
      });
      grid.append(b);
    }
  }

  const target = h('div', { class: 'spell-target', role: 'img', 'aria-label': `Vybarvi políčka s číslem ${digit}`, style: { borderColor: pic.color } }, String(digit));
  const swatch = h('div', { class: 'spell-swatch', style: { background: pic.color } });
  api.layer.append(h('div', { class: 'spell-side' }, target, swatch));
  void api.instruct(`Tajné kouzlo! Ťukni na všechna políčka s číslem ${numWord(digit)}. Co se objeví?`);
};
