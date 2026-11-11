import type { Theme } from './types';
import { HORSE } from './horse';
import { DOG } from './dog';
import { store, save } from '../core/progress';

export type { Theme, Gift } from './types';

/** All themes in the order they are offered on the home screen. */
export const THEMES: Theme[] = [HORSE, DOG];

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
