import { h, frag, box } from '../core/dom';
import { roundButton } from '../core/ui';
import { ICONS, HORSE_HEAD, STABLE_ITEMS, medalSvg } from '../art/art';
import { store } from '../core/progress';

/** The horse's stable: one present per medal, worn by the horse or shown on the shelf. */
export function stableScreen(stage: HTMLElement, onHome: () => void) {
  const unlocked = Math.min(store.medals, STABLE_ITEMS.length);
  const bg = h('div', { class: 'wood', style: { position: 'absolute', inset: '0' } });
  bg.append(h('div', { class: 'hay' }));
  stage.append(bg);

  const back = roundButton(ICONS.home(40, '#6B4226'), 'Zpět na začátek', onHome);
  Object.assign(back.style, { position: 'absolute', left: '28px', top: '28px' });
  stage.append(back);
  stage.append(h('div', { class: 'medal-count', style: box(500, 32) }, h('span', { html: medalSvg(48) }), h('b', {}, String(store.medals))));

  const stall = h('div', { class: 'stall' });
  const horse = h('div', { style: { position: 'relative', width: '440px', height: '440px' } });
  horse.append(h('img', { src: HORSE_HEAD, alt: 'Koník', style: { position: 'absolute', inset: '0', width: '440px', height: '440px' } }));
  horse.append(
    frag(`<svg width="440" height="440" viewBox="0 0 240 240" style="position:absolute;inset:0" aria-hidden="true">
      ${unlocked >= 1 ? '<path d="M92,104 L72,92 L74,118 Z M92,104 L112,94 L108,120 Z" fill="#E2558C" stroke="#A8335F" stroke-width="2.5" stroke-linejoin="round"/><circle cx="92" cy="105" r="5" fill="#A8335F"/>' : ''}
      ${unlocked >= 2 ? '<path d="M184,92 l2.6,5.4 5.9,0.8 -4.3,4.1 1,5.9 -5.2,-2.8 -5.2,2.8 1,-5.9 -4.3,-4.1 5.9,-0.8z" fill="#FFCC33" stroke="#E0A800" stroke-width="1.2"/>' : ''}
      ${unlocked >= 3 ? '<path d="M72,198 Q100,214 130,204" fill="none" stroke="#B5442F" stroke-width="5" stroke-linecap="round"/><path d="M93,222 h16 l-2,-3 v-6 a6,6 0 0 0 -12,0 v6z" fill="#FFCC33" stroke="#B88A00" stroke-width="2"/>' : ''}
    </svg>`),
  );
  stall.append(horse);
  stage.append(stall);

  const shelf = h('div', { class: 'shelf' });
  STABLE_ITEMS.forEach((it, i) => {
    const on = i < unlocked;
    shelf.append(
      h('div', {
        class: `shelf-item ${on ? 'on' : ''}`,
        role: 'img',
        'aria-label': on ? it.name : 'zatím zamčeno',
        html: `<svg width="84" height="84" viewBox="0 0 24 24" aria-hidden="true"><path d="${it.d}" fill="${on ? it.fill : 'none'}" stroke="${on ? it.stroke : '#B79B73'}" stroke-width="${on ? 1.2 : 1.4}" ${on ? '' : 'stroke-dasharray="2 2"'} stroke-linejoin="round" stroke-linecap="round"/></svg>`,
      }),
    );
  });
  stage.append(shelf);
}
