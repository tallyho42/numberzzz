import { store } from './progress';

/** Czech plural form for a count: 1 → one, 2–4 → few, otherwise many (incl. 0). */
export function plural(n: number, forms: { one: string; few: string; many: string }) {
  if (n === 1) return forms.one;
  if (n >= 2 && n <= 4) return forms.few;
  return forms.many;
}

const WORDS = ['nula', 'jedna', 'dva', 'tři', 'čtyři', 'pět', 'šest', 'sedm', 'osm', 'devět', 'deset'];
export const numWord = (n: number) => WORDS[n] ?? String(n);

const NUMBER_NOUN = ['nulu', 'jedničku', 'dvojku', 'trojku', 'čtyřku', 'pětku', 'šestku', 'sedmičku', 'osmičku', 'devítku', 'desítku'];
/** Accusative name of the digit, e.g. "trojku". */
export const digitNoun = (n: number) => NUMBER_NOUN[n] ?? `číslo ${n}`;

const PRAISE = ['Výborně', 'Skvělé', 'To se ti povedlo', 'Šikulka', 'Paráda', 'Krása', 'Hezky'];
const RETRY = ['Zkusíme to znovu', 'Skoro! Ještě jednou', 'Nevadí, zkusíme to ještě jednou'];

/** The child's name in the vocative ("Medo"), set on the parent screen. */
const childName = () => store.settings.name.trim();

/** Add the child's name: "Výborně" → "Výborně, Medo!" (always when `always`, otherwise about half the time). */
export function withName(text: string, end = '!', always = false): string {
  const n = childName();
  return n && (always || Math.random() < 0.6) ? `${text}, ${n}${end}` : `${text}${end}`;
}

/** "Ahoj Medo!" style: the name right after a short opener. */
export const hello = (opener: string) => (childName() ? `${opener} ${childName()}!` : `${opener}!`);

export const praise = () => withName(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
export const retry = () => withName(RETRY[Math.floor(Math.random() * RETRY.length)], '.');
