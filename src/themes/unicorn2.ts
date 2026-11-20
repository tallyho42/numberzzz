import type { Theme, Gift } from './types';
import { ART, treat, accessory } from './rewards';
import { UNICORN2_VB, UNICORN2_PIVOT, unicorn2FaceSvg } from '../art/unicorn2Shapes';
import { artUrl } from '../core/critter';
import { neigh, sparkle } from '../core/sound';

const gifts: Gift[] = [
  accessory('čelenku', ART.tiara, { on: 'head', x: 730, y: 330, size: 360 }),
  treat('lízátko', ART.lollipop, 0.5),
  accessory('brýle', ART.sunglasses, { on: 'head', x: 730, y: 640, size: 470 }),
  treat('cukrovou vatu', ART.cottonCandy, 0.7),
  accessory('šálu', ART.scarf, { on: 'body', x: 730, y: 1290, size: 440 }),
  treat('palačinky', ART.pancakes, 0.85),
  accessory('křidélka', ART.wings, { on: 'body', x: 730, y: 1520, size: 760 }),
  treat('hvězdný dort', ART.starCake, 1),
];

/** The second unicorn: sky-blue with a curly pink mane, its own presents and castle on a cloud. */
export const UNICORN2: Theme = {
  id: 'unicorn2',
  label: 'Jednorožec 2',
  animal: { nom: 'jednorožec', gen: 'jednorožce', dat: 'jednorožci', ins: 'jednorožcem', Nom: 'Jednorožec', g: 'm', plural: { one: 'jednorožec', few: 'jednorožci', many: 'jednorožců' } },
  bowl: 'misky',
  meadow: ['se pásli', 'se páslo'],
  critter: { id: 'unicorn2', vb: UNICORN2_VB, parts: ['body', 'head', 'earL', 'earR'], pivot: UNICORN2_PIVOT, face: unicorn2FaceSvg(),
    call: () => { neigh(1.5); sparkle(); }, song: () => { neigh(1.3); setTimeout(sparkle, 500); },
    anchor: { mouth: [730, 1170], nose: [730, 1062], top: [730, 240], ground: [735, 1890] } },
  head: artUrl('unicorn2-face'),
  full: artUrl('unicorn2-full'),
  earless: artUrl('unicorn2-earless'),
  earZones: [
    { cx: 205, cy: 135, rx: 80, ry: 112 },
    { cx: 395, cy: 135, rx: 80, ry: 112 },
  ],
  home: { nom: 'zámek', loc: 'na zámku', acc: 'na zámek', art: artUrl('home-unicorn2'), of: 'jednorožcův' },
  items: ['star', 'lollipop', 'gem'],
  food: 'lollipop',
  gifts,
};
