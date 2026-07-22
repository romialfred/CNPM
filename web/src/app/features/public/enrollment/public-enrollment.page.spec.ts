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

  it('rend un parcours local sans champ de fichier ni consentement non validé', async () => {
    const { harness, router } = await setup();
    const host = harness.routeNativeElement!;

    expect(router.url).toBe('/adhesion?etape=entreprise');
    expect(host.querySelector('h1')).toBe(document.activeElement);
    expect(host.textContent).toContain('ni transmises ni enregistrées');
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

  it('conserve chaque étape dans l’URL puis crée seulement un récapitulatif en mémoire', async () => {
    const { harness, page, router } = await setup();
    const exposed = expose(page);

    exposed.form.patchValue({
      legalName: 'Sahel Agro SA',
      tradeName: 'Sahel Agro',
      legalForm: 'Société anonyme',
      rccm: 'RCCM-2026-001',
      nif: 'NIF-2026-001',
    });
    exposed.onSubmit();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/adhesion?etape=contact');

    exposed.form.patchValue({
      contactName: 'Contact Sahel Agro',
      contactEmail: 'contact@sahel-agro.invalid',
      contactPhone: '+223 00 00 00 00',
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
    expect(router.url).toContain('/adhesion/confirmation?reference=ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).toContain('Aucun dossier officiel créé');
    expect(harness.routeNativeElement?.textContent).toContain('ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).not.toContain('contact@sahel-agro.invalid');
  });

  it('demande un arbitrage avant toute sortie avec une saisie locale', async () => {
    const { harness, page } = await setup();
    const exposed = expose(page);
    exposed.form.patchValue({ legalName: 'Sahel Agro SA modifiée' });

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

  it('présente un guide d’adhésion sans formulaire tant que le contrat public est incomplet', async () => {
    const { harness } = await setup('http');
    // La soumission en ligne n'est pas raccordée : on affiche les étapes, jamais le formulaire.
    expect(harness.routeNativeElement?.textContent).toContain('Préparer votre adhésion au CNPM');
    expect(harness.routeNativeElement?.textContent).toContain('sera bientôt disponible');
    expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
  });
});

describe('PublicEnrollmentConfirmationPage (PUB-013)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('ne fabrique aucune confirmation lors d’un accès direct', async () => {
    const { harness } = await setup('demo', '/adhesion/confirmation?reference=ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).toContain('Aucun récapitulatif disponible');
    expect(harness.routeNativeElement?.textContent).not.toContain('Dossier officielNon créé');
  });

  it('reste aussi fermée en profil HTTP', async () => {
    const { harness } = await setup('http', '/adhesion/confirmation?reference=ADH-2026-001');
    expect(harness.routeNativeElement?.textContent).toContain(
      'Confirmation d’adhésion non raccordée',
    );
    expect(harness.routeNativeElement?.textContent).not.toContain('ADH-2026-001');
  });
});
