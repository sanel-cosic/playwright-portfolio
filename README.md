# Playwright Test Automation Portfolio

End-to-end **UI and API** test automation with **Playwright + TypeScript** across **two web
applications and a REST API**, running in **Docker** and **GitHub Actions**, built with
**Claude Code** using Playwright's planner / generator / healer agents.

[![Playwright Tests](https://github.com/sanel-cosic/playwright-portfolio/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sanel-cosic/playwright-portfolio/actions/workflows/playwright.yml)

| System under test | What it is | Test style |
|---|---|---|
| [SauceDemo](https://www.saucedemo.com) | Demo e-commerce shop | Classic flows: login, cart, checkout |
| [nIT](https://nit.uganjaj.ba) | Business site with a product configurator and a six-page linked business-system demo (Bosnian, 5 languages) | Calculations, multi-page state, gating, undo/reset, i18n, accessibility |
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

The site was redesigned in late 2026 (v2). The test plan for the redesign is
[`specs/QAP-4.md`](specs/QAP-4.md) and is traced to Jira epic QAP-4 and stories QAP-5 to QAP-13.

| Area | Tests |
|---|---|
| Home page | title & heading, skip link, Projekti link, animation toggle, no script errors / own failed requests, no horizontal scroll on phones (home, configurator, all six business pages) |
| Contact dialog | opens from every trigger, closes via × and Escape, context line only for context triggers, copy-e-mail feedback |
| Services tabs | four tabs with one visible panel, WAI-ARIA keyboard navigation (arrows, Home/End, wrap-around), project showcase and app screens, six business-system step links, hash deep links (`#proizvodnja`, …) |
| Languages | Bosnian default, Croatian / Serbian Cyrillic / English / German, `<html lang>`, pressed state, persists after reload, `?lang=` wins over the stored choice, runtime-generated tab names, language carried to the business system |
| Configurator | default model and price, every model, out-of-range sizes clamped to the model's range, **metamorphic**: a larger frame never needs less profile or glass, total = unit × quantity, reset, company view, embedded iframe + full tool |
| Business system shell | steps 02–05 locked until a quote is accepted, state survives reload and page changes, undo reverts only the last change, reset restores the seed data, back link to the production tab |
| 01 Quote | consistent totals, margin is a share of price, bigger batches are cheaper per piece, suggested price reaches the target margin, 4 invalid-input cases, cost breakdown adds up, customer preview hides internal cost, preview → save → accept creates a new order |
| 02 Material + 03 Plan | reservation raises "Rezervisano" by the need, shortage + simulated receipt, unreserved orders can't be planned, only suitable machines offered, clashing slots blocked, first free slot confirmed into the weekly grid, **metamorphic**: an earlier start never finishes later |
| 04 Work + 05 Quality | logged pieces flow to inspection but not to the customer, over-quantity rejected, downtime totals, inspection buckets, over-allocation blocked, rework → ready, **metamorphic**: more scrap never lowers the expected cost per piece |
| 06 Company overview | remaining = value − expected cost, material price what-if (+10 % / +20 %) is monotonic and reversible, customer / machine filters narrow and restore, breakdown sums to the expected cost, tools below minimum flagged, upstream changes reflected |

Business-system tests drive the real UI through chained fixtures (accept quote → reserve
material → plan → log work) instead of seeding `localStorage`. Each test gets its own
browser context, so every test starts from the demo's seed data.

### Restful Booker API
| Area | Tests |
|---|---|
| Booking API | create / read / filter / PUT / PATCH / DELETE, auth required, bad credentials |

## Testing calculations you don't own

The nIT configurator, quote, planner and overview contain business formulas that belong to
the site owner. Re-implementing them in the tests would just copy any bug into the test.
Instead the suite checks things that must hold for **any** correct implementation:

- **Consistency** – unit price × quantity = total; the cost breakdown sums to the series
  cost; remaining = order value − expected cost (within rounding)
- **Stated rules** – the page says margin is a share of the selling price, so the shown
  margin must equal remaining ÷ total; "suggest price" must land on the target margin
- **Boundaries** – size limits read from the page and clamped per model, quantity and
  margin limits, pieces just over what remains, inspection totals just over what waits
- **Metamorphic relations** – bigger batches must not cost *more* per piece; a larger
  frame never needs *less* profile; an earlier start never finishes *later*; more scrap
  never lowers the expected cost per piece; a material price rise never raises what remains

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

### Ready-made image (no setup)

Every commit on `main` that passes all tests is published as a Docker image to
GitHub Container Registry by `.github/workflows/publish-image.yml`:

```bash
docker run --rm --ipc=host ghcr.io/sanel-cosic/playwright-portfolio:latest
```

Tags: `latest` (newest tested version) and `sha-<commit>` (a fixed version).

## Project structure

```
pages/saucedemo/     Page objects for the shop
pages/nit/           Page objects for the nIT home page, contact dialog, configurator and the six business-system pages
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
first attempt's trace before rerunning.
- **Redundant files from an older project instance** - While conducting an experiment to test the healer agent capabilities I noticed redundant files from a
previous version of the project structure which the agent did not notice right away. I communicated this discovery and all references to old files were corrected
and the experiment could proceed.

## Why Playwright over Selenium (from 8 years of QA)

- Auto-waiting and web-first assertions remove most explicit waits and flakiness
- Built-in runner, parallelism, retries, HTML report, traces, video
- UI and API testing in one framework (`request` fixture)
- Network interception and mocking without extra tools
- Trace Viewer makes CI failures debuggable in minutes