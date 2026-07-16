import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200',
    locale: 'fr-FR', timezoneId: 'Etc/GMT', colorScheme: 'light',
    reducedMotion: 'reduce', trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'chromium-reference', use: { ...devices['Desktop Chrome'], viewport: { width: 1672, height: 941 } } },
    { name: 'mobile-390', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: { command: 'npm run start:test', url: 'http://127.0.0.1:4200', reuseExistingServer: !process.env.CI },
});
