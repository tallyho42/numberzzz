import type { InkPoint } from './ink';

export interface Settings {
  minutes: 15 | 30 | 45;
  /** 1 = mild … 5 = strict */
  tolerance: number;
  digits: number[];
  ink: string;
  /** Counting activities use numbers 1..countMax. */
  countMax: number;
}

export interface DigitStat {
  level: number;
  traceOk: number;
  traceFail: number;
  writeOk: number;
  writeFail: number;
  writeSessions: string[];
  lastSeen: number;
}

export interface StrokeRecord {
  at: number;
  activity: string;
  digit: number;
  success: boolean;
  detail: Record<string, unknown>;
  strokes: { x: number; y: number; t: number; p: number }[][];
}

interface Store {
  settings: Settings;
  stats: Record<string, DigitStat>;
  medals: number;
  sessions: number;
  log: StrokeRecord[];
}

const KEY = 'numberzzz.v1';
export const DIGIT_ORDER = [1, 7, 4, 0, 6, 9, 2, 3, 5, 8, 10];

const defaults = (): Store => ({
  settings: { minutes: 15, tolerance: 2, digits: [...DIGIT_ORDER], ink: '#E2558C', countMax: 10 },
  stats: {},
  medals: 0,
  sessions: 0,
  log: [],
});

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const s = JSON.parse(raw) as Store;
    return { ...defaults(), ...s, settings: { ...defaults().settings, ...s.settings } };
  } catch {
    return defaults();
  }
}

export const store: Store = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage may be unavailable (private mode) – the game still works */
  }
}

export function stat(d: number): DigitStat {
  const k = String(d);
  store.stats[k] ??= { level: 0, traceOk: 0, traceFail: 0, writeOk: 0, writeFail: 0, writeSessions: [], lastSeen: 0 };
  return store.stats[k];
}

export let sessionId = String(Date.now());
export const newSessionId = () => (sessionId = String(Date.now()));

function recompute(d: number) {
  const s = stat(d);
  let level = Math.max(s.level, 1);
  if (s.traceOk >= 3) level = Math.max(level, 2);
  if (s.writeSessions.length >= 2) level = Math.max(level, 3);
  const writeRate = s.writeOk / Math.max(1, s.writeOk + s.writeFail);
  if (s.writeSessions.length >= 3 && writeRate >= 0.7) level = 4;
  s.level = level;
}

export function recordResult(kind: 'trace' | 'write' | 'other', d: number, success: boolean) {
  const s = stat(d);
  s.lastSeen = Date.now();
  if (kind === 'trace') success ? s.traceOk++ : s.traceFail++;
  if (kind === 'write') {
    if (success) {
      s.writeOk++;
      if (!s.writeSessions.includes(sessionId)) s.writeSessions.push(sessionId);
    } else s.writeFail++;
  }
  recompute(d);
  save();
}

/** Numerals she can't read yet get a small dot hint on answer buttons (it fades once she writes them). */
export const needsHint = (n: number) => n > 0 && (store.stats[String(n)]?.level ?? 0) < 2;

export function markSeen(d: number) {
  stat(d);
  recompute(d);
  save();
}

/** Lower = weaker; used to repeat weaker digits more often. */
export function strength(d: number): number {
  const s = stat(d);
  const tries = s.traceOk + s.traceFail + s.writeOk + s.writeFail;
  const rate = tries ? (s.traceOk + s.writeOk) / tries : 0;
  return s.level + rate;
}

export function logStrokes(activity: string, digit: number, success: boolean, strokes: InkPoint[][], detail: Record<string, unknown> = {}) {
  store.log.push({
    at: Date.now(),
    activity,
    digit,
    success,
    detail,
    strokes: strokes.map((s) => s.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, t: Math.round(p.t), p: Math.round(p.p * 100) / 100 }))),
  });
  if (store.log.length > 300) store.log.splice(0, store.log.length - 300);
  save();
}

export function resetProgress() {
  const keep = store.settings;
  Object.assign(store, defaults(), { settings: keep });
  save();
}

/** Tracing corridor half-width (frame units) and required coverage for the tolerance setting. */
export function traceTolerance() {
  const i = Math.min(4, Math.max(0, store.settings.tolerance - 1));
  return { corridor: [17, 14, 11.5, 9.5, 8][i], coverage: [0.75, 0.8, 0.85, 0.88, 0.9][i], offMax: [0.35, 0.3, 0.25, 0.2, 0.15][i] };
}

export function writeLeniency() {
  const i = Math.min(4, Math.max(0, store.settings.tolerance - 1));
  return [1.35, 1.22, 1.12, 1.05, 1.0][i];
}
