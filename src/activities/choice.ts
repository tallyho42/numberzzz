import type { Activity, ActivityApi } from './types';
import { h, onTap, frag, box, choices, flash, wait, randInt, pick, shuffle } from '../core/dom';
import { card, numberButton } from '../core/ui';
import { plural, numWord } from '../core/czech';
import { recordResult, store } from '../core/progress';
import { itemGroup, ITEM_NAMES, dotPattern, type ItemKind } from '../art/art';
import { theme } from '../themes';
import { fem } from '../themes/types';
import { count as countSound } from '../core/sound';
import { crossable } from './cross';
import type { P } from '../core/geometry';

export { dotPattern };

/** Random non-overlapping positions inside a w×h area. */
export function placeItems(n: number, w: number, h: number, size: number, avoid: P[] = []): P[] {
  const pts: P[] = [];
  const pad = size * 0.6;
  for (let tries = 0; pts.length < n && tries < 4000; tries++) {
    const p = { x: pad + Math.random() * (w - 2 * pad), y: pad + Math.random() * (h - 2 * pad) };
    const minD = tries < 2500 ? size * 1.05 : size * 0.8;
    if ([...pts, ...avoid].every((q) => Math.hypot(q.x - p.x, q.y - p.y) > minD)) pts.push(p);
  }
  while (pts.length < n) pts.push({ x: pad + Math.random() * (w - 2 * pad), y: pad + Math.random() * (h - 2 * pad) });
  return pts;
}

/**
 * Column (or row) of big number buttons. Calls `onCorrect` on the right answer;
 * a wrong tap shakes softly, says which number it was and calls `onWrong`.
 */
export function answerButtons(
  api: ActivityApi,
  correct: number,
  opts: { left: number; top: number; row?: boolean; size?: number; min?: number; max?: number; dots?: boolean; onWrong?: (fails: number) => void; onCorrect: () => void },
) {
  const size = opts.size ?? 150;
  const wrap = h('div', { class: opts.row ? 'answers row' : 'answers', style: box(opts.left, opts.top) });
  let fails = 0;
  let done = false;
  for (const n of choices(correct, 3, opts.min ?? 0, opts.max ?? 10)) {
    wrap.append(
      numberButton(
        n,
        (b) => {
          if (done) return;
          if (n === correct) {
            done = true;
            b.classList.add('right');
            opts.onCorrect();
          } else {
            fails++;
            flash(b, 'shake');
            api.fail();
            void api.say(`To je ${numWord(n)}. Zkus to ještě jednou.`).then(() => opts.onWrong?.(fails));
          }
        },
        size,
        opts.dots ?? true,
      ),
    );
  }
  api.layer.append(wrap);
  return wrap;
}

/** Number the given positions one by one while counting aloud (help after mistakes). */
export async function countAloud(api: ActivityApi, parent: HTMLElement, pts: P[], offset: P = { x: 0, y: 0 }) {
  const badges: HTMLElement[] = [];
  for (let i = 0; i < pts.length; i++) {
    const b = h('div', { class: 'count-badge pop', style: { left: `${pts[i].x + offset.x}px`, top: `${pts[i].y + offset.y}px` } }, String(i + 1));
    parent.append(b);
    badges.push(b);
    countSound(i + 1);
    await api.say(numWord(i + 1));
    await wait(150);
  }
  return badges;
}

export const count: Activity<{ n: number }> = (api, { n }) => {
  const kind: ItemKind = pick(theme().items);
  const c = card(240, 140, 600, 560);
  const size = n <= 5 ? 130 : 100;
  const pts = placeItems(n, 600, 560, size);
  c.append(frag(`<svg width="600" height="560" viewBox="0 0 600 560" aria-hidden="true">${pts.map((p) => itemGroup(kind, p.x, p.y, size / 40, randInt(-25, 25))).join('')}</svg>`));
  crossable(c, pts, size, api.ink);
  api.layer.append(c);
  answerButtons(api, n, {
    left: 880,
    top: 150,
    dots: false,
    onCorrect: () => {
      recordResult('other', n, true);
      api.success();
    },
    onWrong: (fails) => {
      if (fails === 2) void countAloud(api, c, pts, { x: -22, y: -60 });
    },
  });
  void api.instruct(`Kolik je tu ${ITEM_NAMES[kind].many}? Spočítané si můžeš ťuknutím přeškrtnout. Pak ťukni na správné číslo.`);
};

const SPOTS: P[] = [
  { x: 50, y: 150 },
  { x: 175, y: 160 },
  { x: 0, y: 270 },
  { x: 115, y: 280 },
  { x: 230, y: 270 },
];

function meadowScene(left: number, ponies: number[], doorOpen: boolean, question: boolean, label: string) {
  const c = h('div', { class: 'scene-card', style: box(left, 128, 490, 430) });
  c.append(
    frag(`<svg width="474" height="414" viewBox="0 0 474 414" style="position:absolute;inset:0" role="img" aria-label="${label}">
      <path d="M0,250 C120,232 300,244 474,236 L474,414 L0,414 Z" fill="#DCE3C4"/>
      <image href="${theme().home.art}" x="300" y="110" width="190" height="177"/>
      ${question ? `<circle cx="395" cy="250" r="26" fill="#FFFFFF"/><text x="395" y="252" text-anchor="middle" dominant-baseline="central" font-family="Andika, system-ui, sans-serif" font-weight="700" font-size="40" fill="#B4513A">?</text>` : ''}</svg>`),
  );
  void doorOpen;
  for (const i of ponies) c.append(h('img', { src: theme().full, alt: '', style: { ...box(SPOTS[i].x + 22, SPOTS[i].y - 30, 92, 130) } }));
  crossable(c, ponies.map((i) => ({ x: SPOTS[i].x + 68, y: SPOTS[i].y + 35 })), 100, store.settings.ink);
  return c;
}

/** "How many hid?" — the same meadow twice: all horses, then some went into the stable. */
export const hide: Activity<{ total: number; hidden: number }> = (api, { total, hidden }) => {
  const all = shuffle([0, 1, 2, 3, 4]).slice(0, total).sort();
  // The horses nearest the stable are the ones that walk in.
  const stay = all.slice().sort((a, b) => SPOTS[a].x + SPOTS[a].y * 0.2 - (SPOTS[b].x + SPOTS[b].y * 0.2)).slice(0, total - hidden);
  const t = theme();
  const forms = t.animal.plural;
  api.layer.append(meadowScene(50, all, true, false, `Na louce je ${total} ${forms.many}`));
  api.layer.append(frag(`<svg width="100" height="70" viewBox="0 0 100 70" style="position:absolute;left:540px;top:308px" aria-hidden="true"><path d="M14,35 H78 M60,17 L80,35 L60,53" fill="none" stroke="#20150E" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  api.layer.append(meadowScene(640, stay, false, true, `Na louce zůstalo ${total - hidden} ${plural(total - hidden, forms)}`));
  answerButtons(api, hidden, {
    left: 590 - (3 * 136 + 2 * 40) / 2,
    top: 600,
    row: true,
    dots: false,
    size: 136,
    min: 1,
    max: Math.max(3, total),
    onCorrect: () => {
      recordResult('other', hidden, true);
      api.success();
    },
  });
  const few = total >= 2 && total <= 4;
  const verb = t.meadow[few ? 0 : 1];
  void api.instruct(`Na louce ${verb} ${total} ${plural(total, forms)}. Pak ${fem(t) ? 'některé odešly' : 'někteří odešli'} ${t.home.acc}. Kolik se jich schovalo?`);
};
