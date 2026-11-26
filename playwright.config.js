import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 35000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8080/DataDojo/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node tools/serve_subpath.js',
    url: 'http://127.0.0.1:8080/DataDojo/',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
