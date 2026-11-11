import type { ScreenSpec } from '../activities/types';
import { store, stat, strength, DIGIT_ORDER } from './progress';
import { pick, randInt, shuffle } from './dom';

export interface Station {
  kind: 'new' | 'review' | 'mix';
  digit: number | null;
  screens: ScreenSpec[];
}

const FIXABLE = [2, 3, 4, 5, 6, 7, 9];

function newStation(d: number): Station {
  const s: ScreenSpec[] = [];
  if (d >= 1) s.push({ type: 'count', n: d });
  s.push({ type: 'trace', digit: d, support: 'full' });
  if (d >= 1) s.push({ type: 'draw', n: d });
  s.push({ type: 'trace', digit: d, support: 'start' });
  s.push({ type: 'write', digit: d });
  s.push({ type: 'color', digit: d });
  return { kind: 'new', digit: d, screens: s };
}

function reviewStation(d: number, pool: number[]): Station {
  const s: ScreenSpec[] = [];
  if (d >= 1) s.push(Math.random() < 0.5 ? { type: 'count', n: d } : { type: 'flash', n: d });
  s.push({ type: 'trace', digit: d, support: 'start' });
  s.push({ type: 'write', digit: d });
  if (d >= 1 && d <= 8) s.push({ type: 'find', n: d });
  else s.push({ type: 'color', digit: d });
  if (d >= 1 && d <= 4) s.push({ type: 'hide', hidden: d, total: d + randInt(1, 5 - d) });
  else s.push({ type: 'match', nums: matchNums(d, pool) });
  return { kind: 'review', digit: d, screens: s };
}

function matchNums(must: number | null, pool: number[]): number[] {
  const set = new Set<number>();
  if (must != null) set.add(must);
  for (const n of shuffle(pool)) if (set.size < 3) set.add(n);
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])) if (set.size < 3) set.add(n);
  return shuffle([...set]);
}

function mixStation(pool: number[]): Station {
  const counting = pool.filter((n) => n >= 1);
  const any = counting.length ? counting : [2, 3, 4, 5];
  const s: ScreenSpec[] = [
    { type: 'match', nums: matchNums(null, pool) },
    { type: 'find', n: pick(any.filter((n) => n <= 8).length ? any.filter((n) => n <= 8) : [3, 4, 5]) },
    { type: 'dots' },
  ];
  const small = any.filter((n) => n <= 4);
  s.push(small.length && Math.random() < 0.5 ? (() => { const h = pick(small); return { type: 'hide', hidden: h, total: h + randInt(1, 5 - h) } as ScreenSpec; })() : { type: 'flash', n: pick(any) });
  const fixable = pool.filter((n) => FIXABLE.includes(n) && stat(n).level >= 2);
  if (fixable.length) s.push({ type: 'fix', digit: pick(fixable) });
  return { kind: 'mix', digit: null, screens: s };
}

/** Build today's session following the plan in CLAUDE.md (stations of ~7 minutes). */
export function planSession(): Station[] {
  const enabled = DIGIT_ORDER.filter((d) => store.settings.digits.includes(d));
  const order = enabled.length ? enabled : DIGIT_ORDER;
  const current = order.find((d) => stat(d).level < 3) ?? order[order.length - 1];
  const known = order.filter((d) => d !== current && stat(d).level >= 1);
  const byWeak = known.slice().sort((a, b) => strength(a) - strength(b));
  const byStrong = byWeak.slice().reverse();
  const pool = [...known, current];
  const count = store.settings.minutes === 45 ? 6 : store.settings.minutes === 30 ? 4 : 2;

  const review = (d: number | undefined) => reviewStation(d ?? current, pool);
  const plan: Station[] = [];
  if (count === 2) {
    plan.push(newStation(current), known.length ? mixStation(pool) : review(current));
  } else if (count === 4) {
    plan.push(review(byStrong[0]), newStation(current), review(byWeak[0]), mixStation(pool));
  } else {
    plan.push(review(byStrong[0]), newStation(current), review(byWeak[0]), mixStation(pool), review(byWeak[1] ?? byWeak[0]), mixStation(pool));
  }
  return plan;
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
    case 'match': return { type, nums: matchNums(d, [1, 2, 3, 4, 5]) };
    case 'dots': return { type };
    case 'find': return { type, n: Math.min(8, n) };
    case 'draw': return { type, n };
    case 'color': return { type, digit: d };
    case 'flash': return { type, n };
    case 'hide': { const h = Math.min(4, n); return { type, hidden: h, total: h + randInt(1, 5 - h) }; }
  }
}
