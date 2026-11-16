# CLAUDE.md – instructions for Claude Code in this repo

## Project
End-to-end test automation portfolio. Playwright + TypeScript. Three systems under test:
- **SauceDemo** – https://www.saucedemo.com – demo e-commerce shop (login, cart, checkout)
- **nIT** – https://nit.uganjaj.ba – business site (v2 since QAP-4): home page with services
  tabs, contact dialog and language switcher; a window/door configurator (`/konfigurator`,
  also embedded as an iframe on the home page); and a six-page linked business-system demo
  under `/poslovni-sistem/` (kalkulacija, materijal, plan, proizvodnja, kvalitet, pregled).
  UI copy is Bosnian by default; tests use the Bosnian texts unless they test translations.
- **Restful Booker** – https://restful-booker.herokuapp.com – hotel booking REST API

## Layout
- `pages/saucedemo/`, `pages/nit/` – Page Object Model classes, one per screen or dialog (nIT business pages share `BusinessSystemPage`).
  Locators live here, never in specs.
- `fixtures/index.ts` – custom fixtures that inject page objects and `bookingApi`.
- `tests/saucedemo/` – shop tests (projects: saucedemo-chromium/firefox/webkit).
  `auth.setup.ts` logs in once and saves the session to `.auth/`.
- `tests/nit/` – nIT tests (projects: nit-chromium/firefox/webkit). No login.
- `tests/api/` – HTTP-only tests (project: api).
- `tests/*/seed.spec.ts` – seed tests for the Playwright Test Agents, one per app. Copy their style.
- `specs/` – Markdown test plans written by the planner agent.
- `utils/` – test data (`testData.ts`, `nitData.ts`) and the API client.
- `scripts/serve-static.mjs` – serves a local copy of the nIT site when `NIT_SITE_DIR` is set.

## Conventions (follow these when writing or fixing tests)
- Import `{ test, expect }` from `../../fixtures`, not from `@playwright/test`.
- Locator priority: `getByRole` > `getByLabel`/`getByPlaceholder` > `getByTestId` (data-test) > CSS. Never XPath.
- No `page.waitForTimeout()`. Rely on auto-waiting and web-first assertions (`await expect(locator)...`).
- One behaviour per test. Name tests as user-facing outcomes ("user can ...", "... is rejected").
- Use `test.step()` for multi-stage flows. Tag critical paths with `@smoke` in the title.
- API tests create their own data via `newBooking()`; never depend on pre-existing records.
- New locators go into the page object first; add a method only if two or more tests need it.
- nIT specifics:
  - Headings that contain `<br>` or `<em>` → assert with `toHaveAccessibleName`, not `toHaveText`.
  - Collapsed sections (`<details>`) must be expanded via the page object before use
    (e.g. `quotePage.openTechnology()`, `openBreakdown()`).
  - Never click inside a hidden tab panel (Playwright waits until timeout): select the tab
    first (`nitHome.openService(...)`). Don't scan the project panel's DOM (cross-origin iframes).
  - Business system: state is in `localStorage` (`nit-business-system-v1`) and each test has a
    fresh context, so tests start from the seed (orders RN-2601…RN-2608). Build state through
    the UI with the chain fixtures `acceptedQuote` → `reservedOrder` → `plannedOrder` →
    `workedOrder` (new order RN-2609); don't seed `localStorage`.
  - Steps 02–05 are locked only in the step nav of page 01 (`<a aria-disabled>` without role):
    use `lockedSteps` (`getByTitle`), not `getByRole('link')`.
  - Dates on the business pages are relative to today: compare dates with each other, never
    assert absolute dates. Material and price figures change: never hard-code them.
  - Select options by their full label (e.g. machine "CNC-01 · Glodalica · 3 ose"; use
    `planPage.chooseSlot` / `pickOrder`), never a bare short label.
  - Use `toHaveAttribute('aria-pressed', ...)` – `toBePressed` doesn't typecheck in this
    Playwright version.
  - Validation is native: check `validity.valid` (page-object `isValid`), not the
    browser-locale message text.
  - Ignore third-party noise: kjtools.ba 404s and the THREE.js WebGL warning.
  - Don't re-implement the site's pricing/planning formulas. Assert relationships between
    the numbers on screen, explicit rules from the page, boundaries and metamorphic rules
    (e.g. an earlier start must never finish later). Parse numbers with `parseLocalNumber`.
  - Don't assert contact details, worker names or product links – they differ between
    the live site and the owner's test build.

## Commands
- `npm run typecheck` – must pass before committing
- `npx playwright test --project=nit-chromium` / `--project=saucedemo-chromium` – fast local loop
- `npm run test:chromium` – every app in Chromium
- `npx playwright test --project=api`
- `npm run test:smoke`
- `npm run docker:test` – same run as CI

## Workflow for a Jira ticket (e.g. PROJ-123)
1. Read the ticket and its acceptance criteria via the Atlassian MCP server.
2. Write a plan to `specs/PROJ-123.md` (planner agent) and STOP for human review.
3. After approval, generate tests (generator agent), run them, fix test-side issues.
4. Branch `test/PROJ-123-short-description`; commit message `test(PROJ-123): ...`.
5. Open a PR and post a summary comment on the ticket.

## Never do autonomously
- Never weaken or delete an assertion just to make a test pass. If the app looks broken,
  mark the test `test.fail()` with a comment and report it as a possible bug instead.
- Before calling something an app bug, confirm it (inspect the DOM / trace). A test that
  "unexpectedly passes" after `test.fail()` means the bug claim was wrong or is fixed.
- Never commit `.env`, `.auth/`, `nit-site/`, tokens, or real credentials.
- Never push to `main`, force-push, or transition / close Jira tickets without asking.
