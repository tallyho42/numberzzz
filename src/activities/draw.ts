import type { Activity } from './types';
import { h, frag, wait } from '../core/dom';
import { card } from '../core/ui';
import { Ink, type Stroke } from '../core/ink';
import { clusterStrokes, insideEllipse, bbox, type P } from '../core/geometry';
import { HORSE_EARLESS } from '../art/art';
import { plural, numWord } from '../core/czech';
import { recordResult, logStrokes } from '../core/progress';
import { pop } from '../core/sound';

const W = 640;
const H = 600;

function counter(n: number, ink: string) {
  const el = h('div', { class: 'counter-card' });
  const big = h('div', { class: 'counter-num' }, String(n));
  const slots = h('div', { class: 'counter-slots', style: { gridTemplateColumns: `repeat(${n > 6 ? 5 : n > 4 ? 3 : n}, minmax(0, 1fr))` } });
  const slotEls = Array.from({ length: n }, () => h('div', { class: 'slot' }));
  slots.append(...slotEls);
  el.append(big, slots);
  return {
    el,
    set(k: number) {
      slotEls.forEach((s, i) => {
        s.classList.toggle('on', i < k);
        s.style.background = i < k ? ink : '';
      });
    },
  };
}

const inZone = (s: Stroke, test: (p: P) => boolean) => s.pts.filter(test).length >= s.pts.length * 0.5;

/** Two ears on fixed spots: one large, clearly marked zone per ear. */
function ears(api: Parameters<Activity<{ n: number }>>[0]) {
  const zones = [
    { cx: 236, cy: 170, rx: 80, ry: 112 },
    { cx: 402, cy: 156, rx: 80, ry: 112 },
  ];
  const c = card(140, 136, W, H);
  const zoneSvg = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0" aria-hidden="true">
    ${zones.map((z, i) => `<ellipse class="zone" data-i="${i}" cx="${z.cx}" cy="${z.cy}" rx="${z.rx}" ry="${z.ry}"/>`).join('')}
  </svg>`);
  const badges = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0;pointer-events:none" aria-hidden="true">
    ${zones.map((z, i) => `<g class="zone-badge" data-i="${i}"><circle cx="${z.cx - 60}" cy="${z.cy - 96}" r="24"/><text x="${z.cx - 60}" y="${z.cy - 94}" text-anchor="middle" dominant-baseline="central" font-family="Andika, sans-serif" font-weight="700" font-size="32">${i + 1}</text></g>`).join('')}
  </svg>`);
  c.append(zoneSvg, h('img', { src: HORSE_EARLESS, alt: 'Koník bez uší', style: { position: 'absolute', left: '20px', top: '40px', width: '560px', height: '560px', pointerEvents: 'none' } }));
  api.layer.append(c);
  const cnt = counter(2, api.ink);
  cnt.el.style.left = '870px';
  cnt.el.style.top = '220px';
  api.layer.append(cnt.el);

  const filled = [false, false];
  let finished = false;
  const update = () => {
    filled.fill(false);
    for (const s of ink.strokes) {
      if (s.alpha < 1) continue;
      zones.forEach((z, i) => {
        if (inZone(s, (p) => insideEllipse(p, z.cx, z.cy, z.rx, z.ry))) filled[i] = true;
      });
    }
    zones.forEach((_, i) => {
      zoneSvg.querySelector(`.zone[data-i="${i}"]`)!.classList.toggle('done', filled[i]);
      badges.querySelector(`.zone-badge[data-i="${i}"]`)!.classList.toggle('done', filled[i]);
    });
    cnt.set(filled.filter(Boolean).length);
  };

  const ink = new Ink(c, W, H, {
    color: api.ink,
    width: 9,
    onEnd: async (s) => {
      const hit = zones.some((z) => inZone(s, (p) => insideEllipse(p, z.cx, z.cy, z.rx, z.ry)));
      if (!hit) ink.paint(s, api.ink, 0.25);
      else pop();
      update();
      if (filled.every(Boolean) && !finished) {
        finished = true;
        ink.enabled = false;
        logStrokes('draw', 2, true, ink.strokes.map((x) => x.pts), { mode: 'ears' });
        await wait(600);
        recordResult('other', 2, true);
        api.success();
      }
    },
  });
  c.append(badges);
  api.setUndo(() => {
    const last = ink.strokes[ink.strokes.length - 1];
    if (last) ink.remove(last);
    update();
  });
  void api.instruct('Dokresli koníkovi dvě uši. Jedno do každého kolečka.');
  return () => ink.destroy();
}

/** Free counting: one big zone above the trough; strokes and dots inside are clustered and counted. */
function trough(api: Parameters<Activity<{ n: number }>>[0], n: number) {
  const zone = { x: 90, y: 150, w: 460, h: 300 };
  const c = card(140, 136, W, H);
  c.append(
    frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0" aria-hidden="true">
      <rect class="zone" x="${zone.x}" y="${zone.y}" width="${zone.w}" height="${zone.h}" rx="56"/>
      <path d="M70,420 L570,420 L520,540 L120,540 Z" fill="#C98B55" stroke="#6B4226" stroke-width="7" stroke-linejoin="round"/>
      <path d="M95,455 L545,455 M108,495 L532,495" stroke="#6B4226" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
      <path d="M150,540 L135,585 M490,540 L505,585" stroke="#6B4226" stroke-width="10" stroke-linecap="round"/>
    </svg>`),
  );
  const badgeLayer = h('div', { style: { position: 'absolute', inset: '0', pointerEvents: 'none' } });
  api.layer.append(c);
  const cnt = counter(n, api.ink);
  cnt.el.style.left = '850px';
  cnt.el.style.top = '200px';
  api.layer.append(cnt.el);

  const inside = (p: P) => p.x >= zone.x && p.x <= zone.x + zone.w && p.y >= zone.y && p.y <= zone.y + 290;
  let timer = 0;
  let finished = false;
  let warned = false;

  const update = () => {
    const strokes = ink.strokes.filter((s) => s.alpha >= 1);
    const groups = clusterStrokes(strokes.map((s) => s.pts), 26);
    badgeLayer.innerHTML = '';
    groups.forEach((g, i) => {
      const b = bbox(g.flatMap((j) => strokes[j].pts));
      badgeLayer.append(h('div', { class: 'count-badge small', style: { left: `${b.maxX + 2}px`, top: `${b.minY - 30}px` } }, String(i + 1)));
    });
    cnt.set(Math.min(groups.length, n));
    return groups.length;
  };

  const ink = new Ink(c, W, H, {
    color: api.ink,
    width: 12,
    onStart: () => clearTimeout(timer),
    onEnd: async (s) => {
      if (!inZone(s, inside)) ink.paint(s, api.ink, 0.25);
      else pop();
      const k = update();
      clearTimeout(timer);
      if (k === n && !finished) {
        timer = window.setTimeout(async () => {
          finished = true;
          ink.enabled = false;
          logStrokes('draw', n, true, ink.strokes.map((x) => x.pts), { mode: 'trough' });
          recordResult('other', n, true);
          api.success();
        }, 1400);
      } else if (k > n && !warned) {
        warned = true;
        api.fail();
        await api.say(`Spočítáme to spolu? Máme jich ${numWord(k)}, ale chtěli jsme ${numWord(n)}. Šipkou můžeš jedno smazat.`);
      }
    },
  });
  c.append(badgeLayer);
  api.setUndo(() => {
    const last = ink.strokes[ink.strokes.length - 1];
    if (last) ink.remove(last);
    warned = false;
    const k = update();
    clearTimeout(timer);
    if (k === n && !finished) {
      timer = window.setTimeout(() => {
        finished = true;
        recordResult('other', n, true);
        api.success();
      }, 1400);
    }
  });
  const word = plural(n, { one: 'zrníčko', few: 'zrníčka', many: 'zrníček' });
  void api.instruct(`Dokresli koníkovi do žlabu ${n === 1 ? 'jedno' : n === 2 ? 'dvě' : numWord(n)} ${word}. Stačí tečky.`);
  return () => {
    clearTimeout(timer);
    ink.destroy();
  };
}

export const draw: Activity<{ n: number }> = (api, { n }) => (n === 2 ? ears(api) : trough(api, n));
