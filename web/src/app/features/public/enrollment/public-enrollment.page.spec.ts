import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi, type CnpmDataMode } from '../../../core/api/api.config';
import { pendingPublicEnrollmentChangesGuard } from './pending-public-enrollment-changes.guard';
import { PublicEnrollmentConfirmationPage } from './public-enrollment-confirmation.page';
import { PublicEnrollmentPage } from './public-enrollment.page';
import { PublicEnrollmentSession } from './public-enrollment-session';

@Component({ standalone: true, template: '<p>Accueil de test</p>' })
class TestHomePage {}

interface ExposedEnrollmentPage {
  readonly form: {
    patchValue(values: Record<string, string>): void;
  };
  onSubmit(): void;
  stay(): void;
  discardAndLeave(): void;
}

async function setup(mode: CnpmDataMode = 'demo', url = '/adhesion?etape=entreprise') {
  await TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideCnpmApi({ dataMode: mode }),
      provideRouter([
        {
          path: 'adhesion',
          providers: [PublicEnrollmentSession],
          children: [
            {
              path: 'confirmation',
              component: PublicEnrollmentConfirmationPage,
            },
            {
              path: '',
              pathMatch: 'full',
              component: PublicEnrollmentPage,
              canDeactivate: [pendingPublicEnrollmentChangesGuard],
            },
          ],
        },
        { path: '', pathMatch: 'full', component: TestHomePage },
      ]),
    ],
  }).compileComponents();

  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  harness.fixture.detectChanges();
  return {
    harness,
    router: TestBed.inject(Router),
    page: harness.routeDebugElement?.componentInstance as PublicEnrollmentPage,
  };
}

function expose(page: PublicEnrollmentPage): ExposedEnrollmentPage {
  return page as unknown as ExposedEnrollmentPage;
}

describe('PublicEnrollmentPage (PUB-012)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend une démonstration locale sans champ de fichier ni consentement inventé', async () => {
    const { harness, router } = await setup();
    const host = harness.routeNativeElement!;

    expect(router.url).toBe('/adhesion?etape=entreprise');
    expect(host.querySelector('h1')).toBe(document.activeElement);
    expect(host.textContent).toContain('sans créer de dossier officiel');
    expect(host.querySelector('input[type="file"]')).toBeNull();
    expect(host.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('focalise le résumé et associe les erreurs avant de quitter une étape invalide', async () => {
    const { harness, page, router } = await setup();
    expose(page).onSubmit();
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();

    const summary = harness.routeNativeElement?.querySelector('.cnpm-error-summary');
    expect(router.url).toBe('/adhesion?etape=entreprise');
    expect(summary).toBe(document.activeElement);
    expect(summary?.querySelectorAll('li')).toHaveLength(4);
    expect(
      harness.routeNativeElement
        ?.querySelector('#adhesion-legalName')
        ?.getAttribute('aria-describedby'),
    ).toContain('adhesion-legalName-erreur');
  });

  it('conserve chaque étape dans l’URL puis crée seulement une confirmation DEMO en mémoire', async () => {
    const { harness, page, router } = await setup();
    const exposed = expose(page);

    exposed.form.patchValue({
      legalName: 'Entreprise Démo Sahel',
      tradeName: 'Démo Sahel',
      legalForm: 'Forme fictive',
      rccm: 'DEMO-RCCM-001',
      nif: 'DEMO-NIF-001',
    });
    exposed.onSubmit();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/adhesion?etape=contact');

    exposed.form.patchValue({
      contactName: 'Awa Démo',
      contactEmail: 'contact@demo.invalid',
      contactPhone: 'DEMO-TELEPHONE',
    });
    exposed.onSubmit();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/adhesion?etape=pieces');

    exposed.onSubmit();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/adhesion?etape=verification');

    exposed.onSubmit();
    await harness.fixture.whenStable();
    harness.fixture.detectChanges();
    expect(router.url).toContain('/adhesion/confirmation?reference=DEMO-ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).toContain('Aucun dossier officiel créé');
    expect(harness.routeNativeElement?.textContent).toContain('DEMO-ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).not.toContain('contact@demo.invalid');
  });

  it('demande un arbitrage avant toute sortie avec une saisie locale', async () => {
    const { harness, page } = await setup();
    const exposed = expose(page);
    exposed.form.patchValue({ legalName: 'Entreprise Démo modifiée' });

    const decision = page.confirmNavigation();
    harness.fixture.detectChanges();
    await harness.fixture.whenStable();
    expect(decision).toBeInstanceOf(Promise);
    expect(harness.routeNativeElement?.querySelector('[role="alert"]')).toBe(
      document.activeElement,
    );

    exposed.stay();
    await expect(Promise.resolve(decision)).resolves.toBe(false);
  });

  it('reste fermé en profil HTTP tant que le contrat public est incomplet', async () => {
    const { harness } = await setup('http');
    expect(harness.routeNativeElement?.textContent).toContain('Demande d’adhésion non raccordée');
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
  });
});

describe('PublicEnrollmentConfirmationPage (PUB-013)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('ne fabrique aucune confirmation lors d’un accès direct', async () => {
    const { harness } = await setup('demo', '/adhesion/confirmation?reference=DEMO-ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).toContain(
      'Aucune confirmation locale disponible',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('Dossier officielNon créé');
  });

  it('reste aussi fermée en profil HTTP', async () => {
    const { harness } = await setup('http', '/adhesion/confirmation?reference=DEMO-ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).toContain(
      'Confirmation d’adhésion non raccordée',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('DEMO-ADH-2026-001');
  });
});
