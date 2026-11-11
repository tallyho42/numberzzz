import { h } from '../core/dom';
import { store, save, stat, resetProgress, DIGIT_ORDER } from '../core/progress';
import { ACTIVITY_LABELS, sampleScreen } from '../core/session';
import { hasCzechVoice } from '../core/voice';
import type { ScreenSpec } from '../activities/types';

/** Parent screen (text allowed here): settings, stats, stroke log export and an activity tester. */
export function parentScreen(stage: HTMLElement, opts: { close: () => void; tryScreen: (s: ScreenSpec) => void }) {
  stage.innerHTML = '';
  const root = h('div', { class: 'parent' });
  stage.append(root);
  const render = () => {
    root.innerHTML = '';
    const s = store.settings;
    const seg = <T extends number>(values: T[], cur: T, label: (v: T) => string, set: (v: T) => void) =>
      h('div', { class: 'seg' }, ...values.map((v) => h('button', { class: v === cur ? 'on' : '', onClick: () => { set(v); save(); render(); } }, label(v))));

    const header = h('div', { class: 'p-head' }, h('h1', {}, 'Pro rodiče'), h('button', { class: 'p-close', 'aria-label': 'Zavřít', onClick: opts.close }, '✕'));

    const length = h('section', {}, h('h2', {}, 'Délka hraní'), seg([15, 30, 45] as (15 | 30 | 45)[], s.minutes, (v) => `${v} min`, (v) => (s.minutes = v)));

    const tol = h('input', { type: 'range', min: '1', max: '5', value: String(s.tolerance), id: 'tol' }) as HTMLInputElement;
    tol.addEventListener('change', () => { s.tolerance = Number(tol.value); save(); render(); });
    const strict = h('section', {}, h('label', { for: 'tol' }, `Přísnost vyhodnocení: ${s.tolerance} / 5`), tol, h('div', { class: 'p-ends' }, h('span', {}, 'Mírná'), h('span', {}, 'Přísná')));

    const chips = h('div', { class: 'chips' }, ...Array.from({ length: 11 }, (_, d) =>
      h('button', {
        class: s.digits.includes(d) ? 'on' : '',
        onClick: () => {
          s.digits = s.digits.includes(d) ? s.digits.filter((x) => x !== d) : [...s.digits, d];
          save();
          render();
        },
      }, String(d)),
    ));
    const digits = h('section', {}, h('h2', {}, 'Čísla, která se učí'), chips, h('p', { class: 'p-note' }, `Pořadí učení: ${DIGIT_ORDER.join(', ')}`));

    const colors = ['#E2558C', '#7B4DD6', '#1F7AE0', '#F28C28'];
    const inkSec = h('section', {}, h('h2', {}, 'Barva inkoustu'), h('div', { class: 'chips' }, ...colors.map((c) =>
      h('button', { class: `swatch ${s.ink === c ? 'on' : ''}`, style: { background: c }, 'aria-label': c, onClick: () => { s.ink = c; save(); render(); } }),
    )));

    const bars = h('div', { class: 'bars' }, ...Array.from({ length: 11 }, (_, d) => {
      const st = stat(d);
      const tries = st.traceOk + st.traceFail + st.writeOk + st.writeFail;
      const rate = tries ? (st.traceOk + st.writeOk) / tries : 0;
      return h('div', { class: 'bar-col', title: `úroveň ${st.level}` },
        h('div', { class: 'bar', style: { height: `${8 + st.level * 22}px`, background: st.level >= 3 ? '#3DAA5C' : st.level >= 1 ? '#F2B400' : '#DCEBD8', opacity: String(0.5 + rate / 2) } }),
        h('span', {}, String(d)));
    }));
    const stats = h('section', {}, h('h2', {}, 'Jak se daří (úroveň 0–4 po číslech)'), bars, h('p', { class: 'p-note' }, `Medaile: ${store.medals} · odehraná sezení: ${store.sessions} · záznamů tahů: ${store.log.length}`));

    const typeSel = h('select', { id: 'act' }, ...Object.entries(ACTIVITY_LABELS).map(([k, v]) => h('option', { value: k }, v))) as HTMLSelectElement;
    const digSel = h('select', { id: 'dig' }, ...Array.from({ length: 11 }, (_, d) => h('option', { value: String(d), selected: d === 3 ? 'selected' : null }, String(d)))) as HTMLSelectElement;
    const tryBtn = h('button', { class: 'p-primary', onClick: () => opts.tryScreen(sampleScreen(typeSel.value as ScreenSpec['type'], Number(digSel.value))) }, 'Vyzkoušet');
    const tester = h('section', {}, h('h2', {}, 'Vyzkoušet aktivitu'), h('div', { class: 'p-row' }, typeSel, digSel, tryBtn), h('p', { class: 'p-note' }, 'Tip: třikrát rychle ťuknout na hvězdičky nahoře = přeskočit obrazovku.'));

    const exportBtn = h('button', {
      onClick: () => {
        const blob = new Blob([JSON.stringify(store.log, null, 1)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `tahy-${new Date().toISOString().slice(0, 10)}.json` });
        document.body.append(a);
        a.click();
        a.remove();
      },
    }, 'Stáhnout záznamy tahů');
    const resetBtn = h('button', { class: 'p-danger', onClick: () => { if (confirm('Opravdu smazat všechen postup a medaile?')) { resetProgress(); render(); } } }, 'Vymazat postup');
    const data = h('section', {}, h('h2', {}, 'Data'), h('div', { class: 'p-row' }, exportBtn, resetBtn),
      h('p', { class: 'p-note' }, hasCzechVoice() ? 'Český hlas: nalezen.' : 'Český hlas nenalezen – v iPadu: Nastavení › Zpřístupnění › Předčítání › Hlasy › Čeština.'));

    root.append(header, h('div', { class: 'p-grid' }, h('div', { class: 'p-col' }, length, strict, digits, inkSec), h('div', { class: 'p-col' }, tester, stats, data)));
  };
  render();
}
