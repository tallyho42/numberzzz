import { h, box } from '../core/dom';
import { roundButton, meadow, companion } from '../core/ui';
import { ICONS, medalSvg } from '../art/art';
import { theme, giftsIn, medalsIn } from '../themes';

/** The animal's home (stable, kennel): the animal with every present, and the shelf of all ten. */
export function stableScreen(stage: HTMLElement, onHome: () => void) {
  const t = theme();
  const unlocked = giftsIn(t);
  stage.append(meadow());
  stage.append(h('img', { class: 'home-art', src: t.home.art, alt: t.home.nom, style: box(20, 150, 560, 523) }));
  stage.append(companion(250, 30, 400));

  const back = roundButton(ICONS.home(44), 'Zpět na začátek', onHome, 96);
  Object.assign(back.style, { position: 'absolute', left: '28px', top: '28px' });
  stage.append(back);
  stage.append(h('div', { class: 'medal-count', style: box(500, 32) }, h('span', { html: medalSvg(56) }), h('b', {}, String(medalsIn(t)))));

  const shelf = h('div', { class: 'shelf paper' });
  t.gifts.forEach((g, i) => {
    const on = i < unlocked;
    shelf.append(h('div', { class: `shelf-item ${on ? 'on' : ''}`, role: 'img', 'aria-label': on ? g.name : 'zatím zamčeno', html: on ? g.icon(Math.round(64 + 30 * (g.scale ?? 0.8))) : '' }));
  });
  stage.append(shelf);
}
