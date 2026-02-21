import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration
 *
 * This config is set up for local development testing.
 * It assumes the dev server is running on port 3001.
 */
export default defineConfig({
  testDir: './e2e',
  // Run tests serially to avoid race conditions with shared Convex backend
  fullyParallel: false,
  workers: process.env.CI ? 1 : 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run the dev server before starting tests (optional - can also run manually)
  // Uncomment this if you want Playwright to start the server automatically
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3001',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
})
