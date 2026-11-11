import type { ScreenSpec } from '../activities/types';
import { store, stat, strength, DIGIT_ORDER } from './progress';
import { pick, randInt, shuffle } from './dom';

export interface Station {
  /** Digit being written in this stop (shown on the stop card), if any. */
  digit: number | null;
  /** True for the stop where today's new digit is introduced. */
  intro: boolean;
  screens: ScreenSpec[];
}

const FIXABLE = [2, 3, 4, 5, 6, 7, 9];

/** Rough minutes per activity, used to fill the session length. */
const MINUTES: Record<ScreenSpec['type'], number> = {
  trace: 1,
  write: 1,
  fix: 1.5,
  count: 1,
  flash: 1,
  hide: 1.5,
  find: 2,
  match: 2,
  draw: 1.5,
  color: 3,
  dots: 2,
};

/** A shuffled bag of numbers: every number comes up once before any repeats, never twice in a row. */
class NumberBag {
  private bag: number[] = [];
  private last = -1;
  constructor(private readonly nums: number[]) {}
  next(filter: (n: number) => boolean = () => true): number {
    const allowed = this.nums.filter(filter);
    if (!allowed.length) return pick(this.nums);
    for (let tries = 0; tries < 3; tries++) {
      if (!this.bag.some(filter)) this.bag = shuffle(this.nums);
      const i = this.bag.findIndex((n) => filter(n) && n !== this.last);
      if (i >= 0) {
        const n = this.bag.splice(i, 1)[0];
        this.last = n;
        return n;
      }
      this.bag = [];
    }
    return pick(allowed);
  }
}

type CountType = 'count' | 'flash' | 'find' | 'match' | 'draw' | 'hide';

/**
 * Today's session (see CLAUDE.md), built as stops of ~4 screens:
 * - every stop practises exactly ONE writing digit (shown on the stop card) – traced, written, fixed,
 * - writing and counting alternate inside a stop; counting uses the whole range 1–countMax from a bag,
 * - writing focuses on one new digit plus 1–2 review digits (a second new digit if nothing to review),
 * - stops are added until the chosen length is filled (estimated minutes per activity),
 * - the last stop writes the new digit once more and finishes with something fun.
 */
export function planSession(): Station[] {
  const enabled = DIGIT_ORDER.filter((d) => store.settings.digits.includes(d));
  const order = enabled.length ? enabled : DIGIT_ORDER;
  const current = order.find((d) => stat(d).level < 3) ?? order.slice().sort((a, b) => strength(a) - strength(b))[0];
  const reviews = order
    .filter((d) => d !== current && stat(d).level >= 1)
    .sort((a, b) => strength(a) - strength(b))
    .slice(0, 2);
  const countMax = store.settings.countMax;
  const bag = new NumberBag(Array.from({ length: countMax }, (_, i) => i + 1));
  const budget = store.settings.minutes;

  // Nothing to review yet and a longer session: bring in the next digit too, so it isn't one digit all along.
  const second = !reviews.length && budget >= 30 ? order.find((d) => d !== current && stat(d).level < 3) : undefined;

  // Counting: rotate activity types, numbers from the bag.
  let typeBag: CountType[] = [];
  let lastType = '';
  const nextCountType = (): CountType => {
    if (!typeBag.length) typeBag = shuffle(['count', 'flash', 'find', 'match', 'draw', 'hide'] as CountType[]);
    let i = typeBag.findIndex((t) => t !== lastType);
    if (i < 0) i = 0;
    const t = typeBag.splice(i, 1)[0];
    lastType = t;
    return t;
  };
  const counting = (t: CountType = nextCountType()): ScreenSpec => {
    switch (t) {
      case 'count': return { type: 'count', n: bag.next() };
      case 'flash': return { type: 'flash', n: bag.next() };
      case 'find': return { type: 'find', n: bag.next((n) => n <= 8) };
      case 'draw': return { type: 'draw', n: bag.next() };
      case 'hide': {
        const hidden = bag.next((n) => n <= 4);
        return { type: 'hide', hidden, total: Math.min(5, hidden + randInt(1, 3)) };
      }
      case 'match': {
        const nums = new Set<number>();
        while (nums.size < 3) nums.add(bag.next((n) => !nums.has(n)));
        return { type: 'match', nums: [...nums] };
      }
    }
  };
  const minutes = (screens: ScreenSpec[]) => screens.reduce((a, s) => a + MINUTES[s.type], 0);

  // Writing part of a stop – always one digit.
  const visits = new Map<number, number>();
  const writing = (d: number): ScreenSpec[] => {
    const v = visits.get(d) ?? 0;
    visits.set(d, v + 1);
    const canFix = FIXABLE.includes(d) && stat(d).level >= 2;
    if (v % 2 === 1 && canFix) return [{ type: 'write', digit: d }, { type: 'fix', digit: d }];
    return [{ type: 'trace', digit: d, support: 'start' }, { type: 'write', digit: d }];
  };

  const stations: Station[] = [];
  let used = 0;
  const add = (st: Station) => {
    stations.push(st);
    used += minutes(st.screens);
  };

  // New digit(s): full tracing, tracing from the start dot, then writing alone – counting in between.
  const introStop = (d: number, easy: boolean): Station => {
    visits.set(d, 1);
    const c1 = easy ? { type: 'count', n: bag.next((n) => n <= 5) } as ScreenSpec : counting();
    if (easy) lastType = 'count';
    return {
      digit: d,
      intro: true,
      screens: [{ type: 'trace', digit: d, support: 'full' }, c1, { type: 'trace', digit: d, support: 'start' }, counting(), { type: 'write', digit: d }],
    };
  };

  // Last stop: the new digit once more, the secret colouring with it, and the dot-to-dot to finish.
  const finalStop: Station = {
    digit: current,
    intro: false,
    screens: [{ type: 'trace', digit: current, support: 'start' }, { type: 'color', digit: current }, { type: 'write', digit: current }, { type: 'dots' }],
  };
  const finalMinutes = minutes(finalStop.screens);

  add(introStop(current, true));
  if (second != null) add(introStop(second, false));

  // Middle stops: reviews (and the second new digit) take turns with today's digit.
  const cycle = [...reviews, ...(second != null ? [second] : []), current];
  let ci = 0;
  let colorLeft = budget >= 45 ? 2 : budget >= 30 ? 1 : 0;
  for (let guard = 0; guard < 20; guard++) {
    let d = cycle[ci++ % cycle.length];
    if (d === stations[stations.length - 1].digit && cycle.length > 1) d = cycle[ci++ % cycle.length];
    const [w1, w2] = writing(d);
    const special = colorLeft > 0 && stations.length % 2 === 0;
    const screens = [w1, special ? ({ type: 'color', digit: d } as ScreenSpec) : counting(), w2, counting()];
    if (used + minutes(screens) + finalMinutes > budget + 0.5) break;
    if (special) colorLeft--;
    add({ digit: d, intro: false, screens });
  }
  add(finalStop);
  return stations;
}

/** Every activity once, for the parent's "try it" menu. */
export const ACTIVITY_LABELS: Record<ScreenSpec['type'], string> = {
  trace: 'Obtahování',
  write: 'Psaní samostatně',
  fix: 'Oprav koníka',
  count: 'Kolik jich je?',
  match: 'Spojování',
  dots: 'Spojovačka 1–10',
  find: 'Najdi a spočítej',
  draw: 'Dokresli N věcí',
  color: 'Tajné kouzlo',
  flash: 'Bleskový pohled',
  hide: 'Kolik se schovalo',
};

export function sampleScreen(type: ScreenSpec['type'], d: number): ScreenSpec {
  const n = Math.max(1, d);
  switch (type) {
    case 'trace': return { type, digit: d, support: 'full' };
    case 'write': return { type, digit: d };
    case 'fix': return { type, digit: FIXABLE.includes(d) ? d : 3 };
    case 'count': return { type, n };
    case 'match': {
      const nums = new Set([n]);
      while (nums.size < 3) nums.add(randInt(1, 10));
      return { type, nums: shuffle([...nums]) };
    }
    case 'dots': return { type };
    case 'find': return { type, n: Math.min(8, n) };
    case 'draw': return { type, n };
    case 'color': return { type, digit: d };
    case 'flash': return { type, n };
    case 'hide': { const h = Math.min(4, n); return { type, hidden: h, total: Math.min(5, h + randInt(1, 3)) }; }
  }
}
