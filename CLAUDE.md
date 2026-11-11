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
Malovaný styl „Štětec“ podle předlohy pejska (suchý štětec, papír): teplý papír #F6F0E4, okrová/hnědá, inkoust #20150E, šalvějová zelená, růžová, hořčicová. Masy jsou malované (textura, světlé mezery u okrajů, štětiny, cákance), detaily (oči, nos, pusa, nohy, čísla) ostré inkoustové. Papírové karty (9-slice), tlačítka jako malované kulaté skvrny, čísla v Andika.
Původní směr „Louka“ (https://claude.ai/artifact/B6paPUN6ZV5eYHhxzxF1Kz) zůstává zmražený na tagu `v1`.

## Malování (src/paint)
- `brush.ts`: suchý štětec – z plochého SVG udělá malovanou vrstvu (směr tahů, `dry`, `zone`, `edge`, `bristle`, `grain`, `tone`, `speck`, `clean` pro papírové karty).
- Velké věci (zvířata po dílech, pozadí, domečky, karta, skvrny tlačítek, medaile, ikony) se pečou do `public/art/*.webp` v ateliéru: `npm run dev` → `/atelier.html?m=none`, v konzoli `await bakeAll()` (porovnání s předlohou: `await compare()` → `public/art/zz-preview.png`, nemazat do gitu; `atelier/ref.webp` je jen lokálně). Ikony: `await bakeIcons()` a přesunout z `public/art` do `public/`.
- Malé věci (předměty, pamlsky, dárky, balónky, obrázky spojovaček) maluje `runtime.ts` za běhu do cache; než je hotovo, ukazuje se ploché SVG.
- Zvíře = `core/critter.ts`: díly (ocas, tělo, hlava, uši) jako obrázky + inkoustový obličej SVG se všemi výrazy. Samo dýchá, mrká, kouká, vrtí ocasem; na ťuknutí dělá kousky (štěkne/zařehtá, jazyk, naklonění hlavy, skok, vrtění, šilhání, uši, otočka, kýchnutí). Tvary: `art/dogShapes.ts`, `art/horseShapes.ts`.

## Aktivity
Psaní: obtahování číslice (s čárkami / jen slabá číslice), psaní samostatně ($P recognizer, ověření očekávané číslice), oprav koníka (jen v testeru).
Počítání: kolik jich je, najdi a spočítej, spojování skupin s čísly, dokresli N věcí, kolik se schovalo, tajné kouzlo, spojovačka 1–10, ťukni na číslo (balónky, bez teček), nakrm zvířátko (dát přesně N), kde je víc/míň, hod kostkou (skákat po kamíncích), chybí kamínek (pořadí čísel). Bleskový pohled byl odebrán (nefungoval).
- Dokresli: počítají se jen stopy uvnitř velkých, jasně vyznačených zón. Věci na pevném místě = zóna na každou věc; volné věci = jedna zóna + shlukování. Tečka se počítá jako věc.
- Zvuky (`core/sound.ts`, Web Audio, bez souborů): ťuknutí na každé tlačítko, „oh-oh“ při každém `api.fail()`, žebřík tónů při počítání (`count(n)`), jiskra za tečku cesty, marimba za vyřešenou obrazovku, bubínek + fanfára u medaile, kouzlo + chroupání u dárku, balónek, kostka, kousky zvířete. Vypínač v rodičovském nastavení.
- Hlas oslovuje dítě jménem (oslovení v 5. pádě v rodičovském nastavení, výchozí „Medo“).

## Témata a odměny
- Téma = zvířátko (`src/themes`): koník (stáj; mrkev, jablko, podkova) a pejsek (bouda; kost, míček, párek). Přepínač na úvodní obrazovce, splněné téma má zlatou fajfku. Po dokončení koníka začíná malovaná verze pejskem.
- Každé téma má vlastní předměty k počítání a 10 dárků; medaile se počítají po tématech, každá odemkne další dárek. Pejsek dostává pamlsky od malých po velké (granulka, piškot, sušenka, párek, sýr, kostička, tyčinka, velká kost, stehýnko, dort) a na trávě rostou podle úrovně.
- Zvířátko je vidět na každé obrazovce (levý dolní roh) se všemi dárky: nošené na něm, ostatní vedle na trávě; doma (stáj/bouda) jsou všechny dárky na obrázku.

## Session
- Hra = několik cest k medaili (15 min ≈ 1, 30 min ≈ 3, 45 min ≈ 4). Cesta: počítání · obtahování s čárkami · 2× počítání · obtahování jen se slabou číslicí · 2× počítání · psaní bez nápovědy → medaile + dárek. Bez samolepek.
- V jedné cestě se píše jedno číslo; cesty střídají nové číslo a opakování (bez opakování a ≥2 cest přibude druhé nové). Počítání = celý rozsah 1–10 (nastavitelné), každé číslo jednou, než se opakuje; stejná aktivita nikdy dvakrát za sebou, max. jedna dlouhá hra (kouzlo, spojovačka, kostka) na cestu. Začít snadno.
- Nahoře pruh cesty: tečka za obrazovku (psaní růžové, počítání zelené), na konci medaile.
- Čísla na tlačítkách mají tečkovou nápovědu – vždy všechna, nebo žádné (zmizí, až mají všechna čísla v rozsahu počítání úroveň 2). Pořadí psaní: 1, 7, 4 → 0, 6, 9 → 2, 3, 5 → 8 → 10.

## Tvary číslic
Kostry tahů (rámeček 100×160, cesta = tah, začátek = zelená tečka) jsou zdroj pravdy pro obtahování i šablony rozpoznávání. Desítka = „1“ + „0“ s posunem 0,82 šířky.

## Vývoj
- `npm run dev` (Vite, i na iPadu v síti), `npm run build` = typová kontrola + build do `dist/`.
- Push do `main` → GitHub Action nasadí na GitHub Pages (repo je veřejné): malovaná verze z `main` na https://tallyho42.github.io/numberzzz/pejsek/, původní verze z tagu `v1` zůstává na https://tallyho42.github.io/numberzzz/. Obě sdílejí pokrok (stejný localStorage).
- Rychlé otevření jedné aktivity: `#zkus=<typ>-<číslo>` (např. `#zkus=trace-3`), dále `#zkus=medaile|staj|rodice`.
- Kód: `src/core` (ink, recognizer $P, voice, progress, session, critter), `src/activities` (jedna aktivita = funkce `(api, params)`), `src/screens`, `src/art` (tvary zvířat, předměty, scény), `src/paint` (štětec, ateliér).

## Postup
1. Prototyp obtahování jedné číslice – ukázat uživateli na iPadu před pokračováním.
2. Engine + téma „koně“ + obtahování, psaní, kolik jich je, spojovačka.
3. Spojování, dokresli, najdi a spočítej, hlas, hvězdičky/medaile, rodičovská obrazovka.
4. Další témata, PWA.
