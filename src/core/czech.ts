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

export const PRAISE = ['Výborně!', 'Skvělé!', 'To se ti povedlo!', 'Šikulka!', 'Paráda!', 'Krása!', 'Hezky!'];
export const RETRY = ['Zkusíme to znovu.', 'Skoro! Ještě jednou.', 'Nevadí, zkusíme to ještě jednou.'];
