# Numberzzz – Kouzelná čísla

Webová hra (HTML/TS) na čísla 0–10 pro pětiletou Medu, iPad na šířku, ovládání Apple Pencilem. Digitální verze papírových pracovních sešitů.

## Pravidla návrhu
- Meda neumí číst: **všechny pokyny hlasem česky** (Web Speech API cs-CZ, později nahrávky rodičů – jedno audio na text). Na obrazovce jen obrázky, čísla, ikony.
- Žádné tresty ani červené křížky. Chyba = jemné „zkusíme to znovu“, po 2 neúspěších ukázka.
- Hvězdička za obrazovku, medaile za úroveň. Úroveň trvá 10–15 min a skončí.
- Dvojité ťuknutí nesmí zoomovat Safari (main.ts ruší druhý touchend a případný zoom vrací).
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
- Velké věci (zvířata po dílech, pozadí, domečky, karta, skvrny tlačítek, medaile, ikony) se pečou do `public/art/*.webp` v ateliéru: `npm run dev` → `/atelier.html?m=none`, v konzoli `await bakeAll()` (jen něco: `await bakeOnly(['turtle','home-turtle'])`) (porovnání s předlohou: `await compare()` → `public/art/zz-preview.png`, nemazat do gitu; `atelier/ref.webp` je jen lokálně). Ikony: `await bakeIcons()` a přesunout z `public/art` do `public/`.
- Malé věci (předměty, pamlsky, dárky, balónky, obrázky spojovaček) maluje `runtime.ts` za běhu do cache; než je hotovo, ukazuje se ploché SVG.
- Zvíře = `core/critter.ts`: díly (ocas, tělo, hlava, uši) jako obrázky + inkoustový obličej SVG se všemi výrazy; každý díl drží pózu (`Rig`), takže pohyby navazují. Samo dýchá, mrká, kouká, čenichá, vrtí ocasem. Ťuknutí = delší sestava o několika krocích s efekty (srdíčka, noty, hvězdičky, kapky, prach): radostné skoky, otřepání, vytí, honění ocasu, kýchnutí, výzva ke hře, zvědavé naklánění, olizování, kuk za ušima. Ťuknutí na pamlsek u zvířete (i nový pamlsek u medaile) = přiletí mu do pusy, sní ho a pamlsek se vrátí na místo.

## Aktivity
Psaní: obtahování číslice (s čárkami / jen slabá číslice), psaní samostatně ($P recognizer, ověření očekávané číslice), oprav koníka (jen v testeru).
Počítání: kolik jich je, najdi a spočítej, spojování skupin s čísly, dokresli N věcí, kolik se schovalo, tajné kouzlo, spojovačka 1–10, ťukni na číslo (balónky, bez teček), nakrm zvířátko (dát přesně N), kde je víc/míň, hod kostkou (skákat po kamíncích), chybí kamínek (pořadí čísel). Bleskový pohled byl odebrán (nefungoval).
- Dokresli: počítají se jen stopy uvnitř velkých, jasně vyznačených zón. Věci na pevném místě = zóna na každou věc; volné věci = jedna zóna + shlukování. Tečka se počítá jako věc.
- Zvuky (`core/sound.ts`, Web Audio, bez souborů): ťuknutí na každé tlačítko, „oh-oh“ při každém `api.fail()`, žebřík tónů při počítání (`count(n)`), jiskra za tečku cesty, marimba za vyřešenou obrazovku, bubínek + fanfára u medaile, kouzlo + chroupání u dárku, balónek, kostka, kousky zvířete. Vypínač v rodičovském nastavení.
- Jméno (5. pád v rodičovském nastavení, výchozí „Medo“) zazní jen v pozdravu „Ahoj Medo!“: na začátku cesty za medailí a jednou po otevření hry. Jinde se neoslovuje.

## Témata a odměny
- Téma = zvířátko (`src/themes`): koník (stáj; mrkev, jablko, podkova), pejsek (bouda; kost, míček, párek), želvička (jezírko; jahoda, lísteček, mušlička) a jednorožec (zámek; dortíček, diamant, srdíčko). Přepínač na úvodní obrazovce, splněné téma má zlatou fajfku. Po dokončení koníka začíná malovaná verze pejskem.
- Téma nese i gramatiku (`animal.g` → „dostal/dostala“, „mu/jí“), slovo pro odměny (pejsek „pamlsky“, jinak „dárky“), misku a sloveso na louce. Želvička nemá uši → „Dokresli uši“ se u ní mění na misku; místo kuk za ušima schová hlavu do krunýře (díl `front` = bříško před hlavou).
- Rodičovská obrazovka: „Odměny zvířátek“ nastaví plus/mínus, kolik dárků zvíře má (0–8), nebo je vynuluje (celkový počet medailí ve statistice zůstává).
- Každé téma má vlastní předměty k počítání a 8 dárků (`src/themes/rewards.ts`): střídá se doplněk a pamlsek (doplněk, pamlsek, …), pamlsky rostou od malého po obří dort. Doplňky: pejsek obojek/mašle/šátek/kšiltovka, koník ohlávka/mašle/zvoneček/korunka, želvička čepička/kytička/korálky/mašle, jednorožec hvězdička/věneček/náhrdelník/mašle. Medaile se počítají po tématech, každá odemkne další dárek.
- Doma (stáj, bouda…) se dárky z poličky přetahují ke zvířátku: pamlsek sní (víc soust a radosti u velkých), doplněk zůstane, kam ho Meda položí (`store.placed`, na hlavě nebo těle podle průhlednosti dílů) a ukazuje se na všech obrazovkách. Nasazený doplněk jde vzít a přesunout; puštěný mimo zvířátko se sundá.
- Zvířátko je vidět na každé obrazovce (levý dolní roh) s doplňky na sobě a pamlsky vedle na trávě (ťuknutím mu je dá).

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
