import type { Theme, Gift } from './types';
import { ART, treat, accessory } from './rewards';
import { HORSE_VB, HORSE_PIVOT, horseFaceSvg } from '../art/horseShapes';
import { artUrl } from '../core/critter';
import { neigh } from '../core/sound';

const gifts: Gift[] = [
  accessory('ohlávku', ART.halter, { on: 'head', x: 730, y: 960, size: 480 }),
  treat('kostku cukru', ART.sugar, 0.5),
  accessory('mašli', ART.bow('#D9617F', '#A8435C'), { on: 'head', x: 630, y: 400, size: 230, rot: -14 }),
  treat('jablíčko', ART.apple, 0.65),
  accessory('zvoneček', ART.bell, { on: 'body', x: 730, y: 1300, size: 360 }),
  treat('svazek mrkví', ART.carrots, 0.85),
  accessory('korunku', ART.crown, { on: 'head', x: 730, y: 240, size: 300 }),
  treat('mrkvový dort', ART.carrotCake, 1),
];

export const HORSE: Theme = {
  id: 'horse',
  animal: { nom: 'koník', gen: 'koníka', dat: 'koníkovi', ins: 'koníkem', Nom: 'Koník', g: 'm', plural: { one: 'koník', few: 'koníci', many: 'koníků' } },
  bowl: 'žlabu',
  meadow: ['se pásli', 'se páslo'],
  critter: { id: 'horse', vb: HORSE_VB, parts: ['body', 'head', 'earL', 'earR'], pivot: HORSE_PIVOT, face: horseFaceSvg(), call: neigh, song: neigh,
    anchor: { mouth: [730, 1180], nose: [730, 1070], top: [730, 240], ground: [735, 1890] } },
  head: artUrl('horse-face'),
  full: artUrl('horse-full'),
  earless: artUrl('horse-earless'),
  earZones: [
    { cx: 200, cy: 130, rx: 78, ry: 108 },
    { cx: 400, cy: 130, rx: 78, ry: 108 },
  ],
  home: { nom: 'stáj', loc: 've stáji', acc: 'do stáje', art: artUrl('home-horse'), of: 'koníkova' },
  items: ['carrot', 'apple', 'horseshoe'],
  food: 'carrot',
  gifts,
};
