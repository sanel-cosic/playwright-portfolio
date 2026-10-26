# Playwright Test Automation Portfolio

End-to-end **UI and API** test automation with **Playwright + TypeScript** across **two web
applications and a REST API**, running in **Docker** and **GitHub Actions**, built with
**Claude Code** using Playwright's planner / generator / healer agents.

[![Playwright Tests](https://github.com/sanel-cosic/playwright-portfolio/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sanel-cosic/playwright-portfolio/actions/workflows/playwright.yml)

| System under test | What it is | Test style |
|---|---|---|
| [SauceDemo](https://www.saucedemo.com) | Demo e-commerce shop | Classic flows: login, cart, checkout |
| [nIT](https://nit.uganjaj.ba) | Business-tools site with interactive demos (Bosnian, 5 languages) | Calculations, filters, state across tools, i18n, accessibility |
| [Restful Booker](https://restful-booker.herokuapp.com/apidoc/index.html) | Hotel booking REST API | CRUD, auth, negative cases |

**Browsers:** Chromium, Firefox, WebKit (Safari engine) ·
**Patterns:** Page Object Model, custom fixtures, saved auth state, data-driven tests,
boundary values, metamorphic tests, API client layer

## What's covered

### SauceDemo
| Area | Tests |
|---|---|
| Login | happy path, locked-out user, wrong credentials, required-field validation, protected-route redirect |
| Inventory | catalogue, sorting by price / name, cart badge, broken-image check |
| Checkout | full purchase flow with total verification, required details, cart persistence |
| Network | blocked images, console-error watch (request interception) |

### nIT
| Area | Tests |
|---|---|
| Home page | title & heading, every nav link reaches its section, hero process switch, animation toggle, no script errors / broken files, no horizontal scroll on phones |
| Tools workbench | 5 tabs show only their own panel, WAI-ARIA keyboard navigation (arrows, Home/End, wrap-around) |
| Quote calculator | on-screen totals are consistent, margin is a share of price (not a mark-up), zero margin, scrap rounding (data-driven), bigger batches are cheaper, 4 invalid-input cases |
| Order overview | pagination, filter per production cell (data-driven), search, empty state, clear filters, completing an order updates status & KPIs, over-quantity is blocked, missing material counted |
| Stock | reorder warnings, boundary values around the minimum, all-clear state, invalid quantities |
| Production planner | plan on load, stale-plan warning, **metamorphic**: more shifts never means fewer orders on time, order edits flow into the next plan, malformed import rejected, custom import + reset |
| Languages | Bosnian default, English / German / Serbian Cyrillic, `<html lang>`, persists after reload, `?lang=` URL parameter, runtime-generated text translated, accessible name of the language button |

### Restful Booker API
| Area | Tests |
|---|---|
| Booking API | create / read / filter / PUT / PATCH / DELETE, auth required, bad credentials |

## Testing calculations you don't own

The nIT calculator and planner contain business formulas that belong to the site owner.
Re-implementing them in the tests would just copy any bug into the test. Instead the
suite checks things that must hold for **any** correct implementation:

- **Consistency** – unit price × quantity = total offer (within rounding)
- **Stated rules** – the page says margin is a share of the selling price, so
  `price = cost / (1 − margin)`; planned input pieces are rounded *up*
- **Boundaries** – stock exactly at, just below and just above the minimum
- **Metamorphic relations** – more shifts must never produce *fewer* orders on time;
  bigger batches must not cost *more* per piece

## Run it

```bash
npm ci
npx playwright install --with-deps   # on Windows: npx playwright install
cp .env.example .env                 # optional – defaults point at the live sites

npm test                      # everything
npm run test:nit              # nIT in all three browsers
npm run test:saucedemo        # SauceDemo in all three browsers
npm run test:api              # API only, no browser
npm run test:chromium         # every app, Chromium only (fastest)
npm run test:smoke            # @smoke tagged critical paths
npm run ui-mode               # interactive UI mode
npm run report                # open the HTML report
```
### In Docker (same image as CI)

```bash
docker compose run --rm tests
docker compose run --rm tests npx playwright test --project=nit-chromium
```

Reports are written to `playwright-report/` on your machine.

## Project structure

```
pages/saucedemo/     Page objects for the shop
pages/nit/           Page objects for the nIT home page and each tool panel
fixtures/            Custom fixtures that inject page objects / API client
tests/saucedemo/     Shop tests (+ auth.setup.ts: logs in once, reuses the session)
tests/nit/           nIT tests
tests/api/           API tests
utils/               Test data + Restful Booker API client
scripts/             Local static server for the nIT site
specs/               Markdown test plans from the planner agent
CLAUDE.md            Rules Claude Code follows in this repo
.mcp.json            Playwright MCP server for Claude Code
```

## How AI was used (and where I overrode it)

Tests were planned and generated with **Claude Code** + **Playwright MCP** and the
built-in Playwright Test Agents (`npx playwright init-agents --loop=claude`):

1. **Planner** explored the live app and wrote a Markdown plan into `specs/`.
2. I **reviewed the plan** as a QA engineer – added negative paths and edge cases.
3. **Generator** turned the approved plan into specs, following `CLAUDE.md` conventions.
4. **Healer** repaired broken locators after UI changes; any "fix" that weakened an
   assertion was rejected.

Examples worth reading:
- **Slow-loading image reported as "broken"** - A test flagged a broken image, but in UI mode I could see it was only loading slowly. The
root cause was reading naturalWidth once instead of waiting for load. I had it switched to expect.poll so it waits for the load to finish
while staying strict on genuinely broken images. I also moved the locator into the page object and confirmed stability with repeated runs.
- **A hosting 404 caught by the console-error check** - A console-error test failed on a 404 that no other test caught. In the UI-mode
timeline I saw two document loads: /inventory.html returned 404, then /?/inventory.html loaded fine. The site is a React SPA on GitHub
Pages: the server 404s on client-side routes, and a custom 404 page redirects to the root, where the app restores the URL. It's hosting
behaviour that real users hit too, not an app bug. Instead of adding '404' to the ignore list, which would hide real broken resources, we
excluded only that one 404, matched by its text and its source URL, and kept the direct-visit coverage.
- **Full-suite timeouts and a recurring "flaky" language test** - Complete test suite threw a few timeouts on most full runs, and one
WebKit test kept passing only on retry. I isolated it first: subsets ran clean, so I suspected a load bottleneck and asked whether worker
count would fix it. I was partly right. Load was the trigger, but traces and a network comparison showed the stall was the live site: its
Cloudflare protection and late assets never finished under parallel requests. We made the menu step bounded and confirmed, so it can't
hang silently. I chose to keep testing the live site, with capped workers, one retry and traces on every failure, plus a rule: check the
first attempt's trace before rerunning."


## Why Playwright over Selenium (from 8 years of QA)

- Auto-waiting and web-first assertions remove most explicit waits and flakiness
- Built-in runner, parallelism, retries, HTML report, traces, video
- UI and API testing in one framework (`request` fixture)
- Network interception and mocking without extra tools
- Trace Viewer makes CI failures debuggable in minutes