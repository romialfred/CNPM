import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { DEMO_MEMBER_SHOWCASE_DRAFT } from './demo-member-showcase.gateway';
import {
  MEMBER_SHOWCASE_GATEWAY,
  type MemberShowcaseDraft,
  type MemberShowcaseGateway,
} from './member-showcase-gateway';
import { MemberShowcasePreviewPage } from './member-showcase-preview.page';

class ActivatedRouteStub {
  private readonly subject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  readonly queryParamMap;
  readonly snapshot;

  constructor(params: Record<string, string>) {
    this.subject = new BehaviorSubject(convertToParamMap(params));
    this.queryParamMap = this.subject.asObservable();
    this.snapshot = { queryParamMap: this.subject.value };
  }
}

class ControllableGateway implements MemberShowcaseGateway {
  readonly loadResponse = new Subject<MemberShowcaseDraft | null>();

  loadDraft(): Subject<MemberShowcaseDraft | null> {
    return this.loadResponse;
  }

  storeLocalDraft(draft: MemberShowcaseDraft): Subject<MemberShowcaseDraft> {
    const response = new Subject<MemberShowcaseDraft>();
    response.next(draft);
    return response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberShowcasePreviewPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_SHOWCASE_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberShowcasePreviewPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, navigate, host: fixture.nativeElement as HTMLElement };
}

describe('MemberShowcasePreviewPage — MP-016', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend le gabarit privé dans le viewport conservé par l’URL', async () => {
    const { fixture, gateway, host } = await setup({ viewport: 'mobile' });
    gateway.loadResponse.next(DEMO_MEMBER_SHOWCASE_DRAFT);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.showcase-preview__frame--mobile')).not.toBeNull();
    expect(host.querySelector('.showcase-template-host--mobile')).not.toBeNull();
    expect(host.textContent).toContain('Atelier Kanu');
    expect(host.textContent).toContain('Badge CNPM non attribué');
    expect(host.textContent).toContain('Section masquée — consentement absent');
    expect(host.querySelector('.showcase-preview h1')).toBe(document.activeElement);
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex,nofollow');
    expect(
      host.querySelectorAll('.showcase-template img, input, textarea, input[type="file"]'),
    ).toHaveLength(0);
    expect(host.textContent).not.toMatch(/SOMACOP|BICIM|RCCM|NIF|@|\+223/);
    expect(
      Array.from(host.querySelectorAll<HTMLButtonElement>('.showcase-preview button')).filter(
        (item) => /Soumettre|Publier|Modérer|Téléverser/.test(item.textContent ?? ''),
      ),
    ).toHaveLength(0);
  });

  it('met le viewport choisi dans l’URL partageable', async () => {
    const { fixture, gateway, host, navigate } = await setup();
    gateway.loadResponse.next(DEMO_MEMBER_SHOWCASE_DRAFT);
    await fixture.whenStable();
    fixture.detectChanges();

    const mobile = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.showcase-preview__viewports button'),
    ).find((item) => item.textContent?.includes('Mobile'));
    mobile?.click();
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { viewport: 'mobile' },
      queryParamsHandling: 'merge',
    });
  });

  it('liste les erreurs bloquantes avec retour ciblé vers l’éditeur', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.loadResponse.next({ ...DEMO_MEMBER_SHOWCASE_DRAFT, name: '', slug: 'Slug invalide' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Erreurs bloquantes');
    const issueLinks = host.querySelectorAll<HTMLAnchorElement>('.showcase-preview__issues a');
    expect(issueLinks.length).toBeGreaterThanOrEqual(2);
    expect(
      Array.from(issueLinks).every((link) =>
        link.getAttribute('href')?.includes('/member/showcase/edit'),
      ),
    ).toBe(true);
  });

  it('distingue vide, erreur et indisponibilité HTTP', async () => {
    const empty = await setup();
    empty.gateway.loadResponse.next(null);
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun brouillon à prévisualiser');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.loadResponse.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('L’aperçu n’a pas pu être chargé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.loadResponse.error(new UnavailableHttpFeatureError('MP-016'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Aperçu de vitrine indisponible en mode HTTP');
  });
});
