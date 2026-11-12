import type { Theme, Gift } from './types';
import { ART, treat, accessory } from './rewards';
import { UNICORN_VB, UNICORN_PIVOT, unicornFaceSvg } from '../art/unicornShapes';
import { artUrl } from '../core/critter';
import { neigh, sparkle } from '../core/sound';

const gifts: Gift[] = [
  accessory('hvězdičku', ART.star, { on: 'head', x: 730, y: 176, size: 130 }),
  treat('bonbón', ART.candy, 0.5),
  accessory('věneček', ART.wreath, { on: 'head', x: 730, y: 410, size: 420 }),
  treat('dortíček', ART.cupcake, 0.7),
  accessory('náhrdelník', ART.necklace, { on: 'body', x: 730, y: 1330, size: 420 }),
  treat('duhovou zmrzlinu', ART.iceCream, 0.85),
  accessory('mašli', ART.bow('#A487C9', '#7E62A6'), { on: 'head', x: 1010, y: 760, size: 230, rot: 24 }),
  treat('duhový dort', ART.rainbowCake, 1),
];

export const UNICORN: Theme = {
  id: 'unicorn',
  animal: { nom: 'jednorožec', gen: 'jednorožce', dat: 'jednorožci', ins: 'jednorožcem', Nom: 'Jednorožec', g: 'm', plural: { one: 'jednorožec', few: 'jednorožci', many: 'jednorožců' } },
  bowl: 'misky',
  meadow: ['se pásli', 'se páslo'],
  critter: { id: 'unicorn', vb: UNICORN_VB, parts: ['body', 'head', 'earL', 'earR'], pivot: UNICORN_PIVOT, face: unicornFaceSvg(),
    call: () => { neigh(1.35); sparkle(); }, song: () => { neigh(1.15); setTimeout(sparkle, 500); },
    anchor: { mouth: [730, 1180], nose: [730, 1070], top: [730, 240], ground: [735, 1890] } },
  head: artUrl('unicorn-face'),
  full: artUrl('unicorn-full'),
  earless: artUrl('unicorn-earless'),
  earZones: [
    { cx: 200, cy: 130, rx: 78, ry: 108 },
    { cx: 400, cy: 130, rx: 78, ry: 108 },
  ],
  home: { nom: 'zámek', loc: 'na zámku', acc: 'na zámek', art: artUrl('home-unicorn'), of: 'jednorožcův' },
  items: ['cupcake', 'gem', 'heart'],
  food: 'cupcake',
  gifts,
};
