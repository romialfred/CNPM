import { defineConfig, devices } from '@playwright/test';

/**
 * Projets alignés sur les viewports obligatoires de
 * `docs/ui-handoff/data/viewports.json` (`"mandatory": true`), comme l'exige
 * `.claude/rules/visual-regression.md`. La configuration précédente n'en couvrait que
 * trois : les écarts sur les viewports absents — dont VP-360 — n'étaient donc
 * détectables que par un contrôle manuel, jamais par la CI.
 *
 * Tous les projets utilisent Chromium. Le projet mobile s'appuyait auparavant sur le
 * descripteur `iPhone 13`, qui cible WebKit : faute de binaire WebKit installé, il
 * échouait au lancement et ne testait donc rien. La couverture multi-moteurs est un
 * sujet distinct de la couverture multi-viewports et reste à ouvrir.
 */
export default defineConfig({
  testDir: './tests',
  // Chemin de baseline sans suffixe de plateforme : par défaut Playwright ajoute
  // `-win32`/`-linux`, si bien qu'une baseline produite sur un poste de développement
  // Windows ne serait jamais comparée par une CI Linux — le contrôle passerait en
  // régénérant silencieusement. Les baselines doivent être produites dans le même
  // environnement que la CI pour être comparables.
  snapshotPathTemplate: '{testDir}/__baselines__/{projectName}/{arg}{ext}',
  // Une baseline manquante doit faire ÉCHOUER le test, jamais être écrite en silence.
  // Par défaut, Playwright génère la capture absente et rapporte un succès : le
  // premier lancement d'une suite visuelle « passe » sans rien avoir comparé, et la
  // baseline non revue devient la référence. Les baselines se produisent
  // délibérément, après revue UX, avec `--update-snapshots`.
  updateSnapshots: 'none',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200',
    locale: 'fr-FR',
    timezoneId: 'Etc/GMT',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } } },
    { name: 'mobile-390', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'mobile-430', use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 932 } } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'laptop-1024', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'chromium-reference', use: { ...devices['Desktop Chrome'], viewport: { width: 1672, height: 941 } } },
  ],
  webServer: {
    command: 'npm run start:test',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env.CI,
  },
});
