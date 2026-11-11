import { h, frag, box } from '../core/dom';
import { roundButton } from '../core/ui';
import { ICONS, medalSvg } from '../art/art';
import { companion } from '../core/ui';
import { theme, giftsIn, medalsIn } from '../themes';

/** The horse's stable: one present per medal, worn by the horse or shown on the shelf. */
export function stableScreen(stage: HTMLElement, onHome: () => void) {
  const t = theme();
  const unlocked = giftsIn(t);
  const bg = h('div', { class: 'wood', style: { position: 'absolute', inset: '0' } });
  bg.append(h('div', { class: 'hay' }));
  stage.append(bg);

  const back = roundButton(ICONS.home(40, '#6B4226'), 'Zpět na začátek', onHome);
  Object.assign(back.style, { position: 'absolute', left: '28px', top: '28px' });
  stage.append(back);
  stage.append(h('div', { class: 'medal-count', style: box(500, 32) }, h('span', { html: medalSvg(48) }), h('b', {}, String(medalsIn(t)))));

  // Every present is visible in the picture: worn ones on the animal, the rest on the wall or in the trough.
  const stall = h('div', { class: 'stall' });
  const placed = t.gifts.slice(0, unlocked).filter((g) => g.at && !g.worn);
  const scene = placed
    .map((g) => {
      const a = g.at!;
      return `<g transform="translate(${a.x} ${a.y}) rotate(${a.rot ?? 0}) translate(${-a.size / 2} ${-a.size / 2})">${g.icon(a.size)}</g>`;
    })
    .join('');
  stall.append(
    frag(`<svg width="480" height="560" viewBox="0 0 480 560" style="position:absolute;inset:0" aria-hidden="true">
      <rect x="40" y="128" width="110" height="14" rx="7" fill="#8A5A35"/>
      <circle cx="240" cy="40" r="5" fill="#8A5A35"/>
      <path d="M296,478 h170 l-14,64 h-142 z" fill="#B07A45" stroke="#6B4226" stroke-width="5" stroke-linejoin="round"/>
      <path d="M300,486 h162" stroke="#E7D27A" stroke-width="8" stroke-linecap="round"/>
      ${scene}
    </svg>`),
  );
  const animal = companion(20, 8, 440);
  animal.querySelectorAll('.companion-gift').forEach((e) => e.remove());
  stall.append(animal);
  stage.append(stall);

  const shelf = h('div', { class: 'shelf' });
  t.gifts.forEach((g, i) => {
    const on = i < unlocked;
    shelf.append(h('div', { class: `shelf-item ${on ? 'on' : ''}`, role: 'img', 'aria-label': on ? g.name : 'zatím zamčeno', html: on ? g.icon(76) : '' }));
  });
  stage.append(shelf);
}
