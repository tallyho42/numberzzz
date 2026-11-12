import type { Theme, Gift } from './types';
import { ART, treat, accessory } from './rewards';
import { TURTLE_VB, TURTLE_PIVOT, turtleFaceSvg, turtleFrontInk } from '../art/turtleShapes';
import { artUrl } from '../core/critter';
import { squeak, hum } from '../core/sound';

const gifts: Gift[] = [
  accessory('čepičku', ART.beanie, { on: 'head', x: 730, y: 510, size: 320 }),
  treat('jahodu', ART.strawberry, 0.5),
  accessory('kytičku', ART.flower('#E2B13F', '#D9617F'), { on: 'head', x: 906, y: 600, size: 180, rot: 24 }),
  treat('lísteček salátu', ART.lettuce, 0.65),
  accessory('korálky', ART.beads, { on: 'body', x: 730, y: 1100, size: 420 }),
  treat('kousek melounu', ART.melon, 0.85),
  accessory('mašli', ART.bow('#7FA7C4', '#5C86A5'), { on: 'head', x: 556, y: 620, size: 230, rot: -34 }),
  treat('ovocný dort', ART.fruitCake, 1),
];

export const TURTLE: Theme = {
  id: 'turtle',
  animal: { nom: 'želvička', gen: 'želvičky', dat: 'želvičce', ins: 'želvičkou', Nom: 'Želvička', g: 'f', plural: { one: 'želvička', few: 'želvičky', many: 'želviček' } },
  bowl: 'misky',
  meadow: ['se procházely', 'se procházelo'],
  critter: { id: 'turtle', vb: TURTLE_VB, parts: ['tail', 'body', 'head', 'front'], pivot: TURTLE_PIVOT, face: turtleFaceSvg(), frontInk: turtleFrontInk(), call: squeak, song: hum, shell: true,
    anchor: { mouth: [730, 880], nose: [730, 790], top: [730, 500], ground: [735, 1890] } },
  head: artUrl('turtle-face'),
  full: artUrl('turtle-full'),
  home: { nom: 'jezírko', loc: 'u jezírka', acc: 'k jezírku', art: artUrl('home-turtle'), of: 'želviččino' },
  items: ['strawberry', 'leaf', 'shell'],
  food: 'strawberry',
  gifts,
};
