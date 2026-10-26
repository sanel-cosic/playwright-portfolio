# Test plans

Markdown test plans live here, one file per feature or Jira ticket
(e.g. `PROJ-123.md`). The Playwright **planner** agent writes them; a human
reviews them before the **generator** turns them into specs under `tests/`.

Reviewing the plan is where QA judgment matters most: check that the
scenarios cover the acceptance criteria, negative paths and edge cases,
not just the happy path.
