import { h, box } from '../core/dom';
import { roundButton, meadow, companion, wornSvgs } from '../core/ui';
import { ICONS, medalSvg } from '../art/art';
import { theme, giftsIn, medalsIn, placement, place, type Theme } from '../themes';
import { artUrl, type Critter } from '../core/critter';
import { pop, whoosh } from '../core/sound';

const ANIMAL_H = 400;

/** Alpha masks of the animal's painted parts, to tell where a present was dropped (head, body or beside it). */
function masks(t: Theme) {
  const parts = t.critter.parts;
  const data: Partial<Record<string, ImageData>> = {};
  const W = 190;
  const Hh = Math.round((W * t.critter.vb[3]) / t.critter.vb[2]);
  for (const p of parts) {
    const img = new Image();
    img.src = artUrl(`${t.critter.id}-${p}`);
    img.decode().then(() => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = Hh;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, W, Hh);
      try {
        data[p] = ctx.getImageData(0, 0, W, Hh);
      } catch {
        /* unreadable: fall back to the box test */
      }
    }).catch(() => {});
  }
  const at = (p: string, fx: number, fy: number) => {
    const d = data[p];
    if (!d) return false;
    const x = Math.round(fx * W);
    const y = Math.round(fy * Hh);
    if (x < 0 || y < 0 || x >= W || y >= Hh) return false;
    return d.data[(y * W + x) * 4 + 3] > 80;
  };
  /** On the part or close to it (so a crown just above the head still counts). */
  const near = (p: string, fx: number, fy: number) => {
    for (const r of [0.05, 0.1, 0.14])
      for (let a = 0; a < 12; a++) if (at(p, fx + Math.cos((a * Math.PI) / 6) * r, fy + Math.sin((a * Math.PI) / 6) * r * 0.7)) return true;
    return at(p, fx, fy);
  };
  return (fx: number, fy: number): 'head' | 'body' | null => {
    if (!Object.keys(data).length) return fx > 0 && fx < 1 && fy > 0 && fy < 1 ? (fy < 0.5 ? 'head' : 'body') : null;
    if (at('front', fx, fy)) return 'body';
    if (['head', 'earL', 'earR'].some((p) => at(p, fx, fy))) return 'head';
    if (['body', 'tail'].some((p) => at(p, fx, fy))) return 'body';
    if (['head', 'earL', 'earR'].some((p) => near(p, fx, fy))) return 'head';
    if (['body', 'tail', 'front'].some((p) => near(p, fx, fy))) return 'body';
    return null;
  };
}

/**
 * The animal's home (stable, kennel…): the animal with its presents and the shelf of all eight.
 * Presents are dragged from the shelf to the animal: treats get eaten, accessories stay where
 * they are put (and are shown on every screen). Worn accessories can be picked up and moved;
 * dropped away from the animal they come off.
 */
export function stableScreen(stage: HTMLElement, onHome: () => void) {
  const t = theme();
  const unlocked = giftsIn(t);
  stage.append(meadow());
  stage.append(h('img', { class: 'home-art', src: t.home.art, alt: t.home.nom, style: box(20, 150, 560, 523) }));
  const comp = companion(250, 30, ANIMAL_H, 'dressable');
  const c = (comp as HTMLElement & { critter?: Critter }).critter!;
  stage.append(comp);
  const partAt = masks(t);
  const vb = t.critter.vb;

  const back = roundButton(ICONS.home(44), 'Zpět na začátek', onHome, 96);
  Object.assign(back.style, { position: 'absolute', left: '28px', top: '28px' });
  stage.append(back);
  stage.append(h('div', { class: 'medal-count', style: box(500, 32) }, h('span', { html: medalSvg(56) }), h('b', {}, String(medalsIn(t)))));

  const shelf = h('div', { class: 'shelf paper' });
  const slots: HTMLElement[] = [];
  t.gifts.forEach((g, i) => {
    const on = i < unlocked;
    const item = h('div', { class: `shelf-item ${on ? 'on' : ''}`, role: on ? 'button' : 'img', 'aria-label': on ? g.name : 'zatím zamčeno', html: on ? g.icon(Math.round(56 + 36 * (g.scale ?? 0.8))) : '' });
    if (on) item.addEventListener('pointerdown', (e) => startDrag(e, i, item));
    slots.push(item);
    shelf.append(item);
  });
  stage.append(shelf);

  // Worn accessories can be picked up too.
  comp.addEventListener(
    'pointerdown',
    (e) => {
      const g = (e.target as Element).closest?.('.worn-item');
      if (!g) return;
      e.stopPropagation();
      // Keep the spot where the finger took hold, so the accessory does not jump under it.
      const r = g.querySelector('image')?.getBoundingClientRect();
      const grab = r ? { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) } : undefined;
      startDrag(e, Number(g.getAttribute('data-gift')), slots[Number(g.getAttribute('data-gift'))], grab, true);
    },
    true,
  );

  let dragging = false;
  /** Client point → stage px (the stage is scaled to fit the window). */
  const toStage = (x: number, y: number) => {
    const r = stage.getBoundingClientRect();
    const k = r.width / 1180;
    return { x: (x - r.left) / k, y: (y - r.top) / k, k };
  };

  function startDrag(e: PointerEvent, i: number, home: HTMLElement, grab = { x: 0, y: 0 }, moving = false) {
    if (dragging || !home) return;
    e.preventDefault();
    dragging = true;
    const g = t.gifts[i];
    // Shown at the size it will have on the animal (treats at their shelf size).
    const px = g.worn ? Math.round((g.worn.size * ANIMAL_H) / vb[3]) : Math.round(70 + 50 * (g.scale ?? 0.8));
    const rot = g.worn?.rot ?? 0;
    const ghost = h('div', { class: 'drag-ghost', style: { width: `${px}px`, height: `${px}px`, transform: `rotate(${rot}deg) scale(1.08)` }, html: g.icon(px) });
    stage.append(ghost);
    const move = (x: number, y: number) => {
      const p = toStage(x - grab.x, y - grab.y);
      ghost.style.left = `${p.x - px / 2}px`;
      ghost.style.top = `${p.y - px / 2}px`;
    };
    move(e.clientX, e.clientY);
    pop();
    // Picking up a worn accessory (or the same one from the shelf) takes it off first.
    if (g.worn && placement(t, i)) c.setWorn(wornSvgs(t, ANIMAL_H, i));
    const id = e.pointerId;
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId === id) move(ev.clientX, ev.clientY);
    };
    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      void drop(i, ghost, px, ev.clientX - grab.x, ev.clientY - grab.y, home, moving).finally(() => (dragging = false));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  async function flyTo(ghost: HTMLElement, x: number, y: number, scale: number, ms: number) {
    const r = ghost.getBoundingClientRect();
    const a = toStage(r.left + r.width / 2, r.top + r.height / 2);
    const b = toStage(x, y);
    const base = ghost.style.transform;
    await ghost.animate([{ transform: base }, { transform: `translate(${b.x - a.x}px, ${b.y - a.y}px) ${base} scale(${scale})` }], { duration: ms, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
  }

  async function drop(i: number, ghost: HTMLElement, px: number, x: number, y: number, home: HTMLElement, moving = false) {
    const g = t.gifts[i];
    const r = c.el.getBoundingClientRect();
    const fx = (x - r.left) / r.width;
    const fy = (y - r.top) / r.height;
    const on = partAt(fx, fy);
    void px;
    if (g.food) {
      if (on) {
        const m = c.mouthPoint();
        await flyTo(ghost, m.x, m.y, 0.3, 380);
        ghost.remove();
        await c.eat(g.scale);
      } else {
        const hr = home.getBoundingClientRect();
        whoosh();
        await flyTo(ghost, hr.left + hr.width / 2, hr.top + hr.height / 2, 0.6, 350);
        ghost.remove();
      }
      return;
    }
    if (on) {
      place(t, i, { x: Math.round(vb[0] + fx * vb[2]), y: Math.round(vb[1] + fy * vb[3]), on });
      c.setWorn(wornSvgs(t, ANIMAL_H));
      ghost.remove();
      // Moving an accessory it already wears: no happy dance, so it can be picked up again at once.
      if (moving) pop();
      else void c.pleased(); // the next present can be dragged right away
    } else {
      // Dropped away from the animal: it comes off and goes back to the shelf.
      place(t, i, null);
      c.setWorn(wornSvgs(t, ANIMAL_H));
      const hr = home.getBoundingClientRect();
      whoosh();
      await flyTo(ghost, hr.left + hr.width / 2, hr.top + hr.height / 2, 0.6, 350);
      ghost.remove();
    }
  }
}
