import type { Activity, ActivityApi } from './types';
import { h, onTap, frag, box, choices, flash, wait, randInt, pick, shuffle } from '../core/dom';
import { card, numberButton } from '../core/ui';
import { plural, numWord } from '../core/czech';
import { recordResult } from '../core/progress';
import { itemGroup, ITEM_NAMES, HORSE_FULL, BARN_SVG, dotPattern, type ItemKind } from '../art/art';
import { soft } from '../core/sound';
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
  opts: { left: number; top: number; row?: boolean; size?: number; min?: number; max?: number; onWrong?: (fails: number) => void; onCorrect: () => void },
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
            soft();
            flash(b, 'shake');
            api.fail();
            void api.say(`To je ${numWord(n)}. Zkus to ještě jednou.`).then(() => opts.onWrong?.(fails));
          }
        },
        size,
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
    await api.say(numWord(i + 1));
    await wait(150);
  }
  return badges;
}

export const count: Activity<{ n: number }> = (api, { n }) => {
  const kind: ItemKind = pick(['carrot', 'apple', 'horseshoe']);
  const c = card(90, 140, 700, 560);
  const size = n <= 5 ? 130 : 100;
  const pts = placeItems(n, 700, 560, size);
  c.append(frag(`<svg width="700" height="560" viewBox="0 0 700 560" aria-hidden="true">${pts.map((p) => itemGroup(kind, p.x, p.y, size / 40, randInt(-25, 25))).join('')}</svg>`));
  api.layer.append(c);
  answerButtons(api, n, {
    left: 880,
    top: 150,
    onCorrect: () => {
      recordResult('other', n, true);
      api.success();
    },
    onWrong: (fails) => {
      if (fails === 2) void countAloud(api, c, pts, { x: -22, y: -60 });
    },
  });
  void api.instruct(`Kolik je tu ${ITEM_NAMES[kind].many}? Ťukni na správné číslo.`);
};

export const flashCount: Activity<{ n: number }> = (api, { n }) => {
  const c = card(130, 160, 600, 480, 'card glow');
  const pattern = frag(`<svg width="380" height="380" viewBox="0 0 380 380" style="position:absolute;left:110px;top:50px" role="img" aria-label="Tečky">${dotPattern(n, 380)}</svg>`);
  const cover = h('div', { class: 'cover' }, '?');
  c.append(pattern, cover);
  api.layer.append(c);
  let timer = 0;
  const show = async () => {
    clearTimeout(timer);
    cover.classList.remove('on');
    timer = window.setTimeout(() => cover.classList.add('on'), 1500);
  };
  cover.classList.add('on');
  const eye = h('button', { class: 'round-btn', 'aria-label': 'Ukázat ještě jednou', style: { ...box(388, 670, 84, 84) }, html: '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2E6B3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' });
  onTap(eye, () => void show());
  api.layer.append(eye);
  answerButtons(api, n, {
    left: 880,
    top: 150,
    min: 1,
    onCorrect: () => {
      clearTimeout(timer);
      cover.classList.remove('on');
      recordResult('other', n, true);
      api.success();
    },
    onWrong: () => void show(),
  });
  void api.instruct('Dívej se pozorně! Kolik je teček?').then(show);
  return () => clearTimeout(timer);
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
      <path d="M0,250 C120,232 300,244 474,236 L474,414 L0,414 Z" fill="#B6E0AA"/>${BARN_SVG(doorOpen, question)}</svg>`),
  );
  for (const i of ponies) c.append(h('img', { src: HORSE_FULL, alt: '', style: { ...box(SPOTS[i].x, SPOTS[i].y, 130, 114) } }));
  return c;
}

/** "How many hid?" — the same meadow twice: all horses, then some went into the stable. */
export const hide: Activity<{ total: number; hidden: number }> = (api, { total, hidden }) => {
  const all = shuffle([0, 1, 2, 3, 4]).slice(0, total).sort();
  // The horses nearest the stable are the ones that walk in.
  const stay = all.slice().sort((a, b) => SPOTS[a].x + SPOTS[a].y * 0.2 - (SPOTS[b].x + SPOTS[b].y * 0.2)).slice(0, total - hidden);
  api.layer.append(meadowScene(50, all, true, false, `Na louce je ${total} koníků`));
  api.layer.append(frag(`<svg width="100" height="70" viewBox="0 0 100 70" style="position:absolute;left:540px;top:308px" aria-hidden="true"><path d="M14,35 H78 M60,17 L80,35 L60,53" fill="none" stroke="#2E6B3A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  api.layer.append(meadowScene(640, stay, false, true, `Na louce zůstali ${total - hidden} koníci`));
  answerButtons(api, hidden, {
    left: 590 - (3 * 136 + 2 * 40) / 2,
    top: 600,
    row: true,
    size: 136,
    min: 1,
    max: Math.max(3, total),
    onCorrect: () => {
      recordResult('other', hidden, true);
      api.success();
    },
  });
  const forms = { one: 'koník', few: 'koníci', many: 'koníků' };
  const first = total >= 2 && total <= 4 ? `Na louce se pásli ${total} ${plural(total, forms)}.` : `Na louce se páslo ${total} ${plural(total, forms)}.`;
  void api.instruct(`${first} Pak někteří odešli do stáje. Kolik se jich schovalo?`);
};
