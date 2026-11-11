import { theme } from '../themes';
import type { Activity, ActivityApi } from './types';
import { h, frag, wait, reducedMotion } from '../core/dom';
import { card, horseGuide, companion } from '../core/ui';
import { Ink } from '../core/ink';
import { digitStrokes, digitPathMarkup, digitWidth, FRAME_H } from '../core/digits';
import { pathLength } from '../core/geometry';
import { judgeWriting } from '../core/recognizer';
import { writeLeniency, recordResult, logStrokes } from '../core/progress';
import { digitNoun, retry } from '../core/czech';
import { ICONS } from '../art/art';

/** Animate the correct digit inside an SVG group (used as a hint). */
async function animateDigit(g: SVGGElement, digit: number) {
  const strokes = digitStrokes(digit, 1);
  g.innerHTML = '';
  for (const pts of strokes) {
    const line = frag<SVGPolylineElement>(`<svg xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="#6E9B4C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/></svg>`).firstElementChild as SVGPolylineElement;
    g.append(line);
    const dur = reducedMotion() ? 0 : 1200 + pts.length * 5;
    await new Promise<void>((resolve) => {
      const t0 = performance.now();
      const step = (t: number) => {
        const f = dur ? Math.min(1, (t - t0) / dur) : 1;
        const n = Math.max(1, Math.round(f * (pts.length - 1)));
        line.setAttribute('points', pts.slice(0, n + 1).map((p) => `${p.x},${p.y}`).join(' '));
        if (f < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  await wait(900);
  g.innerHTML = '';
}

function writingPad(api: ActivityApi, digit: number, host: HTMLElement, cardW: number, cardH: number, ox: number, oy: number, S: number, onDone: () => void) {
  const fw = digitWidth(digit);
  const first = digitStrokes(digit, 1)[0][0];
  host.append(h('div', { class: 'dashed-frame' }));
  const overlay = frag(`<svg width="${fw * S}" height="${FRAME_H * S}" viewBox="0 0 ${fw} ${FRAME_H}" style="position:absolute;left:${ox}px;top:${oy}px;overflow:visible" aria-hidden="true">
    <g class="hint"></g><g class="demo"></g>
    <circle cx="${first.x}" cy="${first.y}" r="${16 / S}" fill="#6E9B4C"/>
  </svg>`);
  host.append(overlay);
  const hint = overlay.querySelector('.hint') as SVGGElement;
  const demoG = overlay.querySelector('.demo') as SVGGElement;

  let timer = 0;
  let fails = 0;
  let busy = false;

  const ink = new Ink(host, cardW, cardH, {
    color: api.ink,
    onStart: () => clearTimeout(timer),
    onEnd: () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => void evaluate(), 1600);
    },
  });

  async function evaluate() {
    if (busy) return;
    const strokes = ink.strokes.map((s) => s.pts);
    const total = strokes.reduce((a, s) => a + pathLength(s), 0);
    if (total < 40) {
      ink.clear();
      return;
    }
    busy = true;
    ink.enabled = false;
    const { verdict, matches } = judgeWriting(strokes, digit, writeLeniency());
    logStrokes('write', digit, verdict === 'ok', strokes, { verdict, top: matches.slice(0, 3) });
    if (verdict === 'ok') {
      recordResult('write', digit, true);
      onDone();
      return;
    }
    recordResult('write', digit, false);
    api.fail();
    fails++;
    if (verdict === 'mirror') {
      await api.say(`Skoro! Ale ${digitNoun(digit)} se otáčí na druhou stranu. Podívej.`);
      ink.clear();
      await animateDigit(demoG, digit);
    } else if (fails >= 2) {
      await api.say('Pomůžu ti. Podívej, jak se píše.');
      ink.clear();
      await animateDigit(demoG, digit);
      hint.innerHTML = digitPathMarkup(digit, 'fill="none" stroke="#E3DACB" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 6.5"');
    } else {
      await api.say(retry());
      await Promise.all(ink.strokes.map((s) => ink.fade(s)));
    }
    ink.clear();
    ink.enabled = true;
    busy = false;
  }

  return () => {
    clearTimeout(timer);
    ink.destroy();
  };
}

function successCheck(layer: HTMLElement, left: number, top: number) {
  layer.append(h('div', { class: 'check-badge pop', style: { left: `${left}px`, top: `${top}px` }, html: ICONS.check() }));
}

export const write: Activity<{ digit: number }> = (api, { digit }) => {
  const S = 3;
  const fw = digitWidth(digit);
  const cardW = fw * S + 80;
  const cardH = FRAME_H * S + 120;
  const left = cardW > 420 ? 1180 - cardW - 70 : 400;
  api.layer.append(horseGuide(cardW > 420 ? 20 : 50, 14, cardW > 420 ? 260 : 310));
  const c = card(left, 136, cardW, cardH);
  api.layer.append(c);
  const cleanup = writingPad(api, digit, c, cardW, cardH, 40, 60, S, () => {
    successCheck(api.layer, cardW > 420 ? left - 200 : 880, 300);
    api.success();
  });
  void api.instruct(`Teď napiš ${digitNoun(digit)} sama. Začni u zelené tečky.`);
  return cleanup;
};

/** "Fix the horse": the horse wrote the digit mirrored, the child writes it correctly. */
export const fix: Activity<{ digit: number }> = (api, { digit }) => {
  const S = 2.6;
  api.layer.append(companion(10, 14, 330));
  api.layer.append(h('div', { class: 'bubble', style: { left: '230px', bottom: '300px' } }, '?'));
  const horseCard = card(340, 150, 300, 470, 'card horse-card');
  const fw = digitWidth(digit);
  horseCard.append(
    frag(`<svg width="220" height="352" viewBox="0 0 ${fw} ${FRAME_H}" style="position:absolute;left:40px;top:59px" role="img" aria-label="Obrácená číslice">
      <g transform="translate(${fw},0) scale(-1,1)">${digitPathMarkup(digit, 'fill="none" stroke="#8A5A35" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"')}</g>
    </svg>`),
  );
  api.layer.append(horseCard);
  api.layer.append(frag(`<svg width="90" height="60" viewBox="0 0 90 60" style="position:absolute;left:660px;top:355px" aria-hidden="true"><path d="M8,30 H72 M56,14 L74,30 L56,46" fill="none" stroke="#20150E" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`));
  const cardW = 340;
  const cardH = 500;
  const c = card(770, 136, cardW, cardH);
  api.layer.append(c);
  const cleanup = writingPad(api, digit, c, cardW, cardH, (cardW - 100 * S) / 2, (cardH - FRAME_H * S) / 2, S, () => {
    void api.say('Děkuju! Teď už to vím.');
    api.success();
  });
  void api.instruct(`${theme().animal.Nom} napsal ${digitNoun(digit)}, ale nějak se mu to popletlo. Napiš mu ji správně.`);
  return cleanup;
};
