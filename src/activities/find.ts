import { theme } from '../themes';
import type { Activity } from './types';
import { h, frag, randInt, shuffle } from '../core/dom';
import { card } from '../core/ui';
import { Ink } from '../core/ink';
import { placeItems, answerButtons, countAloud } from './choice';
import { itemGroup, itemSvg, ITEM_NAMES, type ItemKind } from '../art/art';
import { recordResult } from '../core/progress';
import { pop } from '../core/sound';
import { resampleStep } from '../core/geometry';

/** Find & count: scattered items of several kinds; tick them off with the pencil, then pick the number. */
export const find: Activity<{ n: number }> = (api, { n }) => {
  const kinds: ItemKind[] = shuffle([...theme().items]);
  const target = kinds[0];
  const items: { kind: ItemKind; x: number; y: number; r: number; checked: boolean }[] = [];
  const counts: [ItemKind, number][] = [[target, n], [kinds[1], randInt(2, 4)], [kinds[2], randInt(2, 4)]];
  const total = counts.reduce((a, [, c]) => a + c, 0);
  const size = total > 14 ? 74 : 86;
  const pts = placeItems(total, 640, 600, size);
  let i = 0;
  for (const [kind, c] of counts) for (let j = 0; j < c; j++, i++) items.push({ kind, x: pts[i].x, y: pts[i].y, r: randInt(-30, 30), checked: false });

  const W = 640;
  const H = 600;
  const c = card(230, 140, W, H);
  c.append(frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0" aria-hidden="true">${items.map((it) => itemGroup(it.kind, it.x, it.y, size / 40, it.r)).join('')}</svg>`));
  const marks = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;pointer-events:none" aria-hidden="true"></svg>`);
  api.layer.append(c);

  const ink = new Ink(c, W, H, {
    color: api.ink,
    width: 8,
    onEnd: (s) => {
      const sp = s.pts.length > 1 ? resampleStep(s.pts, 6) : s.pts;
      for (const it of items) {
        if (it.checked) continue;
        if (sp.some((p) => Math.hypot(p.x - it.x, p.y - it.y) < size * 0.42)) {
          it.checked = true;
          pop();
          marks.insertAdjacentHTML('beforeend', `<path class="tick" d="M${it.x - 22},${it.y + 2} l14,14 l30,-32" fill="none" stroke="${api.ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`);
        }
      }
      void ink.fade(s, 500);
    },
  });
  c.append(marks);

  const q = h('div', { class: 'question-card', role: 'img', 'aria-label': `Kolik je ${ITEM_NAMES[target].many}?`, html: `${itemSvg(target, 96)}<span>?</span>` });
  q.style.left = '890px';
  q.style.top = '130px';
  api.layer.append(q);

  answerButtons(api, n, {
    left: 920,
    top: 298,
    size: 140,
    onCorrect: () => {
      recordResult('other', n, true);
      api.success();
    },
    onWrong: (fails) => {
      if (fails === 2) {
        const targets = items.filter((it) => it.kind === target);
        void countAloud(api, c, targets.map((t) => ({ x: t.x - 22, y: t.y - 60 })));
      }
    },
  });
  const name = ITEM_NAMES[target];
  void api.instruct(`Najdi všechny ${name.few} a spočítej je. Můžeš si je tužkou odškrtávat. Kolik je ${name.many}?`);
  return () => ink.destroy();
};
