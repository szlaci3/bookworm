import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: false,
  timeout: 45000, expect: { timeout: 15000 }, workers: 1,
  use: { baseURL: process.env.BOOKWORM_TEST_URL || 'http://127.0.0.1:5173', viewport: { width: 960, height: 640 },
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: process.env.BOOKWORM_TEST_URL ? undefined : { command: 'node_modules/.bin/vite --host 0.0.0.0', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
