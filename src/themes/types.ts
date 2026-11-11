import type { ItemKind } from '../art/art';

/** A present the child earns with a medal (max 10 per theme). */
export interface Gift {
  /** Accusative, as in "Koník dostal mašli." */
  name: string;
  /** Standalone SVG at the given pixel size. */
  icon: (size: number) => string;
  /** Worn by the animal: SVG drawn over the head picture (its 240×240 coordinates). */
  worn?: string;
  /** Where it sits in the home scene (stable, kennel) if not worn: centre and size in scene px. */
  at?: { x: number; y: number; size: number; rot?: number };
}

/**
 * A theme = an animal the child collects presents for. Everything theme-specific lives here:
 * the guide picture, its home, the things counted in activities and the ten presents.
 */
export interface Theme {
  id: string;
  /** Czech forms of the animal's name. */
  animal: { nom: string; gen: string; dat: string; ins: string; Nom: string };
  /** Head picture (data URL, 240×240 art, faces right). */
  head: string;
  /** The animal's home: "stáj" / "bouda". */
  home: { nom: string; loc: string; acc: string };
  /** Things counted in activities (3 kinds). */
  items: [ItemKind, ItemKind, ItemKind];
  /** What the animal eats in "Nakrm". */
  food: ItemKind;
  gifts: Gift[];
}
