import type { InkPoint } from './ink';

export interface Settings {
  minutes: 15 | 30 | 45;
  /** 1 = mild … 5 = strict */
  tolerance: number;
  digits: number[];
  ink: string;
  /** Counting activities use numbers 1..countMax. */
  countMax: number;
  /** How the voice addresses the child (Czech vocative, e.g. "Medo"); empty = no name. */
  name: string;
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
  /** Total medals ever (all themes). */
  medals: number;
  /** Medals per theme id – each unlocks a present for that theme's animal. */
  medalsBy: Record<string, number>;
  /** Selected theme id. */
  theme: string;
  sessions: number;
  log: StrokeRecord[];
}

const KEY = 'numberzzz.v1';
const LOG_KEY = 'numberzzz.v1.log';
export const DIGIT_ORDER = [1, 7, 4, 0, 6, 9, 2, 3, 5, 8, 10];

const defaults = (): Store => ({
  settings: { minutes: 15, tolerance: 2, digits: [...DIGIT_ORDER], ink: '#E2558C', countMax: 10, name: 'Medo' },
  stats: {},
  medals: 0,
  medalsBy: {},
  theme: 'horse',
  sessions: 0,
  log: [],
});

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const s = JSON.parse(raw) as Store;
    let log = s.log ?? []; // older versions kept the log in the main record
    try {
      log = JSON.parse(localStorage.getItem(LOG_KEY) || 'null') ?? log;
    } catch {
      /* keep what we have */
    }
    // Before themes existed, all medals belonged to the horse.
    const medalsBy = s.medalsBy ?? { horse: s.medals ?? 0 };
    return { ...defaults(), ...s, log, medalsBy, settings: { ...defaults().settings, ...s.settings } };
  } catch {
    return defaults();
  }
}

export const store: Store = load();

/**
 * Progress, medals and settings are small and saved under their own key, so they always fit.
 * The stroke log is big (the Pencil sends hundreds of points a second) and lives under a separate
 * key: if it ever hits the storage quota it gets trimmed, and it can never block saving medals.
 */
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...store, log: undefined }));
  } catch {
    /* storage may be unavailable (private mode) – the game still works */
  }
}

function saveLog() {
  for (let i = 0; i < 4; i++) {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(store.log));
      return;
    } catch {
      if (!store.log.length) return;
      store.log.splice(0, Math.ceil(store.log.length / 2)); // over quota: drop the oldest half
    }
  }
}

// Ask the browser not to evict our storage under pressure (no prompt; granted for home-screen apps).
void navigator.storage?.persist?.().catch(() => {});

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

/**
 * Answer buttons show a small dot hint while she can't read the numerals yet. All buttons or none:
 * a hint missing on just one number (say 1, written well first) looks like a mistake, so the dots
 * go only once every number in the counting range has reached level 2.
 */
export const needsHint = (n: number) =>
  n > 0 && Array.from({ length: store.settings.countMax }, (_, i) => i + 1).some((d) => (store.stats[String(d)]?.level ?? 0) < 2);

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
  saveLog();
}

export function resetProgress() {
  const keep = store.settings;
  Object.assign(store, defaults(), { settings: keep });
  save();
  saveLog();
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

const RECENT_KEY = 'numberzzz.recent';

/**
 * Pick an item not shown recently (remembered across sessions): the last half of the
 * list is kept out, so every picture comes round before one repeats soon.
 */
export function pickFresh<T>(kind: string, items: T[], id: (t: T) => string): T {
  let recent: Record<string, string[]> = {};
  try {
    recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}');
  } catch {
    /* no storage – plain random */
  }
  const seen = recent[kind] ?? [];
  const pool = items.filter((t) => !seen.includes(id(t)));
  const choice = (pool.length ? pool : items)[Math.floor(Math.random() * (pool.length || items.length))];
  recent[kind] = [id(choice), ...seen.filter((s) => s !== id(choice))].slice(0, Math.floor(items.length / 2));
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    /* ignore */
  }
  return choice;
}
