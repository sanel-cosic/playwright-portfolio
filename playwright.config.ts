import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import 'dotenv/config';

const isCI = !!process.env.CI;

// ── Applications under test ──────────────────────────────────────────────
export const SAUCE_BASE_URL = process.env.UI_BASE_URL ?? 'https://www.saucedemo.com';
export const API_BASE_URL = process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com';

// nIT can run against the live site (default) or a local copy of the site
// files: set NIT_SITE_DIR to a folder containing index.html and Playwright
// starts a small static server for it (see scripts/serve-static.mjs).
const NIT_SITE_DIR = process.env.NIT_SITE_DIR;
const NIT_LOCAL_PORT = 4173;
export const NIT_BASE_URL = NIT_SITE_DIR
  ? `http://127.0.0.1:${NIT_LOCAL_PORT}`
  : (process.env.NIT_BASE_URL ?? 'https://nit.uganjaj.ba');

export const AUTH_FILE = '.auth/saucedemo-standard-user.json';

const browsers = [
  { name: 'chromium', device: devices['Desktop Chrome'] },
  { name: 'firefox', device: devices['Desktop Firefox'] },
  { name: 'webkit', device: devices['Desktop Safari'] },
];

const webServer: PlaywrightTestConfig['webServer'] = NIT_SITE_DIR
  ? {
      command: `node scripts/serve-static.mjs "${NIT_SITE_DIR}" ${NIT_LOCAL_PORT}`,
      url: NIT_BASE_URL,
      reuseExistingServer: !isCI,
    }
  : undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI, // fail CI if someone left test.only in the code
  // 1 locally: a one-off live-site timeout is retried and reported as "flaky", not hidden
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }], // consumed by CI / Jira test-management plugins
  ],

  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer,

  projects: [
    // SauceDemo: log in once, then reuse the session in every browser
    {
      name: 'saucedemo-setup',
      testDir: './tests/saucedemo',
      testMatch: /auth\.setup\.ts/,
      use: { baseURL: SAUCE_BASE_URL, testIdAttribute: 'data-test' },
    },
    ...browsers.map(({ name, device }) => ({
      name: `saucedemo-${name}`,
      testDir: './tests/saucedemo',
      dependencies: ['saucedemo-setup'],
      use: {
        ...device,
        baseURL: SAUCE_BASE_URL,
        // SauceDemo marks elements with data-test="..." – lets us use page.getByTestId()
        testIdAttribute: 'data-test',
        storageState: AUTH_FILE,
      },
    })),

    // nIT business-tools site: public, no login needed
    ...browsers.map(({ name, device }) => ({
      name: `nit-${name}`,
      testDir: './tests/nit',
      // The live site slows down under many parallel pages (goto timeouts in full runs),
      // so cap each nIT browser at 2 workers; the other projects use the rest.
      workers: NIT_SITE_DIR ? undefined : 2,
      use: {
        ...device,
        baseURL: NIT_BASE_URL,
        locale: 'bs-BA',
        timezoneId: 'Europe/Sarajevo',
      },
    })),

    // Restful Booker API – no browser is launched at all
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
