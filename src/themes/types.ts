import type { ItemKind } from '../art/art';
import type { CritterDef } from '../core/critter';

/** A present the child earns with a medal (max 10 per theme). */
export interface Gift {
  /** Accusative, as in "Koník dostal mašli." */
  name: string;
  /** Painted picture at the given pixel size. */
  icon: (size: number) => string;
  /** Size on the grass relative to the largest present (treats grow from tiny to big). */
  scale?: number;
  /** Worn by the animal: SVG in its art frame, on the head or the body. */
  worn?: { svg: string; on: 'head' | 'body' };
}

/**
 * A theme = an animal the child collects presents for. Everything theme-specific lives here:
 * the animal, its home, the things counted in activities and the ten presents.
 */
export interface Theme {
  id: string;
  /** Czech forms of the animal's name. */
  animal: { nom: string; gen: string; dat: string; ins: string; Nom: string; plural: { one: string; few: string; many: string } };
  critter: CritterDef;
  /** Painted head (buttons, medal, tokens). */
  head: string;
  /** Small painted full figure (several of them in "Kolik se schovalo"). */
  full: string;
  /** Head without ears for "Dokresli uši" and the ear zones on the 560×560 picture. */
  earless: string;
  earZones: { cx: number; cy: number; rx: number; ry: number }[];
  /** The animal's home: "stáj" / "bouda", its painting and possessive ("koníkova"). */
  home: { nom: string; loc: string; acc: string; art: string; of: string };
  /** Things counted in activities (3 kinds). */
  items: [ItemKind, ItemKind, ItemKind];
  /** What the animal eats in "Nakrm". */
  food: ItemKind;
  gifts: Gift[];
}
