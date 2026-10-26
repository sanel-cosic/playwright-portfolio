# Step-by-step guide

Work through these in order. Each step ends with a commit, so your Git history
itself shows how the project grew – recruiters do look at that.

## Step 0 – Install tools (once)

| Tool | Check | Get it |
|---|---|---|
| Node.js 20+ (22 LTS recommended) | `node -v` | nodejs.org |
| Git | `git --version` | git-scm.com |
| Docker Desktop | `docker --version` | docker.com |
| VS Code + "Playwright Test for VSCode" extension | – | code.visualstudio.com |
| Claude Code | `claude --version` | see docs.claude.com → Claude Code |
| GitHub account | – | github.com |

## Step 1 – Run the project locally

```bash
cd playwright-portfolio
npm install                       # creates package-lock.json
npx playwright install --with-deps
npm run typecheck
npx playwright test --project=api
npm run test:chromium             # SauceDemo + nIT in Chromium
npm run report
```

Things to try so you understand what you have:
- `npm run ui-mode` – click a test, use the timeline to "time-travel" through each step.
- Break a locator on purpose (e.g. change `'Login'` to `'Log in'` in `pages/saucedemo/LoginPage.ts`),
  run with `--retries=1`, then open the report and look at the **trace**. Undo the change.
- `npm run codegen:saucedemo` or `npm run codegen:nit` – record clicks; compare the generated
  code with the page objects.
- Open `tests/nit/planner.spec.ts` and read the **metamorphic** test ("more shifts never mean
  fewer orders on time"). It's a good interview story: how to test logic whose exact answer
  you don't know.
  
## Step 2 – Put it on GitHub

```bash
git init
git add .
git commit -m "chore: scaffold Playwright UI + API test framework (SauceDemo, nIT, Restful Booker)"
git branch -M main
# create an EMPTY public repo named playwright-portfolio on github.com, then:
git remote add origin https://github.com/YOUR-USER/playwright-portfolio.git
git push -u origin main
```

Before pushing, run `git status` and check that `nit-site/`, `.env` and `.auth/` are **not**
listed – `.gitignore` should keep them out.

Open the **Actions** tab: the workflow runs the API tests plus one UI job per app and
browser (2 apps × 3 browsers = 6 jobs).
When it's green, add the badge line at the top of `README.md` and commit.

## Step 3 – Run in Docker

```bash
docker compose run --rm tests
```

First build downloads the Playwright image (~2 GB). The run should match CI exactly.
If it doesn't, check that the image tag in `Dockerfile` matches `@playwright/test`
in `package.json` (`npx playwright --version`).

## Step 4 – Connect Claude Code to Playwright

```bash
claude                              # start Claude Code in the repo folder
```

`.mcp.json` already registers the Playwright MCP server for this project; Claude Code
asks you to approve it the first time. Check with `/mcp`.

Install Playwright's three test agents as Claude Code subagents:

```bash
npx playwright init-agents --loop=claude
```

First prompts to try:

> Read CLAUDE.md. Use playwright mcp to open saucedemo, log in as standard_user,
> and describe the product details page. Don't write code yet.

Or for nIT:

> Read CLAUDE.md. Use playwright mcp to open https://nit.uganjaj.ba, open the
> "05 Učinak radnika" tool and describe what a user can do there. Don't write code yet.

> Use the planner agent to write a test plan for the product details page into
> specs/product-details.md. Use tests/saucedemo/seed.spec.ts as the seed
> (for nIT: tests/nit/seed.spec.ts).

Review and edit the plan yourself, then:

> Use the generator agent to implement specs/product-details.md as
> tests/saucedemo/product-details.spec.ts. Add a ProductDetailsPage page object
> in pages/saucedemo/.
> Run the tests on chromium and fix any test-side failures.

Read every line it generated. Ask "why" about anything you don't understand –
that's how you learn TypeScript and Playwright fast.

```bash
git checkout -b test/product-details
git add . && git commit -m "test: add product details tests (planner + generator)"
git push -u origin test/product-details
```

Open a pull request and let CI run on it.

## Step 5 – Try the healer

1. In `pages/saucedemo/InventoryPage.ts`, change `'Add to cart'` to `'Add To Basket'` (simulates a UI change).
2. Ask Claude Code: *"Use the healer agent to fix the failing tests."*
3. Check the diff: did it fix the page object (good) or edit/weaken the assertion (bad)?
   Write down what happened – this is exactly the kind of judgment you describe in interviews.

## Step 6 – Connect Jira

Create a free Jira Cloud site (atlassian.com → Jira, free plan) with a project, e.g. key `QAP`.
Write 2–3 stories with acceptance criteria, e.g. *"As a shopper I can sort products by price"*.

Add Atlassian's official remote MCP server to Claude Code (check Atlassian's
"Rovo MCP Server" docs for the current URL – it has changed before):

```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp
```

Then inside Claude Code run `/mcp` and log in to Atlassian in the browser.

Full workflow prompt:

> Read Jira ticket QAP-1. Write a test plan for its acceptance criteria into
> specs/QAP-1.md and stop so I can review it.

> Plan approved. Generate the tests, run them in Docker, create branch
> test/QAP-1-sort-by-price, commit, push, open a PR, and add a comment to QAP-1
> with the PR link and test results. Don't change the ticket status.

If a test finds a real bug: *"Create a Bug in QAP linked to QAP-1 with steps to
reproduce, expected vs actual, and attach the trace path."*

## Step 7 – Polish for your CV

- Fill in the **"How AI was used (and where I overrode it)"** section of the README with
  your real examples.
- Pin the repo on your GitHub profile.
- CV line example: *"Built a Playwright/TypeScript test framework covering two web apps and a
  REST API (POM, data-driven, boundary and metamorphic tests, Docker, GitHub Actions CI across
  3 browsers) using Claude Code with Playwright MCP agents and Jira integration for an
  AI-assisted ticket-to-PR testing workflow."*

## Ideas to extend later
- nIT: tests for the "05 Učinak radnika" tool (period switch, per-worker details), the
  "Web stranice" concept showcase, and the standalone configurator page
- Visual regression: `await expect(page).toHaveScreenshot()`
- Accessibility checks with `@axe-core/playwright`
- Mock an API response with `page.route()` to test an error state
- Publish the HTML report to GitHub Pages from CI
- Same suite in C#/.NET Playwright, to show you can bridge both worlds
