import { h, onTap, frag, wait, pick, box } from './core/dom';
import { meadow, topBar, parentCorner, confetti, card, horseGuide, roundButton, goFullscreen, W, H } from './core/ui';
import { say, stop, unlockVoice } from './core/voice';
import { chime, fanfare, unlockSound } from './core/sound';
import { store, save, newSessionId, markSeen } from './core/progress';
import { planSession, sampleScreen, ACTIVITY_LABELS, type Station } from './core/session';
import { praise, digitNoun, withName, hello } from './core/czech';
import { ICONS, HORSE_HEAD, STABLE_ITEMS, medalSvg } from './art/art';
import type { ActivityApi, ScreenSpec } from './activities/types';
import { trace } from './activities/trace';
import { write, fix } from './activities/write';
import { count, flashCount, hide } from './activities/choice';
import { find } from './activities/find';
import { match } from './activities/match';
import { dots } from './activities/dots';
import { draw } from './activities/draw';
import { color } from './activities/color';
import { stableScreen } from './screens/stable';
import { parentScreen } from './screens/parent';

let stage: HTMLElement;
/** Bumped whenever we navigate away; stale async flows check it and stop. */
let nav = 0;

export function initApp(root: HTMLElement) {
  stage = root;
  // Development shortcut: #zkus=trace-3 opens one activity directly.
  const m = /^#zkus=([a-z]+)-(\d+)$/.exec(location.hash);
  if (m && m[1] in ACTIVITY_LABELS) void runSingle(sampleScreen(m[1] as ScreenSpec['type'], Number(m[2])));
  else if (location.hash === '#zkus=medaile') medal();
  else if (location.hash === '#zkus=staj') showStable();
  else if (location.hash === '#zkus=rodice') openParent();
  else home();
}

function reset(): number {
  stop();
  stage.innerHTML = '';
  return ++nav;
}

function openParent() {
  parentScreen(stage, {
    close: home,
    tryScreen: (spec) => void runSingle(spec),
  });
  nav++;
  stop();
}

export function home() {
  reset();
  stage.append(meadow());
  stage.append(h('img', { src: HORSE_HEAD, alt: 'Koník', class: 'guide bob', style: { position: 'absolute', left: '120px', bottom: '-10px', width: '460px', height: '460px' } }));
  const play = h('button', { class: 'play-btn', 'aria-label': 'Hrát', html: ICONS.play(110) });
  onTap(play, () => {
    goFullscreen();
    unlockVoice();
    unlockSound();
    void runSession();
  });
  stage.append(h('div', { style: box(660, 250) }, play));
  const stable = roundButton(ICONS.barn(60), 'Koníkova stáj', () => {
    goFullscreen();
    unlockVoice();
    unlockSound();
    showStable();
  }, 110);
  stable.style.position = 'absolute';
  stable.style.left = '960px';
  stable.style.top = '640px';
  stage.append(stable);
  stage.append(h('div', { class: 'medal-count', style: box(40, 32) }, h('span', { html: medalSvg(48) }), h('b', {}, String(store.medals))));
  stage.append(parentCorner(openParent));
}

function showStable() {
  reset();
  stableScreen(stage, home);
  stage.append(parentCorner(openParent));
  void say(`${hello('Ahoj')} ${store.medals ? 'Tohle je koníkova stáj. Za každou tvoji medaili dostane koník dárek.' : 'Tohle je koníkova stáj. Za medaile tu budou dárky pro koníka.'}`);
}

const ACTIVITIES: Record<ScreenSpec['type'], (api: ActivityApi, spec: any) => void | (() => void)> = {
  trace,
  write,
  fix,
  count,
  match,
  dots,
  find,
  draw,
  color,
  flash: flashCount,
  hide,
};

interface ScreenResult {
  ok: boolean;
  fails: number;
}

/** Run one activity screen inside the meadow scene with the top bar. */
function runScreen(spec: ScreenSpec, starIndex: number, starTotal: number, my: number): Promise<ScreenResult> {
  return new Promise((resolve) => {
    stage.innerHTML = '';
    stage.append(meadow());
    const layer = h('div', { class: 'layer' });
    stage.append(layer);
    let lastInstruction = '';
    let fails = 0;
    let finished = false;
    let cleanup: void | (() => void);
    const finish = async (ok: boolean) => {
      if (finished || my !== nav) return;
      finished = true;
      if (ok) {
        chime();
        bar.starDone(starIndex);
        await say(praise());
        await wait(500);
      }
      cleanup?.();
      if (my === nav) resolve({ ok, fails });
    };
    const bar = topBar(
      () => void say(lastInstruction),
      () => void finish(false),
    );
    bar.setStars(starIndex, starTotal);
    stage.append(bar.el, parentCorner(openParent));
    const api: ActivityApi = {
      layer,
      ink: store.settings.ink,
      instruct: (t) => {
        lastInstruction = t;
        return say(t);
      },
      say,
      success: () => void finish(true),
      fail: () => {
        fails++;
      },
      setUndo: (fn) => bar.setUndo(fn),
    };
    cleanup = ACTIVITIES[spec.type](api, spec);
  });
}

async function stationIntro(st: Station, index: number, total: number, my: number) {
  stage.innerHTML = '';
  stage.append(meadow());
  stage.append(horseGuide(60, -6, 340));
  const path = h('div', { class: 'station-path' });
  for (let i = 0; i < total; i++) path.append(h('div', { class: `stone ${i < index ? 'done' : i === index ? 'now' : ''}` }));
  path.append(h('div', { class: 'stone goal', html: medalSvg(56) }));
  stage.append(path);
  if (st.digit != null) {
    const c = card(520, 220, 360, 420);
    c.append(h('div', { class: 'big-digit' }, String(st.digit)));
    stage.append(c);
  } else {
    const c = card(470, 260, 460, 300);
    c.append(h('div', { class: 'big-digit small' }, '1 2 3'));
    stage.append(c);
  }
  stage.append(parentCorner(openParent));
  const text = st.intro && st.digit != null && index > 0
    ? `${withName('Další zastávka')} Naučíme se psát ${digitNoun(st.digit)}.`
    : st.intro && st.digit != null
    ? `Dnes se naučíme psát ${digitNoun(st.digit)}. A budeme počítat až do ${store.settings.countMax === 5 ? 'pěti' : 'deseti'}.`
    : st.digit != null
      ? `${withName('Další zastávka')} Napíšeme si ${digitNoun(st.digit)} a zase budeme počítat.`
      : `${withName('Další zastávka')} Teď si pohrajeme s čísly.`;
  await say(text);
  if (my !== nav) return;
  await wait(600);
}

async function sticker(index: number, total: number, my: number) {
  if (my !== nav) return;
  const pop = h('div', { class: 'sticker-pop', html: `<svg width="220" height="220" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#FFFFFF" stroke="#E0A800" stroke-width="0.8"/><path d="M12 4.5l2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 16.3l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7z" fill="#FFCC33" stroke="#E0A800" stroke-width="0.6" stroke-linejoin="round"/></svg>` });
  stage.append(pop);
  fanfare();
  await say(index + 1 < total ? `${withName('Zastávka hotová', '!', true)} Tady máš samolepku.` : withName('Poslední zastávka hotová', '!', true));
  await wait(400);
}

async function runSession() {
  const my = reset();
  newSessionId();
  const plan = planSession();
  await say(`${hello('Ahoj')} Jdeme spolu na výlet za čísly.`);
  for (let si = 0; si < plan.length; si++) {
    if (my !== nav) return;
    const st = plan[si];
    if (st.digit != null) markSeen(st.digit);
    await stationIntro(st, si, plan.length, my);
    let streak = 0;
    for (let i = 0; i < st.screens.length; i++) {
      if (my !== nav) return;
      const r = await runScreen(st.screens[i], i, st.screens.length, my);
      streak = r.fails >= 2 ? streak + 1 : 0;
      if (streak >= 3) break; // tired: end this stop early on a good note
    }
    await sticker(si, plan.length, my);
  }
  if (my !== nav) return;
  medal();
}

async function runSingle(spec: ScreenSpec) {
  const my = reset();
  unlockVoice();
  unlockSound();
  await runScreen(spec, 0, 1, my);
  if (my === nav) openParent();
}

function medal() {
  const my = reset();
  store.medals++;
  store.sessions++;
  save();
  const item = STABLE_ITEMS[Math.min(store.medals, STABLE_ITEMS.length) - 1];
  stage.append(meadow());
  const m = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0" role="img" aria-label="Medaile">
    <polygon points="520,250 590,250 560,420 500,380" fill="#4A8FE0"/>
    <polygon points="590,250 660,250 680,380 620,420" fill="#E2558C"/>
    <circle cx="590" cy="470" r="160" fill="#FFCC33" stroke="#E0A800" stroke-width="10"/>
    <circle cx="590" cy="470" r="128" fill="#FFE17A"/>
  </svg>`);
  const medalEl = h('div', { class: 'medal-wrap pop' }, m, h('div', { class: 'medal-face' }, h('img', { src: HORSE_HEAD, alt: '', style: { position: 'absolute', left: '0px', top: '4px', width: '252px', height: '252px' } })));
  stage.append(medalEl);
  confetti(stage, 60);
  fanfare();
  const homeBtn = roundButton(ICONS.home(60), 'Domů', home, 120);
  Object.assign(homeBtn.style, { position: 'absolute', right: '60px', bottom: '50px' });
  const stableBtn = roundButton(ICONS.barn(64), 'Koníkova stáj', showStable, 120);
  Object.assign(stableBtn.style, { position: 'absolute', left: '60px', bottom: '50px' });
  stage.append(homeBtn, stableBtn, parentCorner(openParent));
  // The present she just earned, shown as a picture (it is also in the stable from now on).
  if (item && store.medals <= STABLE_ITEMS.length) {
    stage.append(h('div', { class: 'gift-pop pop', role: 'img', 'aria-label': item.name, html: `<svg width="150" height="150" viewBox="0 0 24 24" aria-hidden="true"><path d="${item.d}" fill="${item.fill}" stroke="${item.stroke}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/></svg>` }));
  }
  void (async () => {
    await say(`${withName('Hotovo', '!', true)} Zasloužíš si medaili.`);
    if (my !== nav) return;
    if (item && store.medals <= STABLE_ITEMS.length) await say(`Koník dostal ${item.name}. Podívej se do stáje.`);
  })();
}
