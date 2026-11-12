import type { ItemKind } from '../art/art';
import type { CritterDef } from '../core/critter';

/** A present the child earns with a medal (8 per theme): treats to eat and accessories to wear. */
export interface Gift {
  /** Accusative, as in "Koník dostal mašli." */
  name: string;
  /** Flat drawing in a 100×100 frame (painted by the brush when shown). */
  art: string;
  /** Painted picture at the given pixel size. */
  icon: (size: number) => string;
  /** Size on the grass and shelf relative to the largest present (treats grow from small to huge). */
  scale?: number;
  /** A treat: the animal eats it. */
  food?: boolean;
  /** An accessory: its usual spot (art frame), size in frame units, tilt and the part it sits on. */
  worn?: { x: number; y: number; size: number; rot?: number; on: 'head' | 'body' };
}

/**
 * A theme = an animal the child collects presents for. Everything theme-specific lives here:
 * the animal, its home, the things counted in activities and the ten presents.
 */
export interface Theme {
  id: string;
  /** Czech forms of the animal's name. */
  animal: { nom: string; gen: string; dat: string; ins: string; Nom: string; g: 'm' | 'f'; plural: { one: string; few: string; many: string } };
  /** What the presents are called (default "dárek / dárky"). */
  reward?: { one: string; many: string };
  /** Bowl in "Dokresli … do misky" (genitive). */
  bowl: string;
  /** What a few / many of them do on the meadow ("se pásli" / "se páslo"). */
  meadow: [string, string];
  critter: CritterDef;
  /** Painted head (buttons, medal, tokens). */
  head: string;
  /** Small painted full figure (several of them in "Kolik se schovalo"). */
  full: string;
  /** Head without ears for "Dokresli uši" and the ear zones on the 560×560 picture (none for the turtle). */
  earless?: string;
  earZones?: { cx: number; cy: number; rx: number; ry: number }[];
  /** The animal's home: "stáj" / "bouda", its painting and possessive ("koníkova"); `acc` answers "kam" ("do stáje"). */
  home: { nom: string; loc: string; acc: string; art: string; of: string };
  /** Things counted in activities (3 kinds). */
  items: [ItemKind, ItemKind, ItemKind];
  /** What the animal eats in "Nakrm". */
  food: ItemKind;
  gifts: Gift[];
}

/** Grammar helpers for the animal: "dostal / dostala", "mu / jí". */
export const fem = (t: Theme) => t.animal.g === 'f';
export const toIt = (t: Theme) => (fem(t) ? 'jí' : 'mu');
export const past = (t: Theme, verb: string) => verb + (fem(t) ? 'a' : '');
export const reward = (t: Theme) => t.reward ?? { one: 'dárek', many: 'dárky' };
