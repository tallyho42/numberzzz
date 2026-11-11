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
 * Today's session (see CLAUDE.md):
 * - writing focuses on one new digit plus 1–2 review digits,
 * - counting/recognition uses the whole range 1–countMax, every number once before repeats,
 * - writing and counting alternate, the same activity never comes twice in a row,
 * - the session is filled up to the chosen length using estimated minutes per activity,
 * - start easy, recall the new digit near the end, finish with something fun.
 */
export function planSession(): Station[] {
  const enabled = DIGIT_ORDER.filter((d) => store.settings.digits.includes(d));
  const order = enabled.length ? enabled : DIGIT_ORDER;
  const current = order.find((d) => stat(d).level < 3) ?? order.slice().sort((a, b) => strength(a) - strength(b))[0];
  const reviews = order
    .filter((d) => d !== current && stat(d).level >= 1)
    .sort((a, b) => strength(a) - strength(b))
    .slice(0, 2);
  const fixable = [current, ...reviews].filter((d) => FIXABLE.includes(d) && stat(d).level >= 2);
  const countMax = store.settings.countMax;
  const bag = new NumberBag(Array.from({ length: countMax }, (_, i) => i + 1));
  const budget = store.settings.minutes;

  // Nothing to review yet and a longer session: bring in the next digit too, so it isn't one digit all along.
  const second = !reviews.length && budget >= 30 ? order.find((d) => d !== current && stat(d).level < 3) : undefined;
  const introduce = (d: number): ScreenSpec[] => [
    { type: 'trace', digit: d, support: 'full' },
    { type: 'trace', digit: d, support: 'start' },
    { type: 'write', digit: d },
  ];
  // Writing queue: introduce the new digit(s), then cycle new/review writing.
  const intro: ScreenSpec[] = [...introduce(current), ...(second != null ? introduce(second) : [])];
  const cycle: ScreenSpec[] = [];
  for (const r of reviews) cycle.push({ type: 'write', digit: r });
  cycle.push({ type: 'write', digit: current });
  if (second != null) cycle.push({ type: 'write', digit: second });
  if (fixable.length) cycle.push({ type: 'fix', digit: pick(fixable) });
  cycle.push({ type: 'trace', digit: current, support: 'start' });
  if (second != null) cycle.push({ type: 'trace', digit: second, support: 'start' });
  let wi = 0;
  const nextWriting = (): ScreenSpec => (wi < intro.length ? intro[wi++] : cycle[(wi++ - intro.length) % cycle.length]);

  // Counting queue: rotate activity types, numbers from the bag.
  let typeBag: CountType[] = [];
  let lastType: string = '';
  const nextCountType = (): CountType => {
    if (!typeBag.length) typeBag = shuffle(['count', 'flash', 'find', 'match', 'draw', 'hide'] as CountType[]);
    let i = typeBag.findIndex((t) => t !== lastType);
    if (i < 0) i = 0;
    const t = typeBag.splice(i, 1)[0];
    lastType = t;
    return t;
  };
  const counting = (t: CountType): ScreenSpec => {
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

  const screens: ScreenSpec[] = [];
  let used = 0;
  const push = (s: ScreenSpec) => {
    screens.push(s);
    used += MINUTES[s.type];
  };

  // Ending: recall the new digit, then something fun.
  const ending: ScreenSpec[] = [{ type: 'write', digit: current }, { type: 'dots' }];
  const endMinutes = ending.reduce((a, s) => a + MINUTES[s.type], 0);
  const specials: ScreenSpec[] = [{ type: 'color', digit: current }];
  if (budget >= 30) specials.push({ type: 'color', digit: second ?? reviews[0] ?? current });
  if (budget >= 45) specials.push({ type: 'color', digit: pick([current, ...reviews, ...(second != null ? [second] : [])]) });

  push({ type: 'count', n: bag.next((n) => n <= 5) }); // easy start
  lastType = 'count';
  let turn = 0;
  while (used + endMinutes < budget) {
    if (turn % 2 === 0) push(nextWriting());
    else if (specials.length && turn % 6 === 5) push(specials.shift()!);
    else push(counting(nextCountType()));
    turn++;
  }
  for (const s of specials.splice(0, 1)) push(s);
  ending.forEach(push);

  // Group into stops of ~4 screens (a sticker after each).
  const stations: Station[] = [];
  for (let i = 0; i < screens.length; i += 4) {
    // Don't leave a lonely last screen: fold a short tail into the last stop.
    const chunk = screens.length - (i + 4) < 2 ? screens.slice(i) : screens.slice(i, i + 4);
    const fresh = chunk.find((s) => s.type === 'trace' && s.support === 'full');
    const w = fresh ?? chunk.find((s) => s.type === 'trace' || s.type === 'write');
    stations.push({ digit: w && 'digit' in w ? w.digit : null, intro: fresh != null, screens: chunk });
    if (chunk.length > 4) break;
  }
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
