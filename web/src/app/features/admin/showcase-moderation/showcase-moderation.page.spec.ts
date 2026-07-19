import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  SHOWCASE_MODERATION_GATEWAY,
  type ShowcaseModerationGateway,
  type ShowcaseModerationItem,
} from './showcase-moderation-gateway';
import { ShowcaseModerationPage } from './showcase-moderation.page';

const item = (suffix: '0001' | '0002'): ShowcaseModerationItem => ({
  id: `showcase-submission-${suffix}`,
  demonstrationReference: `VITRINE-2026-${suffix}`,
  organizationLabel: suffix === '0001' ? 'Organisation Alpha' : 'Organisation Bêta',
  submittedAt: '2026-07-18T09:30:00Z',
  queueLabel: suffix === '0001' ? 'À examiner' : 'Contrôle requis',
  membershipLabel: 'Adhésion active',
  publishedVersion: {
    versionLabel: 'Version publiée',
    tagline: 'Accroche publiée',
    summary: 'Résumé publié.',
    sectorLabel: 'Secteur',
    locationDisclosure: 'Localisation masquée',
    activities: ['Activité'],
    mediaPresentation: 'PLACEHOLDER_ONLY',
    publicContactPresentation: 'MASKED_NO_CONSENT',
  },
  proposedVersion: {
    versionLabel: 'Proposition',
    tagline: `Accroche proposée ${suffix}`,
    summary: 'Résumé proposé.',
    sectorLabel: 'Secteur',
    locationDisclosure: 'Localisation masquée',
    activities: ['Activité'],
    mediaPresentation: 'PLACEHOLDER_ONLY',
    publicContactPresentation: 'MASKED_NO_CONSENT',
  },
  changedFields: ['Accroche publique'],
  checks: [
    {
      id: 'CONTACT_CONSENT',
      label: 'Consentement aux contacts publics',
      status: 'NOT_VERIFIED',
      detail: 'Contact masqué.',
    },
  ],
});

const DATA = { items: [item('0001'), item('0002')] };

async function setup(
  gateway: ShowcaseModerationGateway = { loadQueue: () => of(DATA) },
  initialUrl = '/',
) {
  await TestBed.configureTestingModule({
    imports: [ShowcaseModerationPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SHOWCASE_MODERATION_GATEWAY, useValue: gateway },
      { provide: CNPM_DATA_MODE, useValue: 'demo' },
      { provide: SESSION_GATEWAY, useValue: { identity: of(null) } },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  await router.navigateByUrl(initialUrl);
  const fixture: ComponentFixture<ShowcaseModerationPage> =
    TestBed.createComponent(ShowcaseModerationPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, router };
}

describe('ShowcaseModerationPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend la file, l’aperçu et les contrôles sans affordance de mutation', async () => {
    const { fixture } = await setup();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Organisation Alpha');
    expect(root.textContent).toContain('Aperçu public');
    expect(root.textContent).toContain('Décisions bloquées');
    expect(root.querySelectorAll('.showcase-moderation-page__actions button')).toHaveLength(7);
    expect(
      root.querySelectorAll('.showcase-moderation-page__actions button[aria-disabled="true"]'),
    ).toHaveLength(7);
    expect(
      root.querySelectorAll(
        '.showcase-moderation-page img, .showcase-moderation-page input, .showcase-moderation-page textarea, .showcase-moderation-page a[href^="mailto:"], .showcase-moderation-page a[href^="tel:"]',
      ),
    ).toHaveLength(0);
  });

  it('conserve la proposition sélectionnée dans l’URL', async () => {
    const { fixture, router } = await setup();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.showcase-moderation-page__queue-button',
    ) as NodeListOf<HTMLButtonElement>;

    buttons[1]?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toContain('submission=showcase-submission-0002');
    expect(fixture.nativeElement.textContent).toContain('Accroche proposée 0002');
  });

  it('honore une sélection valide déjà présente dans l’URL', async () => {
    const { fixture } = await setup(undefined, '/?submission=showcase-submission-0002');

    expect(fixture.nativeElement.textContent).toContain('Accroche proposée 0002');
  });

  it('rend les états chargement, vide, erreur et HTTP indisponible', async () => {
    const loading = await setup({ loadQueue: () => NEVER });
    expect(loading.fixture.nativeElement.textContent).toContain('Chargement de la file');
    TestBed.resetTestingModule();

    const empty = await setup({ loadQueue: () => of({ items: [] }) });
    expect(empty.fixture.nativeElement.textContent).toContain('Aucune proposition');
    TestBed.resetTestingModule();

    const error = await setup({ loadQueue: () => throwError(() => new Error('temporaire')) });
    expect(error.fixture.nativeElement.textContent).toContain('n’a pas pu être chargée');
    TestBed.resetTestingModule();

    const unavailable = await setup({
      loadQueue: () => throwError(() => new UnavailableHttpFeatureError('BO-037')),
    });
    expect(unavailable.fixture.nativeElement.textContent).toContain(
      'Modération indisponible en mode HTTP',
    );
  });
});
