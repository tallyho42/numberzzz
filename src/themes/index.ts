import type { Theme } from './types';
import { HORSE } from './horse';
import { DOG } from './dog';
import { TURTLE } from './turtle';
import { UNICORN } from './unicorn';
import { store, save, type Placement } from '../core/progress';

export type { Theme, Gift } from './types';

/** All themes in the order they are offered on the home screen. */
export const THEMES: Theme[] = [HORSE, DOG, TURTLE, UNICORN];

// The painted version starts with the dog once the horse is finished.
if (!store.flags?.painted) {
  store.flags = { ...store.flags, painted: true };
  if ((store.medalsBy.horse ?? 0) >= HORSE.gifts.length && store.theme === 'horse') store.theme = 'dog';
  save();
}

export function theme(): Theme {
  return THEMES.find((t) => t.id === store.theme) ?? THEMES[0];
}

export function setTheme(id: string) {
  store.theme = id;
  save();
}

/** Medals earned in a theme (each one unlocks the next present, up to 10). */
export const medalsIn = (t: Theme = theme()) => store.medalsBy[t.id] ?? 0;
export const giftsIn = (t: Theme = theme()) => Math.min(medalsIn(t), t.gifts.length);
export const completed = (t: Theme) => giftsIn(t) >= t.gifts.length;

/** Award a medal in the current theme; returns the newly unlocked present, if any. */
export function awardMedal() {
  const t = theme();
  store.medalsBy[t.id] = medalsIn(t) + 1;
  store.medals++;
  save();
  const n = medalsIn(t);
  return n <= t.gifts.length ? t.gifts[n - 1] : undefined;
}

/**
 * Parent screen: take back all medals and presents of one animal (it starts collecting again).
 * The total medal count in the statistics stays, it records how much she has played.
 */
export function resetRewards(t: Theme) {
  setRewards(t, 0);
}

/** Parent screen: set how many presents an animal has (0–8). Accessories it loses go back to their usual spot. */
export function setRewards(t: Theme, n: number) {
  const k = Math.max(0, Math.min(t.gifts.length, n));
  store.medalsBy[t.id] = k;
  const placed = store.placed?.[t.id];
  if (placed) for (const i of Object.keys(placed)) if (Number(i) >= k) delete placed[Number(i)];
  save();
}

/** Where accessory `i` sits now (its usual spot unless Meda moved it), or null when taken off. */
export function placement(t: Theme, i: number): (Placement & { size: number; rot: number }) | null {
  const w = t.gifts[i]?.worn;
  if (!w) return null;
  const p = store.placed?.[t.id]?.[i];
  if (p === null) return null;
  return { ...(p ?? w), size: w.size, rot: w.rot ?? 0 };
}

/** Put accessory `i` on a spot (or take it off with null). */
export function place(t: Theme, i: number, p: Placement | null) {
  store.placed = { ...store.placed, [t.id]: { ...store.placed?.[t.id], [i]: p } };
  save();
}
