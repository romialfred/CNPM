import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const CAPTURE_DIR = process.env.CNPM_INTEGRATIONS_CAPTURE_DIR;

const REQUIRED_VIEWPORTS = [
  { width: 320, height: 900, label: '320 CSS px' },
  { width: 360, height: 800, label: 'petit mobile' },
  { width: 390, height: 844, label: 'mobile' },
  { width: 430, height: 932, label: 'grand mobile' },
  { width: 768, height: 1024, label: 'tablette portrait' },
  { width: 1024, height: 768, label: 'tablette paysage' },
  { width: 1280, height: 800, label: 'desktop compact' },
  { width: 1440, height: 900, label: 'desktop standard' },
  { width: 1672, height: 941, label: 'référence' },
] as const;

async function expectAccessible(page: Page): Promise<void> {
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(report.violations).toEqual([]);
}

async function expectNoOverflow(page: Page): Promise<void> {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
}

async function expectControlBoundaries(page: Page): Promise<void> {
  const ratios = await page
    .locator('.cnpm-integrations__filters select, .cnpm-integrations__filters input')
    .evaluateAll((controls) => {
      const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : Math.pow((normalized + 0.055) / 1.055, 2.4);
      };
      const luminance = (value: string) => {
        const channels = value
          .match(/[\d.]+/g)
          ?.slice(0, 3)
          .map(Number) ?? [0, 0, 0];
        return (
          0.2126 * channel(channels[0]) +
          0.7152 * channel(channels[1]) +
          0.0722 * channel(channels[2])
        );
      };
      return controls.map((control) => {
        const style = getComputedStyle(control);
        const lighter = Math.max(luminance(style.borderTopColor), luminance(style.backgroundColor));
        const darker = Math.min(luminance(style.borderTopColor), luminance(style.backgroundColor));
        return (lighter + 0.05) / (darker + 0.05);
      });
    });
  expect(ratios.length).toBeGreaterThan(0);
  expect(ratios.every((ratio) => ratio >= 3)).toBe(true);
}

test('BO-038 — supervision fictive, consultative et sans appel externe', async ({ page }) => {
  const externalCalls: string[] = [];
  page.on('request', (request) => {
    if (
      ['fetch', 'xhr'].includes(request.resourceType()) &&
      /integration-partners|webhook-subscriptions/i.test(request.url())
    ) {
      externalCalls.push(request.url());
    }
  });

  await page.goto('/admin/integrations');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Supervision des intégrations' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Intégrations', exact: true })).toBeVisible();
  await expect(page.getByText('Environnement fictif en lecture seule')).toBeVisible();
  await expect(page.locator('.cnpm-integrations__partner')).toHaveCount(4);
  const healthBadges = page.locator('.cnpm-integrations__partner cnpm-badge');
  await expect(healthBadges.filter({ hasText: 'Opérationnel' })).toBeVisible();
  await expect(healthBadges.filter({ hasText: 'Dégradé' })).toBeVisible();
  await expect(healthBadges.filter({ hasText: 'Suspendu' })).toBeVisible();
  await expect(healthBadges.filter({ hasText: 'Indisponible' })).toBeVisible();
  await expect(page.getByText('identifiant CNPM préservé').first()).toBeVisible();
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(2);
  for (const tab of await tabs.all()) {
    await expect(tab).toHaveAttribute('aria-controls', 'integrations-view-panel');
  }
  await expect(page.locator('#integrations-view-panel')).toHaveAttribute('role', 'tabpanel');
  await expect(page.locator('.cnpm-integrations__sr[role="status"]')).toContainText(
    '4 partenaires affichés sur 4',
  );

  await expect(
    page.getByRole('button', {
      name: /Créer un webhook|Rejouer un échange|Faire tourner une clé|Activer une intégration/,
    }),
  ).toHaveCount(0);
  expect(externalCalls).toEqual([]);
  await expectControlBoundaries(page);
  await expectNoOverflow(page);
  await expectAccessible(page);
});

test('BO-038 — navigation clavier et filtres conservés dans l’URL', async ({ page }) => {
  await page.goto('/admin/integrations');
  const partnersTab = page.getByRole('tab', { name: 'Partenaires et flux' });
  await partnersTab.focus();
  await partnersTab.press('ArrowRight');
  await expect(page).toHaveURL(/vue=journal/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Journal technique fictif' }),
  ).toBeVisible();

  await page.locator('#integration-direction').selectOption('OUTBOUND');
  await expect(page).toHaveURL(/sens=OUTBOUND/);
  await page.locator('#integration-search').fill('Gamma');
  await page.getByRole('button', { name: 'Filtrer' }).click();
  await expect(page).toHaveURL(/q=Gamma/);
  await expect(page.getByText('Messagerie Démo Gamma').first()).toBeVisible();
  await expect(page.getByText('Bloqué', { exact: true }).first()).toBeVisible();
  await expect(page.locator('.cnpm-integrations__sr[role="status"]')).toContainText(
    '1 événement détaillé affiché sur 261 événements agrégés sur 24 heures',
  );
  await expectAccessible(page);
});

test('BO-038 — annonce et affiche l’absence de résultat filtré', async ({ page }) => {
  await page.goto('/admin/integrations?q=aucune-correspondance-fictive');
  await expect(page.getByText('Aucun partenaire ne correspond')).toBeVisible();
  await expect(page.locator('.cnpm-integrations__sr[role="status"]')).toContainText(
    '0 partenaires affichés sur 4',
  );
  await expectAccessible(page);
});

for (const viewport of REQUIRED_VIEWPORTS) {
  test(`BO-038 — reflow ${viewport.label} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/admin/integrations');
    await expect(page.locator('.cnpm-integrations__partner')).toHaveCount(4);
    await expectNoOverflow(page);

    await page.goto('/admin/integrations?vue=journal');
    await expect(page.locator('.cnpm-integrations__mobile-log article')).toHaveCount(5);
    if (viewport.width < 768) {
      await expect(page.locator('.cnpm-integrations__mobile-log article').first()).toBeVisible();
    } else {
      await expect(page.locator('.cnpm-integrations__desktop-table')).toBeVisible();
    }
    await expect(
      page.getByText('5 événements détaillés sur 261 événements agrégés sur 24 h'),
    ).toBeVisible();
    await expectNoOverflow(page);
    await expectAccessible(page);
  });
}

test('BO-038 — reflow au zoom 200 %', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/admin/integrations');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.locator('.cnpm-integrations__partner')).toHaveCount(4);
  await expectNoOverflow(page);

  await page.getByRole('tab', { name: 'Journal technique' }).click();
  await expect(page.locator('.cnpm-integrations__mobile-log article')).toHaveCount(5);
  await expectNoOverflow(page);
  await expectAccessible(page);
  if (CAPTURE_DIR) {
    const target = path.resolve(CAPTURE_DIR);
    await mkdir(target, { recursive: true });
    await page.screenshot({
      path: path.join(target, 'BO-038-zoom-200-640x900.png'),
      fullPage: true,
    });
  }
});

test('BO-038 — produit les captures de revue si demandées', async ({ page }) => {
  test.skip(!CAPTURE_DIR, 'CNPM_INTEGRATIONS_CAPTURE_DIR non défini');
  const target = path.resolve(CAPTURE_DIR!);
  await mkdir(target, { recursive: true });

  for (const capture of [
    { width: 1672, height: 941, route: '/admin/integrations', name: 'BO-038-1672x941.png' },
    {
      width: 1440,
      height: 900,
      route: '/admin/integrations?vue=journal',
      name: 'BO-038-journal-1440x900.png',
    },
    { width: 360, height: 800, route: '/admin/integrations', name: 'BO-038-360x800.png' },
    { width: 390, height: 844, route: '/admin/integrations', name: 'BO-038-390x844.png' },
    {
      width: 430,
      height: 932,
      route: '/admin/integrations?vue=journal',
      name: 'BO-038-journal-430x932.png',
    },
    {
      width: 768,
      height: 1024,
      route: '/admin/integrations?vue=journal',
      name: 'BO-038-journal-768x1024.png',
    },
    { width: 1024, height: 768, route: '/admin/integrations', name: 'BO-038-1024x768.png' },
    {
      width: 1280,
      height: 800,
      route: '/admin/integrations?vue=journal',
      name: 'BO-038-journal-1280x800.png',
    },
  ]) {
    await page.setViewportSize({ width: capture.width, height: capture.height });
    await page.goto(capture.route);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Supervision des intégrations' }),
    ).toBeVisible();
    if (capture.route.includes('vue=journal')) {
      await expect(page.locator('.cnpm-integrations__mobile-log article')).toHaveCount(5);
    } else {
      await expect(page.locator('.cnpm-integrations__partner')).toHaveCount(4);
    }
    await page.screenshot({ path: path.join(target, capture.name), fullPage: true });
  }
});
