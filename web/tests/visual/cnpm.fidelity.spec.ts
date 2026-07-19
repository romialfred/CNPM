import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

interface FidelityScreen {
  readonly id: string;
  readonly route: string;
  readonly heading: string | RegExp;
  readonly prepare?: (page: Page) => Promise<void>;
}

const screens: readonly FidelityScreen[] = [
  { id: 'REF-AUTH-001', route: '/auth/login', heading: 'Connexion' },
  {
    id: 'REF-PUB-001',
    route: '/',
    heading: /La plateforme digitale du Conseil National du Patronat du Mali/,
  },
  { id: 'REF-PUB-006', route: '/membres/somacop-sa', heading: 'SOMACOP SA' },
  { id: 'REF-BO-001', route: '/admin/dashboard', heading: 'Tableau de bord' },
  { id: 'REF-BO-002', route: '/admin/members', heading: 'Membres' },
  { id: 'REF-BO-003', route: '/admin/members/MEM-0001', heading: 'SOMACOP SA' },
  {
    id: 'REF-BO-009',
    route: '/admin/enrollments/new',
    heading: 'Nouvel enrôlement',
    // Le profil démo reprend légitimement la première étape incomplète. La référence
    // BO-009 documente toutefois l’état Identification : on rejoint cet état par le
    // stepper public de l’écran avant de mesurer sa fidélité.
    prepare: async (page) => {
      await page.getByRole('button', { name: /Identification/ }).click();
    },
  },
  { id: 'REF-BO-011', route: '/admin/contributions', heading: 'Cotisations' },
  {
    id: 'REF-BO-014',
    route: '/admin/payments/reconciliation',
    heading: 'Paiement, rapprochement et reçu',
  },
  {
    id: 'REF-MP-001',
    route: '/member/home',
    heading: /Bienvenue,/,
  },
  { id: 'REF-BO-017', route: '/admin/recovery/campaigns', heading: 'Campagnes de relance' },
  { id: 'REF-BO-028', route: '/admin/reporting', heading: 'Reporting décisionnel' },
  {
    id: 'REF-BO-030',
    route: '/admin/security/users',
    heading: 'Administration et sécurité',
  },
];

async function freezeVisualEnvironment(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const fixed = new Date('2024-05-27T12:00:00Z').valueOf();
    const RealDate = Date;
    // @ts-expect-error Horloge déterministe réservée aux captures de fidélité.
    window.Date = class extends RealDate {
      constructor(...args: unknown[]) {
        super(...((args.length ? args : [fixed]) as []));
      }

      static now(): number {
        return fixed;
      }
    };
  });
}

test.describe('captures de fidélité — références 1672×941', () => {
  test.beforeEach(async ({ page }) => {
    await freezeVisualEnvironment(page);
  });

  for (const screen of screens) {
    test(`${screen.id} produit une capture déterministe`, async ({ page }) => {
      const captureRoot = process.env.CNPM_CAPTURE_DIR;
      if (!captureRoot) {
        throw new Error('CNPM_CAPTURE_DIR doit désigner le répertoire de captures.');
      }

      await page.goto(screen.route, { waitUntil: 'networkidle' });
      await expect(page.getByRole('heading', { level: 1, name: screen.heading })).toBeVisible();
      await screen.prepare?.(page);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(900);
      await page.addStyleTag({
        content:
          '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
      });

      const outputDirectory = path.resolve(captureRoot, screen.id);
      mkdirSync(outputDirectory, { recursive: true });
      await page.screenshot({
        path: path.join(outputDirectory, '1672x941.png'),
        fullPage: false,
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }
});
