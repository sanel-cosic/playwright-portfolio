# QAP-4 nIT UI overhaul (v2) Test Plan

## Application Overview

Test plan for Jira epic QAP-4 "nIT - UI overhaul (v2)" and stories QAP-5 ... QAP-13 (home shell, services tabs, language switcher with Croatian, window/door configurator, six-page business system). Verified in the browser on 2026-11-16 against https://nit.uganjaj.ba (Chromium, bs). The old one-page tools workbench is gone, so the old page objects QuoteCalculator, PlannerPanel, OrdersPanel, StockPanel and most of NitHomePage are dead (see suite 12 for the new page-object layout, the accept-a-quote helper and the files/data to delete). 67 scenarios, each mapped to a QAP story/AC. Conventions (CLAUDE.md): Bosnian texts, no pricing/planning formulas re-implemented (only relationships, boundaries, metamorphic rules and explicit page rules), no contact details or person names asserted, no waitForTimeout, locators only in page objects, @smoke on critical paths. Business-system state lives in localStorage key nit-business-system-v1 (undo stack in sessionStorage key nit-business-system-v1-undo); every Playwright test gets a fresh context, so each test starts from the seed (8 orders RN-2601...RN-2608). Dates on the business pages are relative to today (quote delivery = today + 11 days, plan weeks start next Monday): never assert dates, only relations between them. Third-party iframes (kjtools.ba, bih.uganjaj.ba) are out of scope; kjtools.ba currently logs a 404 for /assets/runtime/showroom.mjs, and three.js logs a WebGL warning: neither may fail a test. Tool hazards seen while exploring: do not click elements inside a hidden tab panel (Playwright waits forever, e.g. the "Dogovorimo saradnju" button before the "Eksterni IT saradnik" tab is selected) and do not read the project panel with whole-DOM scans (it contains cross-origin iframes). Seed for every suite: tests/nit/seed.spec.ts (home with the services tabs ready); business-system and configurator tests start with their page object's goto() instead (the seed only proves the site is reachable). Note: planner_setup_page ran the saucedemo auth setup instead of the nIT seed (project selection), so exploration was done by navigating directly.

## Test Scenarios

### 1. 1. Traceability and observed deviations

**Seed:** `tests/nit/seed.spec.ts`

#### 1.1. Traceability matrix (AC to scenario)

**File:** `specs/QAP-4.md`

**Steps:**
  1. QAP-5 (home shell): AC1 title/H1/no errors -> 2.1, 2.2. AC2 Projekti scrolls + skip link -> 2.3, 2.4. AC3 dialog opens, closes via x and Escape -> 3.1, 3.2. AC4 context line only for context triggers -> 3.3, 3.4. AC5 copy feedback -> 3.5. AC6 animation toggle both ways -> 2.5. AC7 no horizontal scroll 390x844 -> 2.6.
    - expect: Every QAP-5 AC has at least one scenario
  2. QAP-6 (services): AC1 four tabs / first selected / one visible panel -> 4.1. AC2 keyboard navigation (exists, verified) -> 4.2. AC3 project tabs switch heading, single pressed view button -> 4.3, 4.4. AC4 app tabs switch copy -> 4.5. AC5 six steps in order with lang -> 4.6. AC6 #proizvodnja deep link (plus #aplikacije, #it-podrska) -> 4.7.
    - expect: Every QAP-6 AC has at least one scenario
  3. QAP-7 (language): default bs -> 5.1. each button translates H1 + html lang + aria-pressed -> 5.2. survives reload -> 5.3. ?lang= preselects -> 5.4. JS-generated tab names translated + summary announces language -> 5.5. language carries to /poslovni-sistem/ links (and business-page language links) -> 5.6.
    - expect: Every QAP-7 AC has at least one scenario
  4. QAP-8 (configurator): default Luma positive price -> 6.1. model switch -> 6.2. out-of-range clamped (Observed: clamped, per-model ranges) -> 6.3. bigger size never less profile/glass -> 6.4, 6.5. total = unit x qty -> 6.6. reset -> 6.7. 'Pogledajte sta dobija firma' switches to view 02 -> 6.8. embedded iframe + standalone link (Changes section) -> 6.9. add to demo inquiry (Changes section, not an AC) -> 6.10.
    - expect: Every QAP-8 AC has at least one scenario
  5. QAP-9 (shell): fresh gating -> 7.1. unlock after accept + aria-current -> 7.2. persistence across reload/pages -> 7.3. undo reverts last change only -> 7.4. reset restores seed (relock) -> 7.5. back link lands on production tab -> 7.6. order picker (RN-2601...2608, RN-2609 appended) -> 9.1.
    - expect: Every QAP-9 AC has at least one scenario
  6. QAP-10 (quote): total = unit x qty -> 8.1. 50>100>500 cost/kom -> 8.2. margin is share of price, suggest price hits target and clears warning, below-target warning -> 8.1, 8.3. invalid inputs rejected -> 8.4. breakdown -> 8.5. preview hides internal cost/margin -> 8.6. preview->save->accept creates RN-2609 and unlocks 02-05 -> 8.7.
    - expect: Every QAP-10 AC has at least one scenario
  7. QAP-11 (material + plan): reservation increases Rezervisano by need, Nedostaje >= 0 -> 9.1, 9.2. plan blocks unreserved order -> 9.3. only suitable machines -> 9.4. clash reported and not confirmable -> 9.5. first free slot confirmable, shown in grid -> 9.6. earlier start never later finish -> 9.7.
    - expect: Every QAP-11 AC has at least one scenario
  8. QAP-12 (work + quality): logging N pieces (Obradeno +N, Za kupca unchanged, Ceka kontrolu +N) -> 10.1. pieces > remaining rejected -> 10.2. downtime in total and log -> 10.3. inspection buckets -> 10.4. over-allocation not confirmable -> 10.5. rework confirm -> ready -> 10.6. more scrap never lowers expected cost/kom -> 10.7.
    - expect: Every QAP-12 AC has at least one scenario
  9. QAP-13 (overview): Preostaje = Vrijednost - Ocekivani -> 11.1. what-if monotonic, Osnova restores -> 11.2. customer filter <= count, Svi restores (and machine filter) -> 11.3. breakdown sums to ocekivano -> 11.4. tools below minimum flagged -> 11.5. upstream changes reflected + works on seed -> 11.1, 11.6.
    - expect: Every QAP-13 AC has at least one scenario
    - expect: No scenario falls outside the ACs except 6.9, 6.10 (Changes section) and the Observed-driven 2.2, 2.6

#### 1.2. Observed deviations, possible bugs and unverified items (read before implementing)

**File:** `specs/QAP-4.md`

**Steps:**
  1. OBSERVED (QAP-5): the 'Dogovorimo saradnju' trigger lives inside the hidden panel #service-external; it cannot be clicked until the tab 'Eksterni IT saradnik' is selected. Context line #contact-context text equals the trigger's data-interest value ('Eksterni IT saradnik' for the services trigger, 'Konfigurator i priprema proizvodnje' for 'Zelim nesto ovakvo za svoj posao'); it is display:none (empty) for the nav trigger and is cleared when the dialog is reopened via the nav. Copy feedback text is 'Email adresa kopirana.' and appears in Chromium without granting clipboard permission (clipboard content itself not verified). #thread-pause: name 'Pauziraj animaciju' + aria-pressed=false; after click name 'Pokreni animaciju' + aria-pressed=true. Own requests are all 2xx/3xx (konfigurator.html?embed=1 answers 307 to /konfigurator?embed=1, .html business URLs also 307 to the extensionless URL, query preserved). Console: kjtools.ba showroom.mjs 404 (third-party) and a THREE.WebGLShadowMap warning only.
    - expect: Tests select the external tab first and ignore third-party console noise
  2. POSSIBLE BUG / a11y (QAP-5): the contact dialog has no accessible name in the accessibility tree (role dialog, name empty; the business-system dialogs do use aria-labelledby). Locate it with #contact-dialog (page object) and let the generator add getByRole('dialog', {name}) later if the name is added. Not confirmed in the DOM (aria-labelledby was not inspected).
    - expect: Reported, not asserted
  3. OBSERVED (QAP-6): the services tablist DOES have keyboard navigation: ArrowRight/ArrowLeft move focus and select (automatic activation), they wrap (ArrowLeft on the first tab selects the last), Home/End jump to first/last, roving tabindex (selected tab 0, others -1). Selecting a tab writes the hash: #aplikacije, #proizvodnja, #it-podrska (Web tab hash not verified); /?lang=bs#aplikacije|#proizvodnja|#it-podrska select the right tab on load. Project views differ per project: KJ Tools = 'Web i katalog' / 'Katalog proizvoda' / 'Tehnicki zahtjev' (badge 'Realizovano za klijenta', link https://kjtools.ba/?lang=bs); UGANJAJ = 'Web platforma' / 'Pretraga i oglasi' / 'Poslovna stranica' ('Nas projekt - beta', https://uganjaj.ba/); Atlas BiH = 'Mjesta i price' / '3D karta' ('Nas projekt - u razvoju', https://bih.uganjaj.ba/). Keyboard on the project tabs and app tabs was NOT verified. One first click on #tab-uganjaj did not switch the tab (not reproduced): use web-first assertions on aria-selected.
    - expect: Keyboard scenario 4.2 is in scope; project/app keyboard left out
  4. OBSERVED (QAP-7): Hrvatski is a real option (button aria-label 'Hrvatski', data-language=hr, flag hr.svg) but it reuses the Bosnian strings: H1, tab names, tablist names and <title> are identical to bs; only html lang=hr, aria-pressed, ?lang=hr, localStorage nit-language=hr and the summary label 'Jezik i pismo: Hrvatski' differ. Srpski: html lang is 'sr-Cyrl' and all copy is Cyrillic. The production-panel links carry the chosen language only for bs/en/de (?lang=en, ?lang=de); for hr and sr they keep ?lang=bs (the business system only offers Bosanski/English/Deutsch). Switching language rewrites the URL (?lang=xx) and the embedded configurator iframe src (konfigurator.html?embed=1&lang=en). Summary aria-label per language: 'Jezik i pismo: Bosanski' / 'Jezik i pismo: Hrvatski' / 'Language and script: English' / 'Sprache und Schrift: Deutsch' / 'Jezik i pismo' in Cyrillic 'Језик и писмо: Српски'. The summary is a <summary> (no ARIA role): locate details.language-flags > summary structurally. The German name of the services tablist was not read (en 'Services', sr 'Услуге').
    - expect: Tests assert only what differs per language; hr = bs strings is documented, not treated as a failure
  5. OBSERVED (QAP-8): the AC range 800-1200 x 1900-2500 holds only for Linea and Luma (default 1000x2100). Solo, Duo and Panorama: 600-2400 x 600-2200, default 1400x1300. Luma Plus: 1250-2000 x 1900-2500, default 1500x2100. The range is printed on the page ('Demo raspon: sirina ... visina ... mm.') and mirrored in the input min/max. Out-of-range input is CLAMPED on commit (blur/Tab), not rejected: 5000 -> 1200 and 100 -> 1900 for Luma; the number input is never natively invalid and the slider follows. Quantity has min 1, max 20 and is clamped too (25 -> 20), not mentioned in the AC. Switching model resets width/height to the model default but keeps the quantity; the reset button restores Luma, 1000x2100 and quantity 1. For Luma the glass area (0,56 m2) does not change with frame size (glass size is set in the Staklo tab), so 'bigger frame never less glass' is only >= there; profile length grows strictly (1000->1200 wide: 11,44 -> 12,24 m). Staklo tab: 'Vrsta stakla' (Dvoslojno/Troslojno), 'Sirina stakla mm', 'Visina stakla mm'; wider glass 430->600 mm and Troslojno raised glass area and price. The badge on '02 Sta vidi firma' starts at 1 (the current selection) and stays 1 when the same Luma is added, going to 2 after adding Duo. Add-to-inquiry status: 'Stavka je u demo upitu. Mozete dodati drugi model ili otvoriti pregled firme.' Firm view: region 'Poslovni pregled', heading 'Ponuda i priprema proizvodnje', 'Ponuda P-2026-014', line headings 'Luma - 1 kom', 'Duo - 1 kom'; the region 'Kupcev konfigurator' becomes hidden; sub-tabs Ponuda/Materijal/Rezanje/Sklapanje/Isporuka. No data-test attributes or roles exist for the price numbers (unit price, total, chips): they need getByText/filter locators.
    - expect: Tests read ranges from the page, never hard-code them
  6. OBSERVED (QAP-9): steps 02-05 are <a aria-disabled='true' title='Najprije pripremite i prihvatite ponudu.'> without href and WITHOUT role=link (accessibility tree shows a generic): getByRole('link') does not find them, use getByTitle. The locks are rendered only on page 01. Opening /poslovni-sistem/plan, materijal, proizvodnja, kvalitet or pregled directly on a fresh browser shows all six steps enabled and the pages are fully usable (no redirect, no message). After 'Nova ponuda iz predloska' on page 01 the locks come back although RN-2609 exists (the lock follows the current draft's acceptance, not the order list). After Reset on page 01 (seed state, 8 orders) the steps are locked again. Header: link 'Povratak na nIT' (href https://nit.uganjaj.ba/?lang=..#proizvodnja, lands on the selected production tab), logo link 'nIT pocetna'. Language: <details class='lang'> with summary aria-label 'Jezik' (flag img alt = current language) and three LINKS (not buttons) Bosanski / English / Deutsch to the same page with ?lang=; there is no Hrvatski/Srpski there. Step-nav landmark name: 'Tok jednog naloga' (de: 'Ein Auftrag von Anfang bis Ende'). Undo button 'Vrati posljednju promjenu' is disabled with an empty undo stack; toasts (role=status with a x button): 'Posljednja promjena je vracena.', 'Vraceni su pocetni podaci.'. The selected order is persisted in state: it carries over to the next page and reload; ?order=8 (index) preselects. 9 options 'RN-260x - <dio>' after acceptance. Seeded customers: Adria oprema, Tehno fluid, Metal servis. 4 machines: CNC-01/02 Glodalica 3 ose, CNC-03 Glodalica 5 osa, CNC-04 Strug.
    - expect: Gating tests run on page 01 only
  7. POSSIBLE BUG (QAP-9): the business-page language switch is not announced in the page language: summary aria-label stays 'Jezik' on the German page (and does not name the current language, unlike the home page). Also the gating is only a visual nav lock; the 02-05 pages stay reachable by URL (may be by design, flag to the owner).
    - expect: Reported, not asserted
  8. OBSERVED (QAP-10): validation is NATIVE, not a message in #quote-error. Invalid values (qty 0 -> 'Value must be >= 1', qty 10.5 -> step mismatch, 'Dodatak za skart' 41 > max 40, 'Ciljana marza' 80 > max 79) make the input :invalid, 'Pregledaj ponudu za kupca ->' does not open the preview (browser focuses the field), and the whole result block is replaced by the text 'Dopunite ispravne podatke za novi obracun.' (div.qt-incomplete). #quote-error (role=alert) stays empty/hidden in all these cases. Native validationMessage is browser-locale text (English in Chromium): assert input.validity.valid === false via evaluate, not the message. Limits: qty 1-10000 step 1, scrap 0-40, margin 0-79 step 0.1. Seed draft: part 'Nosac M12', customer 'Adria oprema', qty 100, price 38,50, target margin 20, per piece 32,45 KM, series 3.244,63 KM, total 3.850,00 KM, 'Ostaje' 605,37 KM, 'Marza: 15,7% - Nije neto dobit.', warning 'Trenutna cijena je ispod ciljane marze.'. Suggest price -> 40,56 (total 4.056,00, remaining 811,37, margin 20,0%, warning gone). Scrap 10% raised cost per piece 32,45 -> 35,34. 'Isti dio, druga kolicina': 50 kom 39,15 / 100 kom 32,45 / 500 kom 27,09 KM per piece; a click applies the quantity to the form (qty 50 -> series 1.957,31) and sets aria-pressed; the three buttons are DISABLED while an accepted quote is shown, until 'Nova ponuda iz predloska'. Breakdown (details #quote-breakdown): seven rows Materijal 845,25 / Programiranje 280,00 / Priprema 390,00 / Obrada 1.125,00 / Alati 210,00 / Kontrola 160,00 / Rezije 234,38 (sum 3.244,63 = series cost). POSSIBLE a11y BUG: these buttons' accessible names are just the amounts ('845,25 KM ->'); the category is a sibling label (on page 06 the buttons do have aria-labels like 'Materijal: 870,61 KM'). A breakdown button opens dialog#quote-formula (NOT #detail-dialog) titled with the category, containing 'Obracun za novu seriju' and e.g. '100 x 2,450 kg x 3,45 KM' = '845,25 KM'. Preview dialog #quote-preview: 'Pregled prije cuvanja / Ponuda za kupca', quote number P-2026-001 'verzija 1', customer, 'Vas upit', validity, qty, price per piece, base, VAT, total, payment, delivery terms and the note 'Interni troskovi i marza nisu dio ovog dokumenta.'; no cost/margin text. After 'Sacuvaj ovu verziju ponude' the SAME dialog stays open and the button becomes 'Oznaci da je kupac prihvatio'; #quote-record shows 'Sacuvana ponuda'. After accept the dialog closes, toast 'Prihvatanje kupca je zabiljezeno. Kreiran je novi nalog.', #quote-record badge text 'Kupac je prihvatio' (uppercase via CSS only), link 'Otvori novi nalog RN-2609 ->' (href materijal.html?lang=bs&order=8), buttons 'Otvori sacuvanu ponudu', 'Nova ponuda iz predloska'. Preview price follows the form price. Details sections (all <details>, closed): #technology, #company-rules, #quote-breakdown, #customer-terms; 'Dodatak za skart' is inside #technology.
    - expect: 8.4 asserts validity + incomplete text, not #quote-error
  9. OBSERVED (QAP-11): new order RN-2609 is steel with Potrebno 274,4 kg and Raspoloziva 608,6 kg, so Nedostaje is 0,0 and 'Simuliraj prijem materijala' is disabled; the shortage case is seeded order RN-2602 (aluminium: Potrebno 172,2, Raspolozivo 121,7, Nedostaje 50,5, KPI 'Dolazak materijala' = 'Utorak', 'Rezervisi materijal' disabled). Simulating the receipt adds exactly the shortage to Na stanju (180,0 -> 230,5 kg), Nedostaje -> 0,0, KPI -> 'Zaprimljeno', toast 'Demo prijem evidentiran.', button text 'Demo prijem evidentiran' (disabled), 'Rezervisi materijal' enabled. Reserving RN-2609: Rezervisano of Celik C45 311,4 -> 585,8 kg (+274,4 = Treba nalogu), toast 'Materijal rezervisan za odabrani nalog.', button becomes 'Rezervisano za nalog' (disabled); KPI Raspolozivo stays 608,6 (it is 'Nakon drugih rezervacija' = Na stanju - Rezervisano before this order). KPIs are plain <div class='kpi'> (span label + b value, no roles). Page 03: an unreserved NEW order shows only the panel 'Prvo osigurajte materijal' with 'Ovaj nalog jos nema rezervisan materijal. Rezervisite ga prije potvrde termina.' and link 'Otvori materijal ->' (seeded RN-2601 is unreserved too but already in production and shows the planner, so the block applies to the new order). Machine options follow the part: milling parts (Nosac M12, RN-2609) offer CNC-01, CNC-02, CNC-03 only; lathe part RN-2604 (Osovina) offers only CNC-04 (hint 'Prikazane su odgovarajuce masine.'); days Ponedjeljak-Petak x Sedmica 1-4 (20 options), start 08:00-15:30 every 30 min (16 options). Default slot CNC-01, Srijeda Sedmica 1, 12:30 is free (status 'Termin je slobodan. Mozete ga potvrditi.', 'Procijenjeni zavrsetak: dd.mm.yyyy. - hh:mm', Preostalo rada 15,0 h, Status plana 'Ceka termin'). Ponedjeljak 08:00 on CNC-01 clashes: status (class flow-feedback warn) 'Termin se preklapa s nalogom RN-2601.', 'Potvrdi termin' disabled, finish was earlier than the Wednesday slot (24.11. 15:00 vs 27.11. 11:30 on the test day). 'Prvi slobodan termin' returned to Srijeda 12:30 (not the earliest slot of the week: it is the first free slot after the clash search). Confirm: status 'Termin potvrden', toast 'Termin je provjeren i sacuvan.', grid button 'RN-2609 - 15,0 h' on the CNC-01 row (equals Preostalo rada). Link 'Prati izvrsenje ->' (proizvodnja) sits outside #workspace.
    - expect: Plan tests derive free/clash slots from the status text, not from fixed dates
  10. OBSERVED (QAP-12): 04 table 'Nalozi u radu' (Nalog | Obradeno | Za kupca | Preostalo): RN-2609 starts '0 / 100 | 0 / 100 | 15,0 h' (seeded orders show a bigger target, e.g. RN-2601 '60 / 103 | 52 / 100'). Form defaults 5 kom / 45 min / 0 min; header 'RN-2609 - Nosac M12 / CNC-01 - Preostalo: 100 kom' with state 'Spremno za rad' (before first entry; 'U radu' after). Saving 5 pieces: row '5 / 100 | 0 / 100 | 14,3 h', toast 'Rad je evidentiran. Plan, kontrola i troskovi su azurirani.', header 'Preostalo: 95 kom', log 'Unos rada / 5 kom - 45 min - 0 min zastoj'. Pieces 96 (> remaining): input max=95, status (flow-feedback) 'Kolicina prelazi preostale komade naloga.', 'Sacuvaj unos' DISABLED. Downtime 30 min + reason 'Kvar' (select Razlog zastoja: Podesavanje, Cekanje alata, Cekanje materijala, Kvar, Ostalo): 'Dosadasnji zastoji' 30 min, log '5 kom - 45 min - 30 min zastoj' (reason not shown in the log), Ocekivani trosak 3.245 -> 3.282 KM. POSSIBLE minor BUG: downtime 481 (max 480) makes the input natively invalid, but the status still says 'Unos je spreman za cuvanje.' and 'Sacuvaj unos' stays enabled (the click is blocked by native validation, focus moves to the field); pieces > remaining shows a message and disables the button, downtime does not. Page 05 after 10 pieces: KPIs Obradeno 10, Ceka kontrolu 10, Na doradi 0, Spremno za kupca '0 / 100'; inputs Prihvaceno 10 / Skart 0 / Dorada 0, select Uzrok (Mjere van tolerancije, Povrsinsko ostecenje, Greska programa, Alat, Materijal), status 'Rasporedeno: 10 / 10 kom', hint 'Zbir prihvacenih, odbacenih i komada za doradu ne moze biti veci od kolicine koja ceka kontrolu.', 'Ocekivani trosak / kom' 32,82 KM. After 'Potvrdi kontrolu' with 5 / 3 / 2: Ceka kontrolu 0, Na doradi 2, Spremno 5 / 100, 'Evidentirani skart' '3 kom' '30,0%' (= 3 of 10 processed), cause 'Mjere van tolerancije 5 kom', cost per piece 32,82 -> 33,66 KM (up), toast 'Kontrola je evidentirana u nalogu i pregledu firme.', 'Potvrdi kontrolu' disabled ('Rasporedeno: 0 / 0 kom'), 'Potvrdi doradu i prihvati komade' enabled. After the rework confirm (toast 'Dorada zavrsena; komadi su prihvaceni.') the whole inspection workspace is REPLACED by 'Ova kontrola je zavrsena / Provjereni su svi obradjeni komadi. Za preostalu kolicinu nastavite obradu.' with link 'Nastavi obradu ->' (no KPIs left on page 05); the result is visible on page 04: row '10 / 103 | 7 / 100 | 14,5 h' (5 accepted + 2 reworked = 7 for customer; target grew to 103 for the 3 scrapped). The over-allocation case (sum > pieces waiting) was NOT exercised in the browser.
    - expect: 10.5 is marked unverified; assertions limited to what the page text states
  11. OBSERVED (QAP-13): filters Historija ('4 sedmice'/'8 sedmica' default), Masina ('Sve masine', CNC-01..CNC-04), Kupac ('Svi kupci', Adria oprema, Tehno fluid, Metal servis); group 'Sta ako materijal poskupi?' buttons Osnova/+10%/+20% (aria-pressed), note '+10% - Dodatni trosak: 876,30 KM - Ugovorene cijene ostaju iste.'. Historija only changes the chart (8 weeks S1..S8, SVG role=img 'Historija vrijednosti poslova i troskova'), counts and totals do not change. With RN-2609 accepted/planned/worked: '9 naloga', Vrijednost 35.934 KM, Ocekivani 31.766 KM, Preostaje 4.168 KM (exactly Vrijednost - Ocekivani; also true for +10% 32.643/3.291, +20% 33.519/2.415, Adria 13.724/12.778/946); Vrijednost does not change with what-if; RN-2609 line 'Materijal' 870,61 -> 957,67 -> 1.044,73; 'Plan / ocekivano' '3.245 KM / 3.366 KM' -> '3.453' -> '3.540'; Marza 12,6% -> 10,3% -> 8,1%. Kupac 'Adria oprema' -> '4 naloga' (RN-2601, 2603, 2606, 2609); Masina CNC-04 -> '2 naloga' (RN-2604, RN-2606) and the cards that depend on it narrow, invoices ('Fakturisano / naplaceno*') do not follow the machine filter by the page's own footnote. 'Kalkulacija i odstupanja' buttons have aria-labels 'Materijal: 870,61 KM', 'Programiranje: 280,00 KM', 'Priprema', 'Obrada', 'Alati', 'Kontrola', 'Rezije', 'Zastoji i dorada: 48,75 KM'; their sum (3.365,82) matches the 'ocekivano' 3.366 within rounding, and the 'Zastoji i dorada' line is part of that sum. 'Alati i odrzavanje': rows div.toolrow with the stock number in <b class='warn'> (Glodalo O12 3/5, Burgija O10 2/4) or class 'good' (Plocica CNMG 18/10): POSSIBLE a11y BUG: below-minimum is flagged only by colour/class, no text or ARIA. Link 'Razgovarajmo o vasem poslu' goes to ../?lang=bs#kontakt which is now the page FOOTER (id=kontakt), not the contact dialog. The pure seed values of page 06 (before any change) were not captured; scenarios assert relations, not numbers.
    - expect: 11.x assert relations and flags, not absolute KM values
  12. UNVERIFIED (could not or did not check): German name of the home services tablist; Escape-key focus return to the trigger button; actual clipboard content after 'Kopiraj email adresu'; keyboard navigation of the project/app tablists; hash written by the Web tab; keyboard focus order in dialogs; the 3D/technical view toggles and 'Izgled' tab colours of the configurator; 'Preuzmi ponudu' and 'Stampaj ponudu'; whether pages 04/05 work on an order that never went through accept/reserve/plan (seeded RN-2601... exist but were not exercised, so the work/quality scenarios use the full chain helper); the over-allocation behaviour on page 05 (10.5); multi-step undo, undo after reset, and undo across pages; English/German texts of pages 02-06; Firefox and WebKit behaviour (clamp-on-commit and <details> clicks should be re-checked there); the first-load behaviour of the iframes under slow networks; reduced-motion handling of #thread-pause.
    - expect: Generator treats these as risks, not facts

### 2. 2. QAP-5 Home shell (home.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 2.1. page title and heading identify the site @smoke

**File:** `tests/nit/home.spec.ts`

**Steps:**
  1. nitHome.goto('?lang=bs'). Read page title and the h1 (nitHome.heading = getByRole('heading', { level: 1 })).
    - expect: page title is 'nIT — Web stranice, aplikacije i poslovni sistemi'
    - expect: h1 accessible name matches /Web stranice i aplikacije\.\s*Alati za vaš posao\./ (the <em> part is a block child: use toHaveAccessibleName with the regex, not toHaveText)
    - expect: header nav 'Glavna navigacija' contains link 'Projekti' and button 'Kontakt ↗'

#### 2.2. page loads without script errors or own failed requests

**File:** `tests/nit/home.spec.ts`

**Steps:**
  1. Before goto, attach page.on('pageerror') and page.on('response'); load /?lang=bs, wait for the services tab to be selected, select each of the four service tabs once.
    - expect: no pageerror
    - expect: no response with status >= 400 whose host is nit.uganjaj.ba (kjtools.ba and bih.uganjaj.ba responses and console errors, and the THREE.js warning, are ignored; 307 redirects are fine)

#### 2.3. skip link moves to the main content

**File:** `tests/nit/home.spec.ts`

**Steps:**
  1. Press Tab once on a fresh load; the first focused element is the skip link (nitHome.skipLink = getByRole('link', { name: 'Preskoči na sadržaj' })). Press Enter.
    - expect: skip link has focus after the first Tab
    - expect: URL hash becomes #sadrzaj and main#sadrzaj is in the viewport

#### 2.4. Projekti link scrolls to the projects section

**File:** `tests/nit/home.spec.ts`

**Steps:**
  1. Click nav link 'Projekti' (nitHome.projectsLink).
    - expect: URL ends with #projekti
    - expect: section#projekti is in the viewport (toBeInViewport)
    - expect: the Web tab is still the selected service tab

#### 2.5. animation toggle pauses and resumes

**File:** `tests/nit/home.spec.ts`

**Steps:**
  1. Locate nitHome.animationToggle (getByRole('button', { name: /animaciju/ }); #thread-pause). It starts as 'Pauziraj animaciju' with aria-pressed=false. Click it, then click again.
    - expect: after the first click: accessible name 'Pokreni animaciju' and aria-pressed=true
    - expect: after the second click: 'Pauziraj animaciju' and aria-pressed=false

#### 2.6. no horizontal scroll at 390x844 on home, configurator and the six business pages

**File:** `tests/nit/home.spec.ts`

**Steps:**
  1. test.use({ viewport: { width: 390, height: 844 } }). Data-driven over '/?lang=bs', '/konfigurator.html?lang=bs' and the six /poslovni-sistem/<page>.html?lang=bs pages. After load (heading visible) evaluate document.documentElement.scrollWidth - window.innerWidth.
    - expect: scrollWidth does not exceed innerWidth (observed: no overflow on any of the 8 pages)

### 3. 3. QAP-5 Contact dialog (contact.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 3.1. Kontakt button opens the contact dialog @smoke

**File:** `tests/nit/contact.spec.ts`

**Steps:**
  1. nitHome.goto(); click nitHome.mainNav button 'Kontakt ↗'.
    - expect: ContactDialog.root (#contact-dialog) is visible/open
    - expect: heading 'Razgovarajmo o projektu' is visible
    - expect: buttons 'Zatvori kontakt' and 'Kopiraj email adresu' are visible
    - expect: do not assert the e-mail/phone text or links (not allowed by CLAUDE.md)

#### 3.2. contact dialog closes via the x button and via Escape

**File:** `tests/nit/contact.spec.ts`

**Steps:**
  1. Data-driven over 'button' and 'Escape'. Open the dialog from the nav, then close it with button 'Zatvori kontakt' or keyboard.press('Escape').
    - expect: #contact-dialog is no longer open (toBeHidden)
    - expect: focus return to the trigger is NOT asserted (unverified)

#### 3.3. context triggers show the context line

**File:** `tests/nit/contact.spec.ts`

**Steps:**
  1. Data-driven over the two data-interest triggers. Case 1: select tab 'Eksterni IT saradnik' first (the button is in a hidden panel), click 'Dogovorimo saradnju ↗'. Case 2: scroll to #isprobaj, click 'Želim nešto ovakvo za svoj posao ↗'.
    - expect: #contact-context is visible
    - expect: case 1 text is 'Eksterni IT saradnik'; case 2 text is 'Konfigurator i priprema proizvodnje' (the line mirrors the trigger's data-interest value)

#### 3.4. nav trigger shows no context line and clears a previous one

**File:** `tests/nit/contact.spec.ts`

**Steps:**
  1. Open the dialog via 'Dogovorimo saradnju ↗' (see above), close with Escape, then open it via the nav 'Kontakt ↗'.
    - expect: #contact-context is hidden and empty (no stale 'Eksterni IT saradnik')

#### 3.5. copying the e-mail address gives feedback

**File:** `tests/nit/contact.spec.ts`

**Steps:**
  1. Open the dialog from the nav, click 'Kopiraj email adresu'.
    - expect: the dialog's role=status (#copy-feedback) has text 'Email adresa kopirana.' (works in Chromium without permissions)
    - expect: optional, chromium only (test.skip on other browsers): grantPermissions(['clipboard-read','clipboard-write']) and assert the clipboard is non-empty and contains '@' (clipboard text not verified)

### 4. 4. QAP-6 Services tablist (services.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 4.1. four service tabs, first selected, only the selected panel visible @smoke

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. nitHome.goto(). Read the tabs in tablist 'Usluge'.
    - expect: tabs in order: 'Web i katalozi proizvoda', 'PC i mobilne aplikacije', 'Poslovni proračuni i analize', 'Eksterni IT saradnik'
    - expect: the first tab has aria-selected=true, the others false
    - expect: tabpanel 'Web i katalozi proizvoda' (#service-web) is visible, #service-apps/#service-production/#service-external are hidden
  2. Data-driven: click each tab in turn.
    - expect: exactly that tab is selected and exactly its panel (#service-web|apps|production|external) is visible, the other three are hidden

#### 4.2. service tabs support keyboard navigation (Observed: implemented)

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. Focus the first tab, press ArrowRight, End, Home, ArrowLeft.
    - expect: ArrowRight selects and focuses 'PC i mobilne aplikacije' (selection follows focus)
    - expect: End selects 'Eksterni IT saradnik', Home selects 'Web i katalozi proizvoda'
    - expect: ArrowLeft on the first tab wraps to the last tab
    - expect: only the selected tab has tabindex 0

#### 4.3. project tabs switch the story and the visit link @smoke

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. On the Web panel use tablist 'Projekti' (tab names start with 'KJ Tools', 'UGANJAJ', 'Atlas BiH'). Click each and wait for aria-selected=true.
    - expect: the story heading (h3 inside #project-panel) is 'KJ Tools' / 'UGANJAJ' / 'Atlas BiH' respectively
    - expect: link 'Posjeti stranicu ↗' has an https href per project (kjtools.ba, uganjaj.ba, bih.uganjaj.ba: assert only that each href differs and starts with https://)
    - expect: do not open or inspect the iframes

#### 4.4. each project shows exactly one pressed view button

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. For each project tab, count #project-panel buttons with aria-pressed (projectPanel.getByRole('button', { pressed: true })). Then click another view button (KJ: 'Katalog proizvoda'; UGANJAJ: 'Pretraga i oglasi'; Atlas: '3D karta').
    - expect: exactly one button is pressed before and after the click
    - expect: the clicked button is the pressed one and the previous one is pressed=false (UGANJAJ and KJ have 3 views, Atlas 2)

#### 4.5. app tabs switch the app description

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. Open tab 'PC i mobilne aplikacije'. In tablist 'Ekrani aplikacije' click 'Oglasi', 'Detalji objave', 'Moj biznis' and read #app-view-copy each time.
    - expect: the selected app tab changes with each click (aria-selected, #app-view aria-labelledby follows)
    - expect: the copy text of the three views is pairwise different and non-empty (do not hard-code the sentences)

#### 4.6. production panel lists the six business-system steps in order with the language @smoke

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. nitHome.goto('?lang=bs'); open tab 'Poslovni proračuni i analize'. Read the links of the ordered list in #production-demo.
    - expect: six links named '01 Kalkulacija ↗', '02 Materijal ↗', '03 Plan ↗', '04 Proizvodnja ↗', '05 Kvalitet ↗', '06 Pregled firme ↗' in this order
    - expect: hrefs are poslovni-sistem/{kalkulacija,materijal,plan,proizvodnja,kvalitet,pregled}.html?lang=bs
    - expect: link 'Prođi jedan nalog →' points to kalkulacija.html?lang=bs and the exact-named link 'Otvori pregled firme ↗' points to pregled.html?lang=bs
    - expect: clicking '01 Kalkulacija ↗' opens a page whose h1 is 'Kalkulacija i ponuda'

#### 4.7. hash deep links select the matching service tab

**File:** `tests/nit/services.spec.ts`

**Steps:**
  1. Data-driven: goto '/?lang=bs#proizvodnja' (Poslovni proračuni i analize), '#aplikacije' (PC i mobilne aplikacije), '#it-podrska' (Eksterni IT saradnik).
    - expect: the matching tab is aria-selected=true and its panel is visible, the other panels hidden
    - expect: (Observed) clicking a tab writes the same hash back into the URL; assert for these three tabs

### 5. 5. QAP-7 Language switcher (language.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 5.1. default language is Bosanski @smoke

**File:** `tests/nit/language.spec.ts`

**Steps:**
  1. Fresh context, nitHome.goto() without query. Open the flag menu (nitHome.openLanguageMenu()).
    - expect: html lang is 'bs'
    - expect: h1 is 'Web stranice i aplikacije. Alati za vaš posao.'
    - expect: summary aria-label is 'Jezik i pismo: Bosanski'
    - expect: five buttons Bosanski, Hrvatski, Српски, English, Deutsch exist; only Bosanski has aria-pressed=true

#### 5.2. each language button translates heading, html lang and pressed state @smoke

**File:** `tests/nit/language.spec.ts`

**Steps:**
  1. Data-driven over nitLanguages: bs (bs), hr (hr), sr (sr-Cyrl), en (en), de (de). Choose each via nitHome.chooseLanguage(button).
    - expect: h1: bs and hr 'Web stranice i aplikacije. Alati za vaš posao.'; sr 'Веб странице и апликације. Алати за ваш посао.'; en 'Websites and applications. Tools for your business.'; de 'Websites und Anwendungen. Werkzeuge für Ihren Betrieb.'
    - expect: html lang matches (note sr-Cyrl)
    - expect: only the chosen button is aria-pressed=true
    - expect: URL gets ?lang=<code> and localStorage nit-language equals the code
    - expect: hr is documented as identical copy to bs (the test asserts html lang, pressed state and summary label for hr, not different text)

#### 5.3. language choice survives a reload without query

**File:** `tests/nit/language.spec.ts`

**Steps:**
  1. Choose Deutsch, then goto('/') with no query.
    - expect: html lang 'de' and the German h1 are shown
    - expect: Deutsch is aria-pressed=true

#### 5.4. ?lang= preselects the language and overrides the stored one

**File:** `tests/nit/language.spec.ts`

**Steps:**
  1. Choose Deutsch (stored), then goto('/?lang=en'); also goto('/?lang=hr') on a fresh context.
    - expect: English h1 and html lang 'en', English pressed (the URL wins over localStorage)
    - expect: ?lang=hr gives html lang 'hr' and Hrvatski pressed

#### 5.5. JS-generated tab names and the menu summary are announced in the chosen language

**File:** `tests/nit/language.spec.ts`

**Steps:**
  1. Data-driven en, de, sr (hr/bs excluded: same strings). Choose the language, read the tab names, the tablist names and the summary aria-label.
    - expect: en: tabs 'Websites and product catalogues', 'Desktop and mobile applications', 'Business calculations and analysis', 'External IT partner'; tablists 'Services', 'Projects', 'App screens'; summary 'Language and script: English'; title 'nIT — Websites, applications and business systems'
    - expect: de: tabs 'Websites und Produktkataloge', 'PC- und mobile Anwendungen', 'Betriebliche Kalkulationen und Analysen', 'Externer IT-Partner'; summary 'Sprache und Schrift: Deutsch'; title 'nIT — Websites, Anwendungen und Geschäftssysteme'
    - expect: sr: tabs 'Веб и каталози производа', 'ПЦ и мобилне апликације', 'Пословни прорачуни и анализе', 'Екстерни ИТ сарадник'; tablists 'Услуге', 'Пројекти', 'Екрани апликације'; summary 'Језик и писмо: Српски'
    - expect: the German tablist name was not read: locate the services tablist structurally (the tablist that contains #service-tab-web) in language tests

#### 5.6. chosen language is carried to the business-system links and pages

**File:** `tests/nit/language.spec.ts`

**Steps:**
  1. Data-driven bs, en, de, hr, sr: choose the language, open tab 'Poslovni proračuni i analize' and read the hrefs of the six step links.
    - expect: bs/en/de: every href ends with ?lang=bs / ?lang=en / ?lang=de
    - expect: Observed: hr and sr hrefs keep ?lang=bs (the business system has no hr/sr), asserted as such with a comment
  2. For en and de click '01 ...' and on the business page open the flag menu: links Bosanski, English, Deutsch.
    - expect: h1 is 'Quote and offer'-style translated (en/de: assert html lang and that the h1 differs from 'Kalkulacija i ponuda'; de nav label 'Ein Auftrag von Anfang bis Ende')
    - expect: each language link keeps the same page (href kalkulacija.html?lang=xx)
    - expect: Possible bug (not asserted): the summary aria-label is 'Jezik' on every language

### 6. 6. QAP-8 Configurator (configurator.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 6.1. default Luma 1000 x 2100 shows a positive price @smoke

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. configurator.goto() (/konfigurator.html?lang=bs, redirects to /konfigurator).
    - expect: h1 'Konfigurator prozora i vrata'; group 'Odaberite pogled' with '01 Šta vidi kupac' pressed
    - expect: group 'Odaberite model' has six buttons Solo, Duo, Panorama, Linea, Luma, Luma Plus; Luma ('Luma, Podesivo ostakljenje') is aria-pressed=true
    - expect: tablist 'Postavke proizvoda' has Mjere (selected), Izgled, Staklo
    - expect: spinbuttons 'Širina mm' = 1000 and 'Visina mm' = 2100, summary text '1000 × 2100 mm'
    - expect: summary chips for profile, glass and parts are non-empty; 'Demo procjena / kom' unit price parses to a number > 0; 'Količina' = 1 and 'Ukupno za odabir' equals the unit price

#### 6.2. each model can be selected and updates the summary

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Data-driven over Solo, Duo, Panorama, Linea, Luma Plus (model(name) = getByRole('button', { name: new RegExp('^' + name + ',') })). Click, read heading in 'VAŠ ODABIR', chips, unit price.
    - expect: exactly that model button is aria-pressed=true
    - expect: the selection heading equals the model name
    - expect: unit price > 0 and the dimension text equals the model's default size (the width/height inputs, not hard-coded)
    - expect: unit price differs from the previous model's for at least the Panorama vs Luma pair (do not compare to fixed KM values)

#### 6.3. out-of-range sizes and quantities are clamped to the model's range (Observed: clamped, per-model ranges)

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Data-driven over Luma, Panorama, Luma Plus. Read the range from the input min/max attributes and from the hint 'Demo raspon: širina a–b, visina c–d mm.'; fill 'Širina mm' with max+1000 and press Tab, fill 'Visina mm' with min-1000 and press Tab; fill 'Količina' with 25 and press Tab.
    - expect: the hint text matches the input min/max (Luma 800–1200 × 1900–2500; Panorama 600–2400 × 600–2200; Luma Plus 1250–2000 × 1900–2500 on the test day)
    - expect: width becomes exactly max and height exactly min after commit, the slider values follow, the summary dimension text shows the clamped values
    - expect: quantity becomes 20 (input max)
    - expect: no validation message and no :invalid state

#### 6.4. a larger frame never needs less profile

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Luma: record 'm profila' at width = min, middle, max (set via 'Širina mm' + Tab); repeat for height.
    - expect: profile length is monotonically non-decreasing and strictly larger at max than at min (observed 11,44 -> 12,24 m for 1000 -> 1200)
    - expect: glass area never decreases (equal on Luma, because the glass size is set separately in the Staklo tab)
    - expect: values parsed with parseLocalNumber; no formulas re-implemented

#### 6.5. glass settings never reduce glass area or price

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Open tab 'Staklo'. Record 'm² stakla' and unit price. Fill 'Širina stakla mm' with a larger value + Tab. Then choose 'Troslojno' in combobox 'Vrsta stakla'.
    - expect: glass area after widening is greater than before (observed 0,56 -> 0,78 m²)
    - expect: unit price after widening and after Troslojno is >= the previous price (observed +60,78 KM)

#### 6.6. total equals unit price times quantity @smoke

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Data-driven quantity 1, 3, 20 on the default Luma. Read 'Demo procjena / kom' and 'Ukupno za odabir'.
    - expect: total equals unit x quantity (compare parsed numbers, tolerance 0,01 KM), e.g. 696,23 x 20 = 14.329,40
    - expect: changing quantity does not change the unit price

#### 6.7. reset restores the starting example

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Select Duo, set quantity 5, change width, add glass change; click '↺ Vrati početni primjer'.
    - expect: model Luma is pressed, width 1000, height 2100, quantity 1
    - expect: the summary and price equal the values recorded on a fresh load

#### 6.8. 'Pogledajte šta dobija firma' switches to the company view @smoke

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Click 'Pogledajte šta dobija firma →'.
    - expect: '02 Šta vidi firma' is aria-pressed=true and '01 Šta vidi kupac' false
    - expect: region 'Kupčev konfigurator' is hidden; region 'Poslovni pregled' with heading 'Ponuda i priprema proizvodnje' is visible
    - expect: sub-tabs Ponuda (pressed), Materijal, Rezanje, Sklapanje, Isporuka exist
    - expect: clicking '01 Šta vidi kupac' returns to the customer region

#### 6.9. home page embeds the configurator and links to the full tool

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. nitHome.goto('?lang=bs'); scroll to #isprobaj. Use ConfiguratorPage on page.frameLocator('#config-demo'); click link 'Otvori cijeli alat ↗'.
    - expect: inside the frame group 'Odaberite model' and the default Luma are visible
    - expect: the link href is /konfigurator.html?lang=bs and the opened page shows the same h1 and default values
    - expect: with ?lang=en the iframe src ends with lang=en and the link text is 'Open the full tool ↗'

#### 6.10. user can add a selection to the demo inquiry (Changes section, not an AC)

**File:** `tests/nit/configurator.spec.ts`

**Steps:**
  1. Click 'Dodaj u demo upit +' with Luma, then select Duo and click again; open the company view.
    - expect: status 'Stavka je u demo upitu. Možete dodati drugi model ili otvoriti pregled firme.' after each add
    - expect: badge on '02 Šta vidi firma' goes 1 -> 1 (same Luma) -> 2 (Duo); the company view lists headings 'Luma · 1 kom' and 'Duo · 1 kom'

### 7. 7. QAP-9 Business system shell (business-shell.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 7.1. fresh browser: steps 02-05 are locked, 01 and 06 open @smoke

**File:** `tests/nit/business-shell.spec.ts`

**Steps:**
  1. quotePage.goto() (/poslovni-sistem/kalkulacija.html?lang=bs). Read nav 'Tok jednog naloga'.
    - expect: steps 01 'Kalkulacija i ponuda' and 06 'Pregled firme' are links with an href, 01 has aria-current=page
    - expect: the four steps 02-05 (found with getByTitle('Najprije pripremite i prihvatite ponudu.')) have aria-disabled=true and no href
    - expect: 4 elements carry that title; they are not links in the accessibility tree
    - expect: Observed: the lock exists only on page 01 (direct visits to 02-05 show all steps open): document it with a comment, do not test the bypass as a failure

#### 7.2. accepting a quote unlocks steps 02-05 and marks the current step @smoke

**File:** `tests/nit/business-shell.spec.ts`

**Steps:**
  1. Use the helper acceptQuote() (suite 12): preview -> 'Sačuvaj ovu verziju ponude' -> 'Označi da je kupac prihvatio'.
    - expect: steps 02-05 are now links with href materijal/plan/proizvodnja/kvalitet.html?lang=bs and aria-disabled is gone
    - expect: step 01 still has aria-current=page
    - expect: clicking '02 Materijal i nabavka' opens /materijal and the step 02 link has aria-current=page there

#### 7.3. state survives a reload and moving between pages

**File:** `tests/nit/business-shell.spec.ts`

**Steps:**
  1. Accept a quote (helper), open material via 'Otvori novi nalog RN-2609 →', click 'Rezerviši materijal', then reload and visit /plan, /proizvodnja, /kvalitet, /pregled.
    - expect: localStorage 'nit-business-system-v1' exists with 9 orders
    - expect: the order picker still has RN-2609 selected on every page and header Kupac/Količina are unchanged
    - expect: after reload the material page shows the reservation ('Rezervisano za nalog' disabled)

#### 7.4. undo reverts only the last change

**File:** `tests/nit/business-shell.spec.ts`

**Steps:**
  1. On material page with RN-2602 selected (shortage), click 'Simuliraj prijem materijala' (toast 'Demo prijem evidentiran.'); on a fresh load before any change 'Vrati posljednju promjenu' is disabled; then click 'Vrati posljednju promjenu'.
    - expect: undo is disabled with an empty stack and enabled after the change
    - expect: after undo Na stanju of the material, Nedostaje and the 'Dolazak materijala' KPI equal their values before the receipt
    - expect: toast 'Posljednja promjena je vraćena.'; earlier changes (e.g. an earlier reservation of RN-2609) are NOT undone

#### 7.5. reset restores the seed data and relocks the steps

**File:** `tests/nit/business-shell.spec.ts`

**Steps:**
  1. Accept a quote (helper, RN-2609 exists), then click 'Početni podaci' on page 01 and reload.
    - expect: toast 'Vraćeni su početni podaci.'
    - expect: order picker (on /materijal) lists only RN-2601..RN-2608
    - expect: on page 01 steps 02-05 are locked again; the record 'Kupac je prihvatio' is gone

#### 7.6. 'Povratak na nIT' returns to the production tab and the picker lists the seeded orders

**File:** `tests/nit/business-shell.spec.ts`

**Steps:**
  1. Open /poslovni-sistem/materijal.html?lang=bs, click link 'Povratak na nIT'.
    - expect: URL is /?lang=bs#proizvodnja and tab 'Poslovni proračuni i analize' is selected with #service-production visible
  2. Back on a page 02-06 read combobox 'Odaberite nalog'.
    - expect: eight options 'RN-2601 · Nosač M12' ... 'RN-2608 · Vodilica V8' (assert IDs RN-2601..RN-2608, not part names)
    - expect: after acceptance a ninth option 'RN-2609 · Nosač M12' is appended (see 9.1)

### 8. 8. QAP-10 Quote and offer (quote.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 8.1. default calculation is internally consistent @smoke

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. quotePage.goto(). Read 'Trošak po komadu', 'Trošak cijele serije', quantity, 'Naša cijena po komadu', 'Ukupno za kupca bez PDV-a', 'Ostaje nakon obračunatih troškova' and the 'Marža: X%' text.
    - expect: series cost = cost per piece x quantity (tolerance 0,01 per piece rounding)
    - expect: total for customer = price per piece x quantity
    - expect: 'Ostaje' = total - series cost
    - expect: margin % = Ostaje / total (share of price, tolerance 0,1 %-point; observed 15,7%) and the text ends with 'Nije neto dobit.'
    - expect: no pricing formula is re-implemented

#### 8.2. batch comparison: more pieces never cost more per piece

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. Read the per-piece cost printed on buttons '50 kom', '100 kom', '500 kom' (group 'Isti dio, druga količina'). Click each.
    - expect: cost(50) > cost(100) > cost(500)
    - expect: the 100 kom button is aria-pressed=true on load and its cost equals 'Trošak po komadu'
    - expect: clicking a button sets 'Količina kom' to that value, sets aria-pressed, and 'Trošak po komadu' equals the printed value; series cost = per piece x quantity again

#### 8.3. below-target price warns and 'Predloži cijenu' reaches the target margin

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. On the seed draft (price below target) read the warning, then click 'Predloži cijenu prema ciljanoj marži ↗'.
    - expect: before: warning 'Trenutna cijena je ispod ciljane marže.' visible and shown margin < 'Ciljana marža'
    - expect: after: 'Naša cijena po komadu' increased, the warning is gone, the margin text equals the target (20,0%) within 0,1 and 'Ostaje' increased
    - expect: lowering the price by hand (e.g. to 30) shows the warning again

#### 8.4. invalid inputs are rejected

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. Data-driven: 'Količina kom' = 0, 10.5; 'Dodatak za škart %' = 41 (expand details 'Tehnologija dijela' first via quotePage.openTechnology()); 'Ciljana marža %' = 80. After each, click 'Pregledaj ponudu za kupca →'.
    - expect: the field is not valid (evaluate el.validity.valid === false); native message text is NOT asserted (browser locale)
    - expect: the preview dialog #quote-preview does not open and focus is on the invalid field
    - expect: the result block is replaced by 'Dopunite ispravne podatke za novi obračun.'
    - expect: observed: #quote-error stays empty (AC mentions it, not used)
    - expect: after restoring a valid value the cost figures and preview button work again

#### 8.5. cost breakdown adds up and every item opens its formula

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. Open details 'Odakle dolazi ovaj trošak?' (quotePage.openBreakdown()). Read the 7 rows (Materijal, Programiranje, Priprema, Obrada, Alati, Kontrola, Režije). Click the Materijal amount.
    - expect: the sum of the seven amounts equals 'Trošak cijele serije' (tolerance 0,02)
    - expect: dialog #quote-formula opens with title 'Materijal', text 'Obračun za novu seriju' and shows the same amount as the button; closes with 'Zatvori'
    - expect: Possible a11y bug: button names are only the amounts, so rows are found via getByText(label).locator('..').getByRole('button')

#### 8.6. customer preview shows the offer but hides internal cost and margin

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. Click 'Pregledaj ponudu za kupca →'.
    - expect: #quote-preview is open with heading 'Ponuda za kupca', customer 'Adria oprema', quantity '100 kom', price per piece and total equal to the form values
    - expect: total in preview equals price x quantity
    - expect: the dialog text does not contain 'Trošak', 'Marža' or 'Ostaje nakon obračunatih troškova' and contains the note 'Interni troškovi i marža nisu dio ovog dokumenta.'
    - expect: buttons 'Sačuvaj ovu verziju ponude', 'Preuzmi ponudu', 'Štampaj ponudu' and 'Zatvori' are present (download/print not exercised)

#### 8.7. preview, save and accept creates order RN-2609 and unlocks the next steps @smoke

**File:** `tests/nit/quote.spec.ts`

**Steps:**
  1. Preview, click 'Sačuvaj ovu verziju ponude' (dialog stays open, record 'Sačuvana ponuda' P-2026-001 verzija 1, button becomes 'Označi da je kupac prihvatio'), then click 'Označi da je kupac prihvatio'.
    - expect: toast 'Prihvatanje kupca je zabilježeno. Kreiran je novi nalog.'; dialog closes
    - expect: #quote-record shows /kupac je prihvatio/i, the saved offer 'Adria oprema · 100 kom × <price> KM · <total> KM' and link 'Otvori novi nalog RN-2609 →' (href materijal.html?lang=bs&order=8) and button 'Nova ponuda iz predloška'
    - expect: steps 02-05 become links; scenario buttons 50/100/500 are disabled until 'Nova ponuda iz predloška'; after that button the steps lock again
    - expect: clicking the new-order link opens /materijal with RN-2609 selected

### 9. 9. QAP-11 Material and production plan (material-plan.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 9.1. reserving material raises 'Rezervisano' by the order's need @smoke

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. Fixture acceptedQuote (suite 12), open 'Otvori novi nalog RN-2609 →'. Order picker has RN-2609 selected, header Kupac/Količina match the quote. Read the table row of the needed material (Na stanju, Rezervisano, Treba nalogu) and KPIs Potrebno/Raspoloživo/Nedostaje. Click 'Rezerviši materijal'.
    - expect: before: 'Nedostaje' parses to >= 0 and Potrebno equals the 'Treba nalogu' cell
    - expect: after: Rezervisano increased by exactly Treba nalogu (observed 311,4 -> 585,8 kg), Na stanju unchanged, Nedostaje still >= 0
    - expect: toast 'Materijal rezervisan za odabrani nalog.'; button now 'Rezervisano za nalog' and disabled; text 'Materijal je raspoloživ. Možete planirati početak rada.'

#### 9.2. shortage is shown as need minus available and a simulated receipt resolves it

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. Select seeded order RN-2602 in 'Odaberite nalog' (aluminium shortage). Read KPIs and the table; click 'Simuliraj prijem materijala'.
    - expect: before: Nedostaje = Potrebno - Raspoloživo > 0; 'Rezerviši materijal' is disabled; 'Simuliraj prijem materijala' enabled; 'Dolazak materijala' KPI is a weekday (not 'Zaprimljeno')
    - expect: after: Na stanju of that material grew by exactly the previous Nedostaje, Nedostaje is 0, KPI says 'Zaprimljeno', toast 'Demo prijem evidentiran.', 'Rezerviši materijal' enabled
    - expect: for RN-2609 (no shortage) the receipt button is disabled

#### 9.3. planning an unreserved order is blocked @smoke

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. Fixture acceptedQuote, then goto /plan.html?lang=bs without reserving.
    - expect: heading 'Prvo osigurajte materijal' and text 'Ovaj nalog još nema rezervisan materijal. Rezervišite ga prije potvrde termina.'
    - expect: no 'Potvrdi termin' button; link 'Otvori materijal →' (href materijal.html?lang=bs) leads to the material page with RN-2609 still selected
    - expect: after reserving, the planner form ('Rasporedi odabrani nalog') appears

#### 9.4. planner offers only machines suitable for the part

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. On /plan select RN-2604 (Osovina, lathe part) and read combobox 'Mašina'; then select RN-2601 (milling part) and read it again.
    - expect: RN-2604 offers exactly one option starting with 'CNC-04'
    - expect: RN-2601 (and the reserved RN-2609) offer exactly CNC-01, CNC-02, CNC-03 and none starts with 'CNC-04'
    - expect: the hint 'Prikazane su odgovarajuće mašine.' is visible

#### 9.5. a clashing slot is reported and cannot be confirmed

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. Fixture reservedOrder (accept + reserve). On /plan choose machine CNC-01, 'Dan početka' 'Ponedjeljak · Sedmica 1', 'Početak rada' 08:00 (occupied by RN-2601 in the seed).
    - expect: status (role=status in the workspace) matches /Termin se preklapa s nalogom RN-\d+\./ (observed RN-2601)
    - expect: 'Potvrdi termin' is disabled and 'Status plana' is still 'Čeka termin'

#### 9.6. first free slot can be confirmed and appears in the weekly grid @smoke

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. From the clash above click 'Prvi slobodan termin', then 'Potvrdi termin'. Open 'Sedmica plana' to the week of the slot if needed.
    - expect: after 'Prvi slobodan termin' the status is 'Termin je slobodan. Možete ga potvrditi.' and 'Potvrdi termin' is enabled
    - expect: after confirming: toast 'Termin je provjeren i sačuvan.', 'Status plana' = 'Termin potvrđen'
    - expect: the grid ('Sedmični raspored') has a button named /^RN-2609 · \d/ on the chosen machine's row with hours equal to 'Preostalo rada'
    - expect: link 'Prati izvršenje →' leads to /proizvodnja

#### 9.7. starting earlier never finishes later (metamorphic)

**File:** `tests/nit/material-plan.spec.ts`

**Steps:**
  1. Fixture reservedOrder. For the same machine pick two free starts on different days (e.g. Srijeda · Sedmica 1 12:30 and Četvrtak · Sedmica 1 12:30, then Ponedjeljak · Sedmica 2 08:00 if free). Read 'Procijenjeni završetak: dd.mm.yyyy. · hh:mm' for each and parse it.
    - expect: for each pair, the earlier start has an estimated finish <= the later start's finish
    - expect: finish is never before the start; no absolute dates asserted (they depend on the test day)

### 10. 10. QAP-12 Work, downtime, quality and rework (work-quality.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 10.1. logging N pieces raises 'Obrađeno' and 'Čeka kontrolu' by N but not 'Za kupca' @smoke

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. Fixture plannedOrder (accept -> reserve -> first free slot -> confirm, suite 12), goto /proizvodnja. Read the RN-2609 row (Obrađeno, Za kupca, Preostalo). With 'Obrađeni komadi kom' = 5, 'Vrijeme obrade min' = 45, 'Zastoj min' = 0 click 'Sačuvaj unos'.
    - expect: row Obrađeno increased by 5 (observed 0 / 100 -> 5 / 100), Za kupca unchanged, Preostalo (h) decreased
    - expect: toast 'Rad je evidentiran. Plan, kontrola i troškovi su ažurirani.'; header 'Preostalo: 95 kom'; 'Posljednje promjene' lists 'Unos rada' with '5 kom · 45 min'
    - expect: on /kvalitet 'Obrađeno' increased by 5 and 'Čeka kontrolu' increased by 5; 'Spremno za kupca' still shows 0 / <quantity>

#### 10.2. more pieces than remain are rejected

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. Read 'Preostalo: N kom' from the form header (100 for a fresh RN-2609). Fill 'Obrađeni komadi kom' with N + 1.
    - expect: status 'Količina prelazi preostale komade naloga.' and 'Sačuvaj unos' is disabled; input max attribute equals N
    - expect: filling N is accepted (status 'Unos je spreman za čuvanje.')
    - expect: the table row is unchanged after the rejected attempt

#### 10.3. downtime is added to the total and shown in the log

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. Save an entry with 5 pieces, 45 min and 'Zastoj min' = 30, 'Razlog zastoja' = 'Kvar'.
    - expect: 'Dosadašnji zastoji' = '30 min' (it was '0 min'); a second 30 min entry gives '60 min'
    - expect: 'Posljednje promjene' shows '5 kom · 45 min · 30 min zastoj'
    - expect: 'Očekivani trošak' did not decrease (observed 3.245 -> 3.282 KM)
    - expect: Possible bug (not asserted, reported): 'Zastoj min' = 481 is natively invalid (max 480) yet the status still says 'Unos je spreman za čuvanje.' and 'Sačuvaj unos' stays enabled; the click does nothing (focus moves to the field). Assert only that nothing was saved (row and 'Dosadašnji zastoji' unchanged)

#### 10.4. inspection moves pieces into accepted, scrap and rework @smoke

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. Precondition: 10 pieces logged (two entries of 5). On /kvalitet read KPIs, then set 'Prihvaćeno kom' 5, 'Škart kom' 3, 'Dorada kom' 2 (choose 'Uzrok' 'Mjere van tolerancije') and click 'Potvrdi kontrolu'.
    - expect: before: status 'Raspoređeno: 10 / 10 kom'
    - expect: after: 'Čeka kontrolu' 0, 'Na doradi' 2, 'Spremno za kupca' 5 / 100, 'Evidentirani škart' 3 kom (30,0% of the 10 processed), cause row 'Mjere van tolerancije' 5 kom
    - expect: toast 'Kontrola je evidentirana u nalogu i pregledu firme.'; 'Potvrdi kontrolu' disabled

#### 10.5. inspection quantities beyond the pieces waiting cannot be confirmed (UNVERIFIED)

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. With 10 pieces waiting enter Prihvaćeno 8, Škart 3, Dorada 0 (sum 11). Read the status and the button.
    - expect: status 'Raspoređeno: 11 / 10 kom' (format seen at 10 / 10; the over-allocation text was not exercised), 'Potvrdi kontrolu' is disabled or blocked by validity, the hint 'Zbir prihvaćenih, odbačenih i komada za doradu ne može biti veći od količine koja čeka kontrolu.' is visible
    - expect: nothing changes in the KPIs; mark the test test.fixme until the behaviour is observed once in the browser

#### 10.6. confirming the rework makes the pieces ready for the customer

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. After the 5/3/2 inspection click 'Potvrdi doradu i prihvati komade'. Check /kvalitet and /proizvodnja.
    - expect: toast 'Dorada završena; komadi su prihvaćeni.'; the workspace shows 'Ova kontrola je završena' and link 'Nastavi obradu →' (the KPIs are gone)
    - expect: /proizvodnja row 'Za kupca' = 5 + 2 = 7 / 100 (was 5 / 100), 'Na doradi' no longer pending
    - expect: 'Preostalo' (h) is higher than before the inspection because of the 3 scrapped pieces

#### 10.7. more scrap never lowers the expected cost per piece (metamorphic)

**File:** `tests/nit/work-quality.spec.ts`

**Steps:**
  1. Two runs from the same state (use undo or two separate contexts): run A confirms 10 pieces as 10 / 0 / 0, run B as 7 / 3 / 0. Read 'Očekivani trošak / kom' after each.
    - expect: cost per piece in B >= cost per piece in A (observed 32,82 -> 33,66 KM with 3 scrapped)
    - expect: 'Evidentirani škart' rises with the scrap (3 kom, 30,0%)
    - expect: absolute values are not asserted

### 11. 11. QAP-13 Company overview (overview.spec.ts)

**Seed:** `tests/nit/seed.spec.ts`

#### 11.1. overview works on the seed and 'Preostaje' = 'Vrijednost naloga' - 'Očekivani trošak' @smoke

**File:** `tests/nit/overview.spec.ts`

**Steps:**
  1. overviewPage.goto() on the pure seed (no quote accepted).
    - expect: h1 'Pregled firme'; filters Historija '8 sedmica', Mašina 'Sve mašine', Kupac 'Svi kupci'; what-if 'Osnova' pressed
    - expect: card Poslovanje shows '8 naloga' (the seed has 8 orders), Vrijednost naloga and Očekivani trošak > 0
    - expect: Preostaje = Vrijednost - Očekivani (tolerance 1 KM, the page rounds to whole KM)
    - expect: all six cards (Poslovanje, Plan proizvodnje, Mašine i učinak, Kvalitet i škart, Kalkulacija i odstupanja, Alati i održavanje) are visible

#### 11.2. material price what-if raises cost and lowers 'Preostaje'; 'Osnova' restores

**File:** `tests/nit/overview.spec.ts`

**Steps:**
  1. Record Vrijednost, Očekivani, Preostaje and the 'Materijal' amount of the selected order on 'Osnova'. Click '+10%', record, click '+20%', record, click 'Osnova'.
    - expect: Očekivani: base < +10% < +20%; Preostaje: base > +10% > +20%; Materijal line also increases
    - expect: Vrijednost naloga is identical in all three modes (note: 'Ugovorene cijene ostaju iste.')
    - expect: only the clicked button has aria-pressed=true each time
    - expect: after 'Osnova' all numbers equal the first reading; Preostaje = Vrijednost - Očekivani in every mode (tolerance 1 KM)

#### 11.3. customer and machine filters narrow the numbers and 'Svi'/'Sve' restore them

**File:** `tests/nit/overview.spec.ts`

**Steps:**
  1. Data-driven: Kupac = each of 'Adria oprema', 'Tehno fluid', 'Metal servis'; then Mašina = 'CNC-04' (lathe). Read the order count ('N naloga') and Vrijednost naloga; then select 'Svi kupci' / 'Sve mašine'.
    - expect: filtered count <= total count and Vrijednost <= total Vrijednost; the sum of the three customer counts equals the total count
    - expect: machine CNC-04 shows only orders of that machine (observed RN-2604, RN-2606 in the plan card)
    - expect: selecting 'Svi kupci' / 'Sve mašine' restores the original numbers
    - expect: Historija '4 sedmice' changes only the chart (8 -> 4 weekly bars labelled S1...), not the cards (Observed)

#### 11.4. cost breakdown of the selected order adds up to the expected cost

**File:** `tests/nit/overview.spec.ts`

**Steps:**
  1. In 'Kalkulacija i odstupanja' read the buttons named like 'Materijal: 870,61 KM' (aria-label, use /^Materijal: /), including 'Zastoji i dorada', and the line 'Plan / očekivano'.
    - expect: sum of the breakdown amounts equals the 'očekivano' part of 'Plan / očekivano' (tolerance 1 KM, page rounds to whole KM)
    - expect: the 'očekivano' value is >= the 'plan' value
    - expect: 'Marža' is a percentage and equals (price total - očekivano) / price total of the order within 0,2 %-points if the order total is read from the 'Poslovanje' of a customer filter, else only assert 0 < marža < 100

#### 11.5. tools below their minimum are flagged

**File:** `tests/nit/overview.spec.ts`

**Steps:**
  1. In 'Alati i održavanje' read each tool row (div.toolrow: name, Stanje, Minimum).
    - expect: every row with Stanje < Minimum has class warn on the stock number and every row with Stanje >= Minimum does not (seed: two below minimum, one above)
    - expect: at least one tool is flagged on the seed; Planirani servis lists one planned maintenance with a machine, a weekday and hours
    - expect: Possible a11y bug: the flag is colour/class only (no text/ARIA); assert through the class, report the gap

#### 11.6. upstream changes are reflected in the overview

**File:** `tests/nit/overview.spec.ts`

**Steps:**
  1. Record '8 naloga' and Vrijednost naloga on the seed. Then with fixture plannedOrder (RN-2609 accepted, reserved, planned) log 10 pieces on /proizvodnja and inspect 5 accepted / 3 scrap / 2 rework on /kvalitet. Reopen /pregled.
    - expect: order count is 9 and Vrijednost naloga grew by the accepted quote total
    - expect: RN-2609 is in the plan list (link 'RN-2609' to plan.html?lang=bs&order=8) and in the 'Kvalitet i škart' list with '3 kom'
    - expect: 'Škart' total increased by 3 kom; 'Zabilježeni zastoji' includes entered downtime
    - expect: after 'Početni podaci' the overview is back to '8 naloga'; link 'Razgovarajmo o vašem poslu ↗' goes to /?lang=bs#kontakt which is the footer (Observed)

### 12. 12. Page objects, helper, fixtures and obsolete code (plan only, nothing implemented)

**Seed:** `tests/nit/seed.spec.ts`

#### 12.1. New page-object layout in pages/nit/ (locators verified in the browser)

**File:** `pages/nit/*.ts`

**Steps:**
  1. NitHomePage (rewrite, keep goto(query), htmlLang()): heading = getByRole('heading',{level:1}); skipLink = getByRole('link',{name:'Preskoči na sadržaj'}); mainNav = getByRole('navigation',{name:'Glavna navigacija'}); projectsLink = mainNav.getByRole('link',{name:'Projekti'}); contactButton = mainNav.getByRole('button',{name:'Kontakt ↗'}); animationToggle = getByRole('button',{name:/animaciju/}) (#thread-pause; aria-pressed); serviceTabs = the tablist containing #service-tab-web (names 'Usluge'/'Services'/'Услуге'; German unverified); serviceTab(name) = getByRole('tab',{name}); servicePanel(id: web|apps|production|external) = locator('#service-<id>') (tabpanel, hidden attr); projectTabs = getByRole('tablist',{name:'Projekti'}) with tabs named /^KJ Tools/, /^UGANJAJ/, /^Atlas BiH/; projectPanel = locator('#project-panel'); projectStory = projectPanel.getByRole('heading',{level:3}); projectViewButtons = projectPanel.getByRole('button') (iframe buttons are not reached); visitLink = projectPanel.getByRole('link',{name:'Posjeti stranicu ↗'}); appTabs = getByRole('tablist',{name:'Ekrani aplikacije'}); appCopy = locator('#app-view-copy'); productionDemo = locator('#production-demo'); productionStep(n) = productionDemo.getByRole('link',{name:/^0n /}); walkThroughLink = getByRole('link',{name:'Prođi jedan nalog →'}); overviewLink = productionDemo.getByRole('link',{name:'Otvori pregled firme ↗',exact:true}); languageMenu = locator('details.language-flags') (role group, name varies); languageToggle = languageMenu.locator('summary') (no role; label 'Jezik i pismo: <jezik>' via toHaveAttribute('aria-label')); languageButton(name) = languageMenu.getByRole('button',{name,exact:true}); configFrame = frameLocator('#config-demo'); fullToolLink = getByRole('link',{name:/Otvori cijeli alat/}). Methods: goto(query), openService(tab), chooseLanguage(name), openLanguageMenu() (keep the retry), openContact(). Remove: motionToggle, processSwitch, processDetail, toolTabs, navLink(), processButton(), tab(), panel(), openTool().
    - expect: No XPath; CSS only where noted (#ids, details.language-flags, summary)
  2. ContactDialog: root = page.locator('#contact-dialog') (accessible name missing, see suite 1); heading = root.getByRole('heading',{name:'Razgovarajmo o projektu'}); closeButton = root.getByRole('button',{name:'Zatvori kontakt'}); copyButton = root.getByRole('button',{name:'Kopiraj email adresu'}); copyFeedback = root.getByRole('status') (#copy-feedback); context = root.locator('#contact-context'); triggers: NitHomePage.contactButton, serviceTab('Eksterni IT saradnik') then getByRole('button',{name:'Dogovorimo saradnju ↗'}), getByRole('button',{name:'Želim nešto ovakvo za svoj posao ↗'}). Methods: open(trigger), closeWithButton(), closeWithEscape().
    - expect: Only 2+ test reuse justifies the methods
  3. ConfiguratorPage(root: Page | FrameLocator) so it works for /konfigurator and for #config-demo: viewGroup = getByRole('group',{name:'Odaberite pogled'}); customerView = viewGroup.getByRole('button',{name:'01 Šta vidi kupac'}); companyView = viewGroup.getByRole('button',{name:/^02 Šta vidi firma/}) (badge digit appended); modelGroup = getByRole('group',{name:'Odaberite model'}); model(name) = modelGroup.getByRole('button',{name:new RegExp('^'+name+',')}); settingsTabs = getByRole('tablist',{name:'Postavke proizvoda'}) with tabs Mjere/Izgled/Staklo; width = getByRole('spinbutton',{name:'Širina mm'}); widthSlider = getByRole('slider',{name:'Podesi širinu proizvoda'}); height = getByRole('spinbutton',{name:'Visina mm'}); rangeHint = getByText(/^Demo raspon:/); glassType = getByRole('combobox',{name:'Vrsta stakla'}); glassWidth = getByRole('spinbutton',{name:'Širina stakla mm'}); resetButton = getByRole('button',{name:'↺ Vrati početni primjer'}); quantity = getByRole('spinbutton',{name:'Količina'}); dimensionText = getByText(/\d+ × \d+ mm/); profileChip = getByText(/m profila$/); glassChip = getByText(/m² stakla$/); partsChip = getByText(/vrsta dijelova$/); unitPrice = getByText('Demo procjena / kom').locator('..').locator('strong'); total = getByText('Ukupno za odabir').locator('..') (value is the last text); addButton = getByRole('button',{name:'Dodaj u demo upit +'}); firmButton = getByRole('button',{name:'Pogledajte šta dobija firma →'}); status = getByRole('status'); customerRegion = getByRole('region',{name:'Kupčev konfigurator'}); firmRegion = getByRole('region',{name:'Poslovni pregled'}). Methods: goto(query), setNumber(input, value) (fill + Tab to commit), selectedModel(). No test ids exist for prices: ask the owner for data-test attributes, otherwise keep the text-parent locators.
    - expect: Numbers parsed with parseLocalNumber from utils/nitData.ts
  4. BusinessSystem (abstract base, constructor(page, slug)): goto(query?) -> /poslovni-sistem/<slug>.html?lang=bs + wait for h1; backLink = getByRole('link',{name:'Povratak na nIT'}); stepNav = getByRole('navigation',{name:'Tok jednog naloga'}); step(label) = stepNav.getByRole('link',{name:new RegExp('^0\\d '+label)}) (enabled steps only); lockedSteps = stepNav.getByTitle('Najprije pripremite i prihvatite ponudu.') (aria-disabled, no href, no role); languageMenu = locator('header details.lang') (summary aria-label 'Jezik'); languageLink(name) = languageMenu.getByRole('link',{name}); orderPicker = getByRole('combobox',{name:'Odaberite nalog'}); pickOrder(id) selects the option starting with the id (option text 'RN-2609 · Nosač M12'); headerField(label) for Kupac/Količina/Rok isporuke = getByText(label,{exact:true}).locator('..'); undoButton = getByRole('button',{name:'Vrati posljednju promjenu'}); resetButton = getByRole('button',{name:'Početni podaci'}); toast(text) = getByRole('status').filter({hasText:text}); kpi(label) = getByText(label,{exact:true}).locator('..') (div.kpi: span label + b value) with a value() helper that parses the number via parseLocalNumber; workspace = locator('#workspace'). Methods: expectLocked(), expectUnlocked(), readState() (JSON.parse of localStorage 'nit-business-system-v1', only for assertions on persistence).
    - expect: details sections are opened only through page-object methods (CLAUDE.md)
  5. QuotePage extends BusinessSystem('kalkulacija'): part = getByRole('combobox',{name:'Dio iz kataloga'}); customer = getByRole('textbox',{name:'Kupac'}); quantity = getByRole('spinbutton',{name:'Količina kom'}); suggestedDelivery = getByRole('textbox',{name:/^Predložena isporuka/}); validUntil = getByRole('textbox',{name:'Ponuda vrijedi do'}); openTechnology()/openCompanyRules()/openBreakdown()/openTerms() click the summaries of details#technology, #company-rules, #quote-breakdown, #customer-terms (summary text 'Tehnologija dijela', 'Pravila obračuna firme', 'Odakle dolazi ovaj trošak?', 'Uslovi ponude'); scrap = getByRole('spinbutton',{name:'Dodatak za škart %'}); costPerPiece = kpi('Trošak po komadu'); seriesCost = kpi('Trošak cijele serije'); unitPrice = getByRole('spinbutton',{name:'Naša cijena po komadu KM'}); targetMargin = getByRole('spinbutton',{name:'Ciljana marža %'}); suggestButton = getByRole('button',{name:'Predloži cijenu prema ciljanoj marži ↗'}); customerTotal = kpi('Ukupno za kupca bez PDV-a'); remaining = kpi('Ostaje nakon obračunatih troškova'); marginText = getByText(/^Marža: .*Nije neto dobit\.$/); belowTargetWarning = getByText('Trenutna cijena je ispod ciljane marže.'); incomplete = getByText('Dopunite ispravne podatke za novi obračun.').first() (two nodes carry the text); batchButton(n) = getByRole('button',{name:new RegExp('^'+n+' kom')}); breakdownAmount(label) = breakdown.getByText(label,{exact:true}).locator('..').getByRole('button'); formulaDialog = locator('#quote-formula'); previewButton = getByRole('button',{name:'Pregledaj ponudu za kupca →'}); preview = locator('#quote-preview') with saveButton 'Sačuvaj ovu verziju ponude', acceptButton 'Označi da je kupac prihvatio', close 'Zatvori'; record = locator('#quote-record'); newOrderLink = record.getByRole('link',{name:/^Otvori novi nalog RN-\d+/}); newDraftButton = getByRole('button',{name:'Nova ponuda iz predloška'}). Methods: previewQuote(), saveAndAccept(), acceptQuote() (= helper below).
    - expect: #quote-error is deliberately not used (stays empty)
  6. MaterialPage('materijal'): table = getByRole('table'); materialRow(name) = table.getByRole('row',{name:new RegExp(name)}) with cells Na stanju/Rezervisano/Treba nalogu by index; potrebno/raspolozivo/nedostaje = kpi('Potrebno'|'Raspoloživo'|'Nedostaje'); arrival = kpi('Dolazak materijala'); reserveButton = getByRole('button',{name:/^Rezerviši materijal|^Rezervisano za nalog/}); receiveButton = getByRole('button',{name:/^Simuliraj prijem materijala|^Demo prijem evidentiran/}); howCalculated = getByText('Kako je izračunato?') (details summary). PlanPage('plan'): blockedHeading = getByRole('heading',{name:'Prvo osigurajte materijal'}); openMaterialLink = getByRole('link',{name:'Otvori materijal →'}); machine = getByRole('combobox',{name:'Mašina'}); startDay = getByRole('combobox',{name:'Dan početka'}); startTime = getByRole('combobox',{name:'Početak rada'}); weekSelect = getByRole('combobox',{name:'Sedmica plana'}); slotStatus = workspace.getByRole('status'); finish = getByText(/^Procijenjeni završetak:/); confirmButton = getByRole('button',{name:'Potvrdi termin'}); firstFreeButton = getByRole('button',{name:'Prvi slobodan termin'}); remainingWork = kpi('Preostalo rada'); planStatus = kpi('Status plana'); gridChip(orderId) = getByRole('button',{name:new RegExp('^'+orderId+' · \\d')}); trackLink = getByRole('link',{name:'Prati izvršenje →'}). Parsing helper parseFinish('27.11.2026. · 11:30') -> Date.
    - expect: Dates are only compared with each other
  7. WorkPage('proizvodnja'): table = getByRole('table'); orderRow(id) = table.getByRole('row',{name:new RegExp('^'+id)}) with cells Obrađeno/Za kupca/Preostalo ('5 / 100', '0 / 100', '14,3 h'); piecesInput = getByRole('spinbutton',{name:'Obrađeni komadi kom'}); minutesInput = getByRole('spinbutton',{name:'Vrijeme obrade min'}); downtimeInput = getByRole('spinbutton',{name:'Zastoj min'}); downtimeReason = getByRole('combobox',{name:'Razlog zastoja'}); saveButton = getByRole('button',{name:'Sačuvaj unos'}); entryStatus = workspace.getByRole('status'); remainingText = getByText(/Preostalo: \d+ kom/); downtimeTotal = kpi('Dosadašnji zastoji'); expectedCost = kpi('Očekivani trošak'); recentChanges = getByRole('heading',{name:'Posljednje promjene'}) section. QualityPage('kvalitet'): processed/awaiting/rework/ready = kpi('Obrađeno'|'Čeka kontrolu'|'Na doradi'|'Spremno za kupca'); accepted = getByRole('spinbutton',{name:'Prihvaćeno kom'}); scrap = getByRole('spinbutton',{name:'Škart kom'}); reworkInput = getByRole('spinbutton',{name:'Dorada kom'}); cause = getByRole('combobox',{name:'Uzrok'}); allocation = getByText(/^Raspoređeno: /); confirmInspection = getByRole('button',{name:'Potvrdi kontrolu'}); confirmRework = getByRole('button',{name:'Potvrdi doradu i prihvati komade'}); recordedScrap = kpi('Evidentirani škart'); costPerPiece = kpi('Očekivani trošak / kom'); doneHeading = getByRole('heading',{name:'Ova kontrola je završena'}); continueLink = getByRole('link',{name:'Nastavi obradu →'}). OverviewPage('pregled'): historyFilter = getByRole('combobox',{name:'Historija'}); machineFilter = getByRole('combobox',{name:'Mašina'}); customerFilter = getByRole('combobox',{name:'Kupac'}); whatIf(name 'Osnova'|'+10%'|'+20%') = getByRole('button',{name,exact:true}); orderCount = getByText(/^\d+ naloga$/); value = kpi('Vrijednost naloga'); expectedCost = kpi('Očekivani trošak'); remaining = kpi('Preostaje'); chart = getByRole('img',{name:'Historija vrijednosti poslova i troškova'}) with bars = chart.locator('text',{hasText:/^S\d+$/}); breakdownButton(label) = getByRole('button',{name:new RegExp('^'+label+': ')}); planVsExpected = kpi('Plan / očekivano'); margin = kpi('Marža'); toolRow(name) = locator('.toolrow').filter({hasText:name}) (stock = its b element, flagged when it has class warn); machineButtons = getByRole('button',{name:/^CNC-0\d$/}).
    - expect: KPI numbers are read with parseLocalNumber; page rounds to whole KM on page 06

#### 12.2. Reusable helper and fixtures (accept a quote first, then optional chain)

**File:** `fixtures/index.ts`

**Steps:**
  1. Rename/replace the old fixtures quote/planner/orders/stock with: nitHome, contactDialog, configurator (standalone), quotePage, materialPage, planPage, workPage, qualityPage, overviewPage (all new Page(page)). Add helper acceptQuote(quotePage, opts?) in pages/nit/QuotePage.ts: goto -> (optional: suggestButton click for a price at target) -> previewButton.click() -> preview.saveButton.click() -> preview.acceptButton.click() -> expect(record).toContainText(/kupac je prihvatio/i) and expect(newOrderLink).toHaveText(/RN-2609/); it returns { orderId: 'RN-2609', orderIndex: 8 } and works with the untouched seed draft in three clicks (price 38,50, margin 15,7% is below target but still acceptable).
    - expect: the accepted-quote precondition is needed by 7.2-7.5, 9.1, 9.3, 9.5, 9.6, 9.7, 10.x and 11.6; it is NOT needed by 7.1, 7.4 (seed order RN-2602), 8.1-8.6, 9.2, 9.4 (seeded orders), 11.1-11.5
  2. Add Playwright fixtures that build on each other: acceptedQuote (above), reservedOrder (acceptedQuote + materialPage.reserveButton click + expect 'Rezervisano za nalog'), plannedOrder (reservedOrder + planPage.firstFreeButton click if the default slot is not free + confirmButton click + expect planStatus 'Termin potvrđen'), workedOrder (plannedOrder + two entries of 5 pieces). Each fixture reuses the page objects only; no localStorage seeding in the specs except for reading state in 7.3 (writing localStorage would bypass the UI, which is what these tests exist to cover).
    - expect: Each Playwright test gets a fresh context, so no cleanup/reset is needed between tests
    - expect: Sessions are independent and can run in parallel (state is per browser context)

#### 12.3. Obsolete tests, page objects and data to delete or rewrite

**File:** `tests/nit/*.spec.ts`

**Steps:**
  1. Delete tests/nit/orders.spec.ts, planner.spec.ts, quote-calculator.spec.ts, stock.spec.ts, tools-tabs.spec.ts (their UI, #panel-quote/plan/orders/stock, the five tool tabs and 'Učinak radnika', no longer exists). Rewrite tests/nit/home.spec.ts and tests/nit/language.spec.ts completely (they use nitNavigation, the process switch and the old H1 'Od prvog klika do završenog posla.'); keep tests/nit/seed.spec.ts. Delete pages/nit/QuoteCalculator.ts, PlannerPanel.ts, OrdersPanel.ts, StockPanel.ts and their fixtures.
    - expect: npm run typecheck passes after the clean-up
  2. utils/nitData.ts: dead = nitTools, NitTool, nitNavigation (Usluge/Kako radimo/Naši proizvodi/Web stranice/Razgovarajmo ↗), demoOrders (18 orders, 5 per page, cells A/B/C), stockItems (aluminium/steel/inserts). Rewrite nitLanguages: bs 'Web stranice i aplikacije. Alati za vaš posao.' (html bs), hr same text (html hr), sr 'Веб странице и апликације. Алати за ваш посао.' (html sr-Cyrl), en 'Websites and applications. Tools for your business.', de 'Websites und Anwendungen. Werkzeuge für Ihren Betrieb.', each with button label (Bosanski, Hrvatski, Српски, English, Deutsch), summary aria-label ('Jezik i pismo: Bosanski', 'Jezik i pismo: Hrvatski', 'Језик и писмо: Српски', 'Language and script: English', 'Sprache und Schrift: Deutsch') and tab names. Keep parseLocalNumber ('870,61 KM' -> 870.61, '3.244,63 KM' -> 3244.63; it already strips thousands dots). Add: serviceTabs (4 names + panel ids + hashes #aplikacije/#proizvodnja/#it-podrska), businessSteps (slug, number, bs label: 01 Kalkulacija i ponuda, 02 Materijal i nabavka, 03 Plan proizvodnje, 04 Rad i zastoji, 05 Kvalitet i dorada, 06 Pregled firme), seededOrders (RN-2601..RN-2608), newOrderId 'RN-2609', lockedStepTitle 'Najprije pripremite i prihvatite ponudu.', configuratorModels (Solo, Duo, Panorama, Linea, Luma, Luma Plus; no prices or ranges), and a parseFinish() date parser for '27.11.2026. · 11:30'. Update CLAUDE.md nIT notes (orders table pagination, collapsed <details>) to the new site when the tests land.
    - expect: No test data duplicates a pricing or planning formula
