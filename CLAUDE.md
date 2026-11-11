# Numberzzz – Kouzelná čísla

Webová hra (HTML/TS) na čísla 0–10 pro pětiletou Medu, iPad na šířku, ovládání Apple Pencilem. Digitální verze papírových pracovních sešitů.

## Pravidla návrhu
- Meda neumí číst: **všechny pokyny hlasem česky** (Web Speech API cs-CZ, později nahrávky rodičů – jedno audio na text). Na obrazovce jen obrázky, čísla, ikony.
- Žádné tresty ani červené křížky. Chyba = jemné „zkusíme to znovu“, po 2 neúspěších ukázka.
- Hvězdička za obrazovku, medaile za úroveň. Úroveň trvá 10–15 min a skončí.
- Velké cíle (≥ 60 pt), minimalistické UI, jemné animace (respektovat reduce-motion).
- Konvence sešitů: zelená tečka = začátek tahu, šipka = směr, šedý tečkovaný vzor, výrazný inkoust.
- Vše v UI i hlasu česky.
- **Grafika a UI se navrhují společně s uživatelem** – nic vizuálního nevymýšlet bez domluvy.

## Architektura
- TypeScript + Vite, bez backendu; později PWA.
- Kreslení: Canvas 2D + Pointer Events, preferovat `pen`, palm rejection, `touch-action: none`, bez scrollu/zoomu. Musí jít i myší.
- Aktivita = plugin (`render(params)`, příjem tahů, `evaluate()` → `{success, accuracy, attempts}`).
- Téma = datový balíček (JSON + SVG): postava, předměty, palety, hlasové texty, cílové zóny.
- Úroveň = generátor sekvence aktivit z tématu a nastavení.
- Pokrok v localStorage/IndexedDB, slabší čísla se opakují častěji. Nahrávání tahů do JSON + nástroj na přehrání a ladění prahů.
- Rodičovská obrazovka schovaná (dlouhý stisk v rohu).

## Vizuální směr
Zvolen směr „Louka“ (nebe, kopce, bílé karty se stínem, koník jako průvodce, růžový inkoust, čísla v Andika). Návrhy všech obrazovek: https://claude.ai/artifact/B6paPUN6ZV5eYHhxzxF1Kz

## Aktivity
Obtahování číslice, psaní samostatně ($P/$Q recognizer, ověření očekávané číslice), dokresli N věcí, kolik jich je, spojování skupin s čísly, spojovačka 1–10, najdi a spočítej, tajné kouzlo (klepáním vybarvit políčka s daným číslem), oprav koníka (koník udělá chybu, Meda ji opraví), bleskový pohled (rozpoznat počet teček bez počítání), kolik se schovalo (rozklad čísla).
- Dokresli: počítají se jen stopy uvnitř velkých, jasně vyznačených zón. Věci na pevném místě = zóna na každou věc; volné věci = jedna zóna + shlukování. Tečka se počítá jako věc.
- Odměna: medaile odemykají věci do koníkovy stáje (sbírka, ne nekonečná hra).

## Session
Psaní a počítání jsou oddělené: psaní = jedno nové číslo + 1–2 k opakování (bez opakování a ≥30 min přibude druhé nové); počítání/poznávání = celý rozsah 1–10 (nastavitelné), každé číslo jednou, než se opakuje. Psaní a počítání se střídají, stejná aktivita nikdy dvakrát za sebou, délka se plní podle odhadu minut na aktivitu, zastávky po ~4 obrazovkách. Začít snadno, na konci znovu napsat nové číslo a skončit hrou. Nepřečtená čísla mají na tlačítkách tečkovou nápovědu (zmizí od úrovně 2). Pořadí psaní: 1, 7, 4 → 0, 6, 9 → 2, 3, 5 → 8 → 10.

## Tvary číslic
Kostry tahů (rámeček 100×160, cesta = tah, začátek = zelená tečka) jsou zdroj pravdy pro obtahování i šablony rozpoznávání. Desítka = „1“ + „0“ s posunem 0,82 šířky.

## Vývoj
- `npm run dev` (Vite, i na iPadu v síti), `npm run build` = typová kontrola + build do `dist/`.
- Push do `main` → GitHub Action nasadí na GitHub Pages: https://tallyho42.github.io/numberzzz/ (repo je veřejné).
- Rychlé otevření jedné aktivity: `#zkus=<typ>-<číslo>` (např. `#zkus=trace-3`), dále `#zkus=medaile|staj|rodice`.
- Kód: `src/core` (ink, recognizer $P, voice, progress, session), `src/activities` (jedna aktivita = funkce `(api, params)`), `src/screens`, `src/art` (koník jako SVG).

## Postup
1. Prototyp obtahování jedné číslice – ukázat uživateli na iPadu před pokračováním.
2. Engine + téma „koně“ + obtahování, psaní, kolik jich je, spojovačka.
3. Spojování, dokresli, najdi a spočítej, hlas, hvězdičky/medaile, rodičovská obrazovka.
4. Další témata, PWA.
