import type { Theme, Gift } from './types';
import { ART, treat, accessory } from './rewards';
import { DOG_VB, PIVOT } from '../art/dogShapes';
import { dogFaceSvg } from '../art/dog';
import { artUrl } from '../core/critter';
import { bark, howl } from '../core/sound';

const gifts: Gift[] = [
  accessory('obojek', ART.collar, { on: 'body', x: 728, y: 1080, size: 380 }),
  treat('piškot', ART.biscuit, 0.5),
  accessory('mašli', ART.bow('#D9617F', '#A8435C'), { on: 'head', x: 1010, y: 330, size: 200, rot: 30 }),
  treat('párek', ART.sausage, 0.7),
  accessory('šátek', ART.bandana, { on: 'body', x: 728, y: 1190, size: 360 }),
  treat('velkou kost', ART.bigBone, 0.85),
  accessory('kšiltovku', ART.cap, { on: 'head', x: 728, y: 320, size: 380 }),
  treat('psí dort', ART.dogCake, 1),
];

export const DOG: Theme = {
  id: 'dog',
  animal: { nom: 'pejsek', gen: 'pejska', dat: 'pejskovi', ins: 'pejskem', Nom: 'Pejsek', g: 'm', plural: { one: 'pejsek', few: 'pejsci', many: 'pejsků' } },
  bowl: 'misky',
  meadow: ['si hráli', 'si hrálo'],
  critter: { id: 'dog', vb: DOG_VB, parts: ['tail', 'body', 'head', 'earL', 'earR'], pivot: PIVOT, face: dogFaceSvg('face'), bodyInk: dogFaceSvg('legs'), call: () => bark(1), song: () => howl(1.7), floppy: true,
    anchor: { mouth: [800, 930], nose: [725, 760], top: [728, 300], ground: [735, 1880] } },
  head: artUrl('dog-face'),
  full: artUrl('dog-full'),
  earless: artUrl('dog-earless'),
  earZones: [
    { cx: 115, cy: 215, rx: 86, ry: 130 },
    { cx: 470, cy: 195, rx: 96, ry: 135 },
  ],
  home: { nom: 'bouda', loc: 'v boudě', acc: 'do boudy', art: artUrl('home-dog'), of: 'pejskova' },
  items: ['bone', 'ball', 'sausage'],
  food: 'sausage',
  gifts,
};
