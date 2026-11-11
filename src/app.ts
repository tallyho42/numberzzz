import { h, onTap, frag, wait, pick, box } from './core/dom';
import { meadow, topBar, parentCorner, confetti, card, companion, roundButton, goFullscreen, W, H } from './core/ui';
import { say, stop, unlockVoice } from './core/voice';
import { chime, fanfare, unlockSound } from './core/sound';
import { store, save, newSessionId, markSeen } from './core/progress';
import { planSession, sampleScreen, ACTIVITY_LABELS, type Station } from './core/session';
import { praise, digitNoun, withName, hello } from './core/czech';
import { ICONS, medalSvg } from './art/art';
import { THEMES, theme, setTheme, medalsIn, completed, awardMedal } from './themes';
import type { ActivityApi, ScreenSpec } from './activities/types';
import { trace } from './activities/trace';
import { write, fix } from './activities/write';
import { count, hide } from './activities/choice';
import { tapnum, feed, compare, dice, missing } from './activities/numbers';
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
  stage.append(companion(110, -10, 470, 'bob'));
  stage.append(themePicker());
  const play = h('button', { class: 'play-btn', 'aria-label': 'Hrát', html: ICONS.play(110) });
  onTap(play, () => {
    goFullscreen();
    unlockVoice();
    unlockSound();
    void runSession();
  });
  stage.append(h('div', { style: box(660, 250) }, play));
  const stable = roundButton(ICONS.barn(60), `Domeček – ${theme().home.nom}`, () => {
    goFullscreen();
    unlockVoice();
    unlockSound();
    showStable();
  }, 110);
  stable.style.position = 'absolute';
  stable.style.left = '960px';
  stable.style.top = '640px';
  stage.append(stable);
  stage.append(h('div', { class: 'medal-count', style: box(1000, 40) }, h('span', { html: medalSvg(48) }), h('b', {}, String(medalsIn()))));
  stage.append(parentCorner(openParent));
}

/** Theme switch on the home screen: one round button per animal; a finished theme gets a gold tick. */
function themePicker(): HTMLElement {
  const wrap = h('div', { class: 'theme-picker' });
  for (const t of THEMES) {
    const on = t.id === theme().id;
    const b = h('button', { class: `theme-btn ${on ? 'on' : ''}`, 'aria-label': `Téma ${t.animal.nom}`, onClick: () => {
      if (on) return;
      setTheme(t.id);
      unlockVoice();
      home();
      void say(`${hello('Ahoj')} Teď budeme sbírat dárky pro ${t.animal.gen}.`);
    } }, h('img', { src: t.head, alt: '' }));
    if (completed(t)) b.append(h('span', { class: 'theme-done', html: ICONS.check(30, '#FFFFFF') }));
    wrap.append(b);
  }
  return wrap;
}

function showStable() {
  reset();
  stableScreen(stage, home);
  stage.append(parentCorner(openParent));
  const t = theme();
  void say(`${hello('Ahoj')} Tohle je ${t.animal.gen === 'koníka' ? 'koníkova' : 'pejskova'} ${t.home.nom}. ${medalsIn() ? `Za každou tvoji medaili dostane ${t.animal.nom} dárek.` : `Za medaile tu budou dárky pro ${t.animal.gen}.`}`);
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
  hide,
  tapnum,
  feed,
  compare,
  dice,
  missing,
};

interface ScreenResult {
  ok: boolean;
  fails: number;
}

/** Run one activity screen inside the meadow scene with the top bar. */
function runScreen(spec: ScreenSpec, starIndex: number, steps: ('w' | 'c')[], my: number): Promise<ScreenResult> {
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
    if (steps.length > 1) bar.setSteps(starIndex, steps);
    else bar.setStars(0, 1);
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
    // The animal with its presents is on every screen.
    if (!layer.querySelector('.companion')) layer.prepend(companion(-10, -8, 220));
  });
}

const stepKinds = (st: Station) => st.screens.map((s) => (s.type === 'trace' || s.type === 'write' || s.type === 'fix' ? 'w' : 'c') as 'w' | 'c');

/** Start of a medal path: the digit to write, the path of eight dots and the medal at its end. */
async function pathIntro(st: Station, index: number, my: number) {
  stage.innerHTML = '';
  stage.append(meadow());
  stage.append(companion(40, -6, 340));
  const bar = topBar(() => {}, () => {});
  bar.setSteps(-1, stepKinds(st));
  bar.el.querySelector<HTMLElement>('.round-btn')?.style.setProperty('visibility', 'hidden');
  stage.append(bar.el);
  const c = card(560, 200, 360, 420);
  c.append(h('div', { class: 'big-digit' }, String(st.digit)));
  stage.append(c, parentCorner(openParent));
  const t = theme();
  const text = index === 0
    ? `Jdeme pro medaili! ${st.intro ? 'Naučíme se psát' : 'Budeme psát'} ${digitNoun(st.digit)} a budeme počítat. Za medaili dostane ${t.animal.nom} dárek.`
    : `${withName('Další medaile čeká')} Teď budeme psát ${digitNoun(st.digit)}.`;
  await say(text);
  if (my !== nav) return;
  await wait(500);
}

async function runSession() {
  const my = reset();
  newSessionId();
  const plan = planSession();
  await say(`${hello('Ahoj')} Jdeme spolu na výlet za čísly.`);
  for (let pi = 0; pi < plan.length; pi++) {
    if (my !== nav) return;
    const st = plan[pi];
    markSeen(st.digit);
    await pathIntro(st, pi, my);
    const steps = stepKinds(st);
    let streak = 0;
    for (let i = 0; i < st.screens.length; i++) {
      if (my !== nav) return;
      const r = await runScreen(st.screens[i], i, steps, my);
      streak = r.fails >= 2 ? streak + 1 : 0;
      // Tired: skip the remaining counting and finish the path with the writing.
      if (streak >= 3 && i < st.screens.length - 2) {
        i = st.screens.length - 2;
        streak = 0;
      }
    }
    if (my !== nav) return;
    const more = pi + 1 < plan.length;
    await medal(more);
    if (!more) store.sessions++, save();
  }
}

async function runSingle(spec: ScreenSpec) {
  const my = reset();
  unlockVoice();
  unlockSound();
  await runScreen(spec, 0, [], my);
  if (my === nav) openParent();
}

/** Medal for a finished path and the present it unlocks. With `more`, a play button continues the session. */
function medal(more = false): Promise<void> {
  return new Promise((resolve) => {
    const my = reset();
    const t = theme();
    const gift = awardMedal();
    stage.append(meadow());
    const m = frag(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;inset:0" role="img" aria-label="Medaile">
      <polygon points="520,250 590,250 560,420 500,380" fill="#4A8FE0"/>
      <polygon points="590,250 660,250 680,380 620,420" fill="#E2558C"/>
      <circle cx="590" cy="470" r="160" fill="#FFCC33" stroke="#E0A800" stroke-width="10"/>
      <circle cx="590" cy="470" r="128" fill="#FFE17A"/>
    </svg>`);
    const medalEl = h('div', { class: 'medal-wrap pop' }, m, h('div', { class: 'medal-face' }, h('img', { src: t.head, alt: '', style: { position: 'absolute', left: '0px', top: '4px', width: '252px', height: '252px' } })));
    stage.append(medalEl);
    confetti(stage, 60);
    fanfare();
    if (gift) stage.append(h('div', { class: 'gift-pop pop', role: 'img', 'aria-label': gift.name, html: gift.icon(150) }));
    const stableBtn = roundButton(ICONS.barn(64), `Domeček – ${t.home.nom}`, () => { resolve(); showStable(); }, 120);
    Object.assign(stableBtn.style, { position: 'absolute', left: '60px', bottom: '50px' });
    if (more) {
      const next = h('button', { class: 'play-btn small', 'aria-label': 'Pokračovat', html: ICONS.play(70) });
      onTap(next, () => resolve());
      stage.append(h('div', { style: box(990, 640) }, next));
    } else {
      const homeBtn = roundButton(ICONS.home(60), 'Domů', () => { resolve(); home(); }, 120);
      Object.assign(homeBtn.style, { position: 'absolute', right: '60px', bottom: '50px' });
      stage.append(homeBtn, stableBtn);
    }
    stage.append(parentCorner(openParent));
    void (async () => {
      await say(`${withName('Hotovo', '!', true)} Zasloužíš si medaili.`);
      if (my !== nav) return;
      if (gift) await say(`${t.animal.Nom} dostal ${gift.name}.${more ? '' : ` Podívej se ${t.home.acc}.`}`);
      else await say(`${t.animal.Nom} už má všechny dárky! Můžeš si vybrat nové zvířátko.`);
      if (my === nav && more) await say('Jdeme dál?');
    })();
  });
}
