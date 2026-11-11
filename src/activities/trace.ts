import type { Activity } from './types';
import { frag, wait, reducedMotion } from '../core/dom';
import { card, horseGuide } from '../core/ui';
import { Ink, type Stroke } from '../core/ink';
import { digitStrokes, digitPathMarkup, digitWidth, FRAME_H } from '../core/digits';
import { dist, pathLength, type P } from '../core/geometry';
import { traceTolerance, recordResult, logStrokes } from '../core/progress';
import { digitNoun, retry } from '../core/czech';

const S = 3; // px per frame unit

/** Follow the expected stroke forward; returns how far along it the child got and how much ink was off. */
export function follow(pts: P[], exp: P[], T: number) {
  const n = exp.length;
  const w = Math.max(6, Math.round(n * 0.12));
  let cur = 0;
  let off = 0;
  for (const p of pts) {
    let best = -1;
    let bd = Infinity;
    const lo = Math.max(0, cur - w);
    const hi = Math.min(n - 1, cur + 3 * w);
    for (let i = lo; i <= hi; i++) {
      const d = dist(p, exp[i]);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    if (bd > T) off++;
    if (bd <= T * 1.6 && best > cur) cur = best;
  }
  return { coverage: cur / (n - 1), off: off / Math.max(1, pts.length) };
}

function arrowMarkup(stroke: P[], cx: number): string {
  const i = Math.min(16, stroke.length - 6);
  const a = stroke[Math.max(0, i - 4)];
  const b = stroke[i + 4];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const t = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  let n = { x: -t.y, y: t.x };
  const p = stroke[i];
  if (n.x * (p.x - cx) + n.y * (p.y - 80) < 0) n = { x: -n.x, y: -n.y };
  const base = { x: p.x + n.x * 11, y: p.y + n.y * 11 };
  const s = { x: base.x - t.x * 8, y: base.y - t.y * 8 };
  const e = { x: base.x + t.x * 8, y: base.y + t.y * 8 };
  const rot = (v: P, ang: number) => ({ x: v.x * Math.cos(ang) - v.y * Math.sin(ang), y: v.x * Math.sin(ang) + v.y * Math.cos(ang) });
  const back = { x: -t.x * 5, y: -t.y * 5 };
  const h1 = rot(back, 0.6);
  const h2 = rot(back, -0.6);
  return `<path d="M${s.x},${s.y} L${e.x},${e.y} M${e.x + h1.x},${e.y + h1.y} L${e.x},${e.y} L${e.x + h2.x},${e.y + h2.y}" fill="none" stroke="#6E9B4C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

export const trace: Activity<{ digit: number; support: 'full' | 'start' }> = (api, { digit, support }) => {
  const fw = digitWidth(digit);
  const cardW = fw * S + 80;
  const cardH = FRAME_H * S + 120;
  const left = cardW > 420 ? 1180 - cardW - 70 : 400;
  const ox = 40;
  const oy = 60;
  const { corridor: T, coverage: COV, offMax } = traceTolerance();
  const strokes = digitStrokes(digit, 1);
  const all = strokes.flat();
  const cx = fw / 2;

  api.layer.append(horseGuide(cardW > 420 ? 20 : 50, 14, cardW > 420 ? 260 : 310));
  const c = card(left, 136, cardW, cardH);
  api.layer.append(c);

  const guide = frag(`<svg width="${fw * S}" height="${FRAME_H * S}" viewBox="0 0 ${fw} ${FRAME_H}" style="position:absolute;left:${ox}px;top:${oy}px;overflow:visible" aria-hidden="true">
    ${support === 'full' ? digitPathMarkup(digit, `fill="none" stroke="#F1EADC" stroke-width="${T * 2}" stroke-linecap="round" stroke-linejoin="round"`) : ''}
    ${digitPathMarkup(digit, `fill="none" stroke="${support === 'full' ? '#B9AE9C' : '#E6DED0'}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 6.5"`)}
    <g class="arrows">${strokes.map((s) => arrowMarkup(s, cx)).join('')}</g>
    <g class="demo"></g>
    ${strokes
      .map(
        (s, i) => `<g class="start ${i === 0 ? 'pulse' : ''}" data-i="${i}" style="transform-origin:${s[0].x}px ${s[0].y}px">
          <circle cx="${s[0].x}" cy="${s[0].y}" r="5.5" fill="#6E9B4C"/>
          ${strokes.length > 1 ? `<text x="${s[0].x - 10}" y="${s[0].y - 6}" font-size="9" font-weight="700" fill="#20150E" font-family="Andika, sans-serif">${i + 1}</text>` : ''}
        </g>`,
      )
      .join('')}
  </svg>`);
  c.append(guide);

  const toFrame = (p: P): P => ({ x: (p.x - ox) / S, y: (p.y - oy) / S });
  let k = 0;
  let fails = 0;
  let sinceDemo = 0;
  let busy = false;
  const results: number[] = [];

  const nearest = (p: P) => {
    let best = Infinity;
    for (const s of all) best = Math.min(best, (s.x - p.x) ** 2 + (s.y - p.y) ** 2);
    return Math.sqrt(best);
  };

  const ink = new Ink(c, cardW, cardH, {
    color: api.ink,
    pointColor: (p) => (nearest(toFrame(p)) > T ? '#F0C3CE' : api.ink),
    onEnd: (s) => void evaluate(s),
  });

  const setActiveDot = () => {
    guide.querySelectorAll('.start').forEach((g) => g.classList.toggle('pulse', Number((g as SVGElement).dataset.i) === k));
  };

  async function demo(i: number) {
    const g = guide.querySelector('.demo')!;
    const pts = strokes[i];
    g.innerHTML = `<polyline fill="none" stroke="#6E9B4C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/><circle r="6" fill="#E2B13F" stroke="#A97E1E" stroke-width="1.5"/>`;
    const line = g.querySelector('polyline')!;
    const dot = g.querySelector('circle')!;
    const dur = reducedMotion() ? 0 : 1400 + pts.length * 6;
    await new Promise<void>((resolve) => {
      const t0 = performance.now();
      const step = (t: number) => {
        const f = dur ? Math.min(1, (t - t0) / dur) : 1;
        const n = Math.max(1, Math.round(f * (pts.length - 1)));
        line.setAttribute('points', pts.slice(0, n + 1).map((p) => `${p.x},${p.y}`).join(' '));
        dot.setAttribute('cx', String(pts[n].x));
        dot.setAttribute('cy', String(pts[n].y));
        if (f < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    await wait(700);
    g.innerHTML = '';
  }

  async function evaluate(s: Stroke) {
    if (busy) return void ink.remove(s);
    const pts = s.pts.map(toFrame);
    if (pts.length < 3 || pathLength(pts) < 10) return void ink.remove(s); // a stray tap
    const exp = strokes[k];
    const startOk = dist(pts[0], exp[0]) <= T * 1.8;
    const f = follow(pts, exp, T);
    const ok = startOk && f.coverage >= COV && f.off <= offMax;
    logStrokes('trace', digit, ok, [s.pts], { stroke: k, startOk, coverage: f.coverage, off: f.off, tolerance: T });
    if (ok) {
      ink.paint(s, api.ink);
      results.push(f.coverage * (1 - f.off));
      k++;
      if (k >= strokes.length) {
        ink.enabled = false;
        recordResult('trace', digit, fails <= 1);
        api.success(results.reduce((a, b) => a + b, 0) / results.length);
        return;
      }
      setActiveDot();
      void api.say('A teď druhou čáru. Zase od zelené tečky.');
      return;
    }
    busy = true;
    fails++;
    sinceDemo++;
    api.fail();
    void ink.fade(s);
    if (sinceDemo >= 2) {
      sinceDemo = 0;
      await api.say('Podívej, ukážu ti to.');
      await demo(k);
      void api.say('Teď ty.');
    } else if (!startOk) {
      await api.say('Začni u zelené tečky.');
    } else {
      await api.say(retry());
    }
    busy = false;
  }

  const multi = strokes.length > 1 ? ' Má dvě čáry, nejdřív tu s jedničkou.' : '';
  void api.instruct(
    support === 'full'
      ? `Obtáhni ${digitNoun(digit)}. Začni u zelené tečky a jeď podle šipky.${multi}`
      : `Ještě jednou ${digitNoun(digit)}, teď už skoro bez teček. Začni u zelené tečky.${multi}`,
  );

  return () => ink.destroy();
};
