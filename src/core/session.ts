import type { ScreenSpec } from '../activities/types';
import { store, stat, strength, DIGIT_ORDER } from './progress';
import { pick, randInt, shuffle } from './dom';

/** One way to a medal: eight screens, writing one digit three times with less help each time. */
export interface Station {
  /** Digit written on this path (shown on its intro card). */
  digit: number;
  /** True when this digit is new today (first path for it). */
  intro: boolean;
  screens: ScreenSpec[];
}

const FIXABLE = [2, 3, 4, 5, 6, 7, 9];

/** Rough minutes per activity, used to decide how many medal paths fit the session. */
const MINUTES: Record<ScreenSpec['type'], number> = {
  trace: 1,
  write: 1,
  fix: 1.5,
  count: 1,
  hide: 1.5,
  find: 2,
  match: 2,
  draw: 1.5,
  color: 3,
  dots: 2,
  tapnum: 1,
  feed: 1.5,
  compare: 1,
  dice: 2.5,
  missing: 1.5,
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

type CountType = 'count' | 'find' | 'match' | 'draw' | 'hide' | 'color' | 'dots' | 'tapnum' | 'feed' | 'compare' | 'dice' | 'missing';
const COUNT_TYPES: CountType[] = ['count', 'find', 'match', 'draw', 'hide', 'color', 'dots', 'tapnum', 'feed', 'compare', 'dice', 'missing'];
/** Longer games: at most one per medal path. */
const LONG: CountType[] = ['color', 'dots', 'dice'];

/**
 * Today's session (see CLAUDE.md) is a series of medal paths. Each path:
 *   counting · trace with dotted guide · counting · counting · trace with the faint digit only ·
 *   counting · counting · write on her own  →  medal and a present for the theme's animal.
 * Each path writes one digit (today's new digit, then reviews / a second new digit, alternating);
 * counting uses the whole range 1–countMax from a bag, every number once before repeats,
 * and the same activity never comes twice in a row.
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
  const paths = Math.max(1, Math.round(budget / 11));

  // Nothing to review yet and a longer session: bring in the next digit too, so it isn't one digit all along.
  const second = !reviews.length && paths >= 2 ? order.find((d) => d !== current && stat(d).level < 3) : undefined;
  const others = [...(second != null ? [second] : []), ...reviews];
  const digits = Array.from({ length: paths }, (_, i) => (i % 2 === 0 || !others.length ? current : others[((i - 1) / 2) % others.length]));

  let typeBag: CountType[] = [];
  let lastType = '';
  const nextType = (allowLong: boolean): CountType => {
    for (let tries = 0; tries < 2; tries++) {
      if (!typeBag.length) typeBag = shuffle(COUNT_TYPES);
      const i = typeBag.findIndex((t) => t !== lastType && (allowLong || !LONG.includes(t)));
      if (i >= 0) return (lastType = typeBag.splice(i, 1)[0]);
      typeBag = [];
    }
    return (lastType = 'count');
  };
  const counting = (t: CountType, digit: number): ScreenSpec => {
    switch (t) {
      case 'count': return { type: 'count', n: bag.next() };
      case 'tapnum': return { type: 'tapnum', n: bag.next() };
      case 'feed': return { type: 'feed', n: bag.next() };
      case 'find': return { type: 'find', n: bag.next((n) => n <= 8) };
      case 'draw': return { type: 'draw', n: bag.next() };
      case 'color': return { type: 'color', digit };
      case 'dots': return { type: 'dots' };
      case 'dice': return { type: 'dice' };
      case 'compare': {
        const a = bag.next();
        const b = bag.next((n) => Math.abs(n - a) >= (countMax >= 5 ? 2 : 1));
        return { type: 'compare', a, b, less: Math.random() < 0.3 };
      }
      case 'missing': {
        const start = randInt(1, Math.max(1, countMax - 4));
        return { type: 'missing', start, gap: randInt(1, 4) };
      }
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

  const seen = new Set<number>();
  return digits.map((d, pi) => {
    let longUsed = false;
    const c = (): ScreenSpec => {
      const t = nextType(!longUsed);
      if (LONG.includes(t)) longUsed = true;
      return counting(t, d);
    };
    // Start of the session is easy: count a few things.
    const first: ScreenSpec = pi === 0 ? { type: 'count', n: bag.next((n) => n <= 5) } : c();
    if (pi === 0) lastType = 'count';
    const screens: ScreenSpec[] = [
      first,
      { type: 'trace', digit: d, support: 'full' },
      c(),
      c(),
      { type: 'trace', digit: d, support: 'start' },
      c(),
      c(),
      { type: 'write', digit: d },
    ];
    const intro = !seen.has(d) && stat(d).level < 1;
    seen.add(d);
    return { digit: d, intro, screens };
  });
}

/** Rough length of a plan in minutes (for the parent screen). */
export const planMinutes = (plan: Station[]) => plan.reduce((a, st) => a + st.screens.reduce((b, s) => b + MINUTES[s.type], 0), 0);

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
  hide: 'Kolik se schovalo',
  tapnum: 'Ťukni na číslo',
  feed: 'Nakrm zvířátko',
  compare: 'Kde je víc?',
  dice: 'Hod kostkou',
  missing: 'Chybí kamínek',
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
    case 'tapnum': return { type, n };
    case 'feed': return { type, n };
    case 'compare': return { type, a: n, b: n > 3 ? n - 2 : n + 2, less: false };
    case 'dice': return { type };
    case 'missing': return { type, start: Math.min(Math.max(1, n - 2), 6), gap: 2 };
    case 'hide': { const h = Math.min(4, n); return { type, hidden: h, total: Math.min(5, h + randInt(1, 3)) }; }
  }
}
