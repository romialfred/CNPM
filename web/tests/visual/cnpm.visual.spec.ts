import { expect, test, type Page } from '@playwright/test';
import { startChallenge } from './auth-flow';

/**
 * Baselines visuelles des écrans réellement implémentés.
 *
 * PUB-001, PUB-006 et BO-002 ne sont pas listés tant que leurs routes n'existent
 * pas : la redirection de repli les capturerait contre la page d'accueil provisoire,
 * produisant des baselines fausses que les régressions futures compareraient au
 * mauvais écran.
 *
 * Chaque état est amené par le parcours réel. Une navigation directe vers
 * `/auth/verify` n'a aucun défi actif et affiche le repli « session expirée » : la
 * baseline ne montrerait alors pas le panneau OTP qu'elle prétend couvrir.
 */
const screens: ReadonlyArray<{ id: string; open: (page: Page) => Promise<void> }> = [
  {
    id: 'AUTH-001-login',
    open: async (page) => {
      await page.goto('/auth/login');
      await expect(page.getByRole('heading', { level: 1, name: 'Connexion' })).toBeVisible();
    },
  },
  {
    id: 'AUTH-001-verify',
    open: async (page) => {
      await startChallenge(page);
      // Garde anti-repli : sans elle, la capture montrerait « session expirée ».
      await expect(page.getByRole('group', { name: /Code de vérification/ })).toBeVisible();
    },
  },
  {
    id: 'AUTH-001-verify-expired',
    open: async (page) => {
      await page.goto('/auth/verify');
      await expect(page.getByText('Session de connexion expirée')).toBeVisible();
    },
  },
];

for (const screen of screens) {
  test(`${screen.id} visual baseline`, async ({ page }) => {
    await page.addInitScript(() => {
      const fixed = new Date('2024-05-27T12:00:00Z').valueOf();
      const RealDate = Date;
      // @ts-expect-error deterministic visual clock
      window.Date = class extends RealDate {
        constructor(...args: unknown[]) {
          super(...((args.length ? args : [fixed]) as []));
        }
        static now() {
          return fixed;
        }
      };
    });
    await screen.open(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => document.fonts.ready);
    // Le décompte de renvoi change chaque seconde : le masquer évite une baseline
    // instable, sans masquer quoi que ce soit de la composition auditée.
    await expect(page.locator('body')).toHaveScreenshot(`${screen.id}.png`, {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.005,
      mask: [page.locator('.cnpm-verify__countdown')],
    });
  });
}
