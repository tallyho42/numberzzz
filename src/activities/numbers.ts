import { paintedImg } from '../paint/runtime';
import type { Activity } from './types';
import { h, onTap, frag, box, choices, flash, wait, randInt, pick, shuffle } from '../core/dom';
import { card } from '../core/ui';
import { plural, numWord, numAcc, numNom } from '../core/czech';
import { recordResult, store } from '../core/progress';
import { itemGroup, itemSvg, ITEM_NAMES, dotPattern, ICONS } from '../art/art';
import { chime, count, balloon, rattle } from '../core/sound';
import { theme, giftsIn } from '../themes';
import { toIt } from '../themes/types';
import { answerButtons, countAloud, placeItems } from './choice';
import { crossable } from './cross';

const BALLOON_COLORS = ['#D9617F', '#7FA7C4', '#E2B13F', '#6E9B4C', '#E07B2C', '#8C6BB0'];

/** 1 · Ťukni na číslo: the voice names a number, she taps the balloon with that numeral (no dot hints). */
export const tapnum: Activity<{ n: number }> = (api, { n }) => {
  const nums = choices(n, 4, 1, Math.max(4, store.settings.countMax));
  const colors = shuffle(BALLOON_COLORS);
  let fails = 0;
  let done = false;
  const buttons: HTMLButtonElement[] = [];
  nums.forEach((m, i) => {
    const x = 250 + i * 215;
    const y = 190 + (i % 2) * 60;
    const b = h('button', {
      class: 'balloon',
      'aria-label': `Balónek s číslem ${m}`,
      style: { ...box(x, y, 190, 330), animationDelay: `${i * 0.4}s` },
      html: `<svg width="190" height="330" viewBox="0 0 190 330" aria-hidden="true"><path d="M95,250 q-22,26 0,52 t0,30" fill="none" stroke="#6B5A45" stroke-width="3"/></svg>${paintedImg(`<ellipse cx="95" cy="118" rx="88" ry="108" fill="${colors[i]}"/><path d="M85,224 L105,224 L99,238 L91,238 Z" fill="${colors[i]}"/>`, [0, 0, 190, 330], 190, 330, { angle: 70, zone: 14, edge: 1.5, bristle: 5, grain: 1.3, tone: 0.3 }, 'style="position:absolute;inset:0"')}<span>${m}</span>`,
    });
    onTap(b, () => {
      if (done) return;
      if (m === n) {
        done = true;
        b.classList.add('fly');
        balloon();
        recordResult('other', n, fails < 2);
        setTimeout(() => api.success(), 700);
      } else {
        fails++;
        flash(b, 'shake');
        api.fail();
        void api.say(`To je ${numWord(m)}. Hledáme číslo ${numWord(n)}.`);
        if (fails >= 2) buttons[nums.indexOf(n)].classList.add('hint-glow');
      }
    });
    buttons.push(b);
    api.layer.append(b);
  });
  void api.instruct(`Kde je číslo ${numWord(n)}? Ťukni na balónek.`);
};

/** 2 · Nakrm zvířátko: move exactly n pieces of food into the trough, then tap the tick. */
export const feed: Activity<{ n: number }> = (api, { n }) => {
  const t = theme();
  const food = t.food;
  const name = ITEM_NAMES[food];
  const c = card(330, 130, 810, 560);
  api.layer.append(c);
  const pileCount = Math.min(n + randInt(2, 3), 13);
  const pile = placeItems(pileCount, 330, 470, 82).map((p) => ({ x: p.x + 20, y: p.y + 40 }));
  // Trough on the right with slots in two rows.
  c.append(h('div', { style: { position: 'absolute', left: '360px', top: '200px' }, html: paintedImg('<path d="M10,60 h410 l-34,190 h-342 z" fill="#B07A3F"/><path d="M14,62 h402" stroke="#7E5428" stroke-width="10"/>', [0, 0, 430, 300], 430, 300, { angle: 0, zone: 16, edge: 2, bristle: 8, grain: 1.5, tone: 0.35 }) }));
  const slots = Array.from({ length: 14 }, (_, i) => ({ x: 420 + (i % 7) * 52, y: 300 + Math.floor(i / 7) * 80 }));
  const inTrough: (HTMLButtonElement | null)[] = slots.map(() => null);
  const counter = h('div', { class: 'feed-count', 'aria-live': 'polite' }, '0');
  c.append(counter);
  const update = () => {
    const k = inTrough.filter(Boolean).length;
    counter.textContent = String(k);
    tick.classList.toggle('hidden', k === 0);
    return k;
  };
  pile.forEach((p) => {
    const b = h('button', { class: 'food', 'aria-label': name.one, style: { left: `${p.x - 41}px`, top: `${p.y - 41}px` }, html: itemSvg(food, 82, randInt(-20, 20)) });
    let slot = -1;
    onTap(b, () => {
      if (slot >= 0) {
        inTrough[slot] = null;
        slot = -1;
        b.style.left = `${p.x - 41}px`;
        b.style.top = `${p.y - 41}px`;
        update();
        return;
      }
      const free = inTrough.indexOf(null);
      if (free < 0) return;
      slot = free;
      inTrough[free] = b;
      b.style.left = `${slots[free].x - 41}px`;
      b.style.top = `${slots[free].y - 41}px`;
      const k = update();
      count(k);
      void api.say(numWord(k));
    });
    c.append(b);
  });
  let fails = 0;
  const tick = h('button', { class: 'round-btn tick hidden', 'aria-label': 'Hotovo', style: box(680, 30, 100, 100), html: ICONS.check(60) });
  onTap(tick, async () => {
    const k = update();
    if (k === n) {
      recordResult('other', n, fails < 2);
      await api.say(`Mňam! ${t.animal.Nom} děkuje.`);
      api.success();
    } else {
      fails++;
      api.fail();
      void api.say(`V korýtku ${k >= 2 && k <= 4 ? 'jsou' : 'je'} ${numNom(k, name.g)} ${plural(k, name)}. ${t.animal.Nom} chce ${numAcc(n, name.g)} ${plural(n, name)}.`);
    }
  });
  c.append(tick);
  update();
  void api.instruct(`${t.animal.Nom} má hlad. Dej ${toIt(t)} do korýtka ${numAcc(n, name.g)} ${plural(n, name)}. Pak ťukni na fajfku.`);
};

/** 3 · Kde je víc: two plates, tap the one with more (or fewer). */
export const compare: Activity<{ a: number; b: number; less: boolean }> = (api, { a, b, less }) => {
  const kind = pick(theme().items);
  const name = ITEM_NAMES[kind];
  const want = less ? Math.min(a, b) : Math.max(a, b);
  let fails = 0;
  let done = false;
  const sides: { el: HTMLButtonElement; n: number; pts: { x: number; y: number }[] }[] = [];
  [a, b].forEach((n, i) => {
    const el = h('button', { class: 'card compare-card', 'aria-label': `Obrázek ${i + 1}`, style: box(300 + i * 430, 150, 390, 470) });
    const size = Math.max(n, a, b) <= 5 ? 96 : 76;
    const pts = placeItems(n, 390, 470, size);
    el.append(frag(`<svg width="390" height="470" viewBox="0 0 390 470" aria-hidden="true">${pts.map((p) => itemGroup(kind, p.x, p.y, size / 40, randInt(-20, 20))).join('')}</svg>`));
    crossable(el, pts, size, api.ink);
    onTap(el, async () => {
      if (done) return;
      if (n === want) {
        done = true;
        el.classList.add('picked');
        recordResult('other', Math.max(a, b), fails < 2);
        api.success();
      } else {
        fails++;
        flash(el, 'shake');
        api.fail();
        if (fails === 2) {
          done = true;
          for (const s of sides) {
            await countAloud(api, s.el, s.pts, { x: -22, y: -60 });
            await wait(300);
          }
          done = false;
          void api.say(less ? 'Kde je jich míň?' : 'Kde je jich víc?');
        } else void api.say('Zkus to ještě jednou. Podívej se pořádně.');
      }
    });
    sides.push({ el, n, pts });
    api.layer.append(el);
  });
  void api.instruct(`Kde je ${less ? 'míň' : 'víc'} ${name.many}? Ťukni na obrázek.`);
};

/** 4 · Hod kostkou: roll the die, then tap that many stones to move the animal to the present at the end. */
export const dice: Activity<Record<string, never>> = (api) => {
  const t = theme();
  const STEPS = 10;
  const stones = Array.from({ length: STEPS + 1 }, (_, i) => ({ x: 330 + i * 76, y: 330 + Math.round(70 * Math.sin(i * 0.75)) }));
  let pos = 0;
  let left = 0;
  let rolling = false;
  const stoneEls = stones.map((s, i) => {
    const el = h('button', { class: `stone-btn ${i === 0 ? 'start' : ''}`, 'aria-label': `Kamínek ${i}`, style: box(s.x - 38, s.y - 26, 76, 52) });
    onTap(el, () => step(i));
    api.layer.append(el);
    return el;
  });
  const goal = t.gifts[Math.min(giftsIn(t), t.gifts.length - 1)];
  api.layer.append(h('div', { class: 'dice-goal', style: box(stones[STEPS].x - 40, stones[STEPS].y - 110, 80, 80), html: goal.icon(80) }));
  const token = h('img', { class: 'dice-token', src: t.head, alt: t.animal.Nom, style: box(stones[0].x - 60, stones[0].y - 118, 120, 120) });
  api.layer.append(token);
  const die = h('button', { class: 'die', 'aria-label': 'Kostka', style: box(640, 560, 170, 170), html: dieFace(randInt(1, 6)) });
  api.layer.append(die);
  const mark = () => stoneEls.forEach((el, i) => el.classList.toggle('next', left > 0 && i === pos + 1));

  onTap(die, async () => {
    if (rolling || left > 0) return;
    rolling = true;
    rattle();
    let v = 1;
    for (let k = 0; k < 8; k++) {
      v = randInt(1, 6);
      die.innerHTML = dieFace(v);
      await wait(70 + k * 15);
    }
    left = Math.min(v, STEPS - pos);
    rolling = false;
    await api.say(`Na kostce je ${numWord(v)}. Ťukej na kamínky.`);
    mark();
  });

  let counted = 0;
  function step(i: number) {
    if (left <= 0 || i !== pos + 1) return;
    pos = i;
    left--;
    counted++;
    token.style.left = `${stones[i].x - 60}px`;
    token.style.top = `${stones[i].y - 118}px`;
    stoneEls[i].classList.add('visited');
    count(counted);
    void api.say(numWord(counted));
    mark();
    if (left === 0) {
      counted = 0;
      if (pos >= STEPS) {
        chime();
        void api.say(`${t.animal.Nom} je v cíli!`).then(() => api.success());
      } else setTimeout(() => void api.say('Hoď kostkou znovu.'), 700);
    }
  }
  void api.instruct(`Hodíme kostkou! Ťukni na kostku a pak skákej s ${t.animal.ins} po kamíncích.`);
};

function dieFace(v: number) {
  return `<svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true"><rect x="8" y="8" width="154" height="154" rx="30" fill="#FFFFFF" stroke="#20150E" stroke-width="6"/><g transform="translate(25 25)">${dotPattern(v, 120).replaceAll('#E07B2C', '#20150E')}</g></svg>`;
}

/** 5 · Chybí kamínek: a row of five numbers with one missing; pick the missing one. */
export const missing: Activity<{ start: number; gap: number }> = (api, { start, gap }) => {
  const t = theme();
  const nums = [0, 1, 2, 3, 4].map((i) => start + i);
  const want = nums[gap];
  const xs = nums.map((_, i) => 300 + i * 150);
  const y = 300;
  const holes: HTMLElement[] = nums.map((m, i) => {
    const el = h('div', { class: `num-stone ${i === gap ? 'gap' : ''}`, style: box(xs[i] - 62, y - 62, 124, 124) }, i === gap ? '?' : String(m));
    api.layer.append(el);
    return el;
  });
  const token = h('img', { class: 'dice-token', src: t.head, alt: t.animal.Nom, style: box(110, y - 120, 150, 150) });
  api.layer.append(token);
  answerButtons(api, want, {
    left: 430,
    top: 520,
    row: true,
    size: 140,
    min: 0,
    max: Math.max(5, store.settings.countMax),
    onCorrect: async () => {
      const el = holes[gap];
      el.classList.remove('gap');
      el.textContent = String(want);
      flash(el, 'pop');
      recordResult('other', want, true);
      await wait(300);
      for (let i = 0; i < nums.length; i++) {
        token.style.left = `${xs[i] - 75}px`;
        token.style.top = `${y - 190}px`;
        await api.say(numWord(nums[i]));
      }
      api.success();
    },
  });
  void api.instruct(`Jeden kamínek chybí. Které číslo patří na otazník?`);
};
