// @ts-check
import { defineConfig, devices } from '@playwright/test'

const localProjects = [
  {
    name: 'setup subway',
    testMatch: /global\.setup\.ts/,
    teardown: 'teardown subway',
  },
  {
    name: 'teardown subway',
    testMatch: /global\.teardown\.ts/,
  },
  {
    name: 'firefox',
    dependencies: ['setup subway'],
    use: { ...devices['Desktop Firefox'] },
  },

  {
    name: 'webkit',
    dependencies: ['setup subway'],
    use: { ...devices['Desktop Safari'] },
  },

  /* Test against mobile viewports. */
  {
    name: 'Mobile Chrome',
    dependencies: ['setup subway'],
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'Mobile Safari',
    dependencies: ['setup subway'],
    use: { ...devices['iPhone 12'] },
  },

  /* Test against branded browsers. */
  {
    name: 'Google Chrome',
    dependencies: ['setup subway'],
    use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  },
]
const ciProjects = [
  {
    name: 'Google Chrome',
    use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  },
]

const localServers = [
  {
    command: `cd ${process.env.SUBWAY_REPO_PATH} && pnpm run e2e:destroy && pnpm run e2e:create && pnpm run e2e:backend`,
    name: 'SUBWAY',
    url: 'http://localhost:3001/healthz',
    reuseExistingServer: false,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: process.env.CI ? 'test_e2e_ci' : 'test_e2e',
    },
    gracefulShutdown: {
      signal: 'SIGTERM', // Sends a Ctrl+C signal to your server
      timeout: 20000, // Wait before doing a hard kill
    },
  },
  {
    command: `pnpm run build --mode ${process.env.CI ? 'test_e2e_ci' : 'test_e2e'} &&  pnpm run preview --port 8081`,
    name: 'HIGH-LINE SERVE',
    url: 'http://localhost:8081',
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60000,
    env: {
      NODE_ENV: process.env.CI ? 'test_e2e_ci' : 'test_e2e',
    },
    gracefulShutdown: {
      signal: 'SIGTERM', // Sends a Ctrl+C signal to your server
      timeout: 500, // Wait before doing a hard kill
    },
  },
]

const ciServers = [
  {
    command: `pnpm run build --mode ${process.env.CI ? 'test_e2e_ci' : 'test_e2e'} &&  pnpm run preview --port 8081 > high-line.log 2>&1`,
    name: 'HIGH-LINE SERVE',
    url: 'http://localhost:8081',
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 60000,
    env: {
      NODE_ENV: process.env.CI ? 'test_e2e_ci' : 'test_e2e',
    },
    gracefulShutdown: {
      signal: 'SIGTERM', // Sends a Ctrl+C signal to your server
      timeout: 10000, // Wait before doing a hard kill
    },
  },
]

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only. (TODO: Disabled for now) */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'list' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8081',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  ignoreSnapshots: !process.env.INCLUDE_SNAPSHOT_TESTS,

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  webServer: process.env.CI ? ciServers : localServers,

  /* Configure projects for major browsers */
  projects: process.env.CI ? ciProjects : localProjects,
})
