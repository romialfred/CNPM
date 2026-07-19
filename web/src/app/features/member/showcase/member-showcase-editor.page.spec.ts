import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { DEMO_MEMBER_SHOWCASE_DRAFT } from './demo-member-showcase.gateway';
import {
  MEMBER_SHOWCASE_GATEWAY,
  type MemberShowcaseDraft,
  type MemberShowcaseGateway,
} from './member-showcase-gateway';
import { MemberShowcaseEditorPage } from './member-showcase-editor.page';

class ControllableGateway implements MemberShowcaseGateway {
  readonly loadResponse = new Subject<MemberShowcaseDraft | null>();
  readonly storeCalls: { draft: MemberShowcaseDraft; response: Subject<MemberShowcaseDraft> }[] =
    [];

  loadDraft(): Subject<MemberShowcaseDraft | null> {
    return this.loadResponse;
  }

  storeLocalDraft(draft: MemberShowcaseDraft): Subject<MemberShowcaseDraft> {
    const response = new Subject<MemberShowcaseDraft>();
    this.storeCalls.push({ draft, response });
    return response;
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MemberShowcaseEditorPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEMBER_SHOWCASE_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MemberShowcaseEditorPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

function button(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(label),
  );
}

describe('MemberShowcaseEditorPage — MP-015', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend les douze sections avec limites éditoriales et aucune capacité sensible', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.loadResponse.next(DEMO_MEMBER_SHOWCASE_DRAFT);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('.showcase-editor__sidebar nav li')).toHaveLength(12);
    expect(host.querySelectorAll('.showcase-editor__section')).toHaveLength(12);
    expect(host.querySelector<HTMLInputElement>('#showcase-name')?.maxLength).toBe(120);
    expect(host.querySelector<HTMLInputElement>('#showcase-tagline')?.maxLength).toBe(80);
    expect(host.querySelector<HTMLTextAreaElement>('#showcase-summary')?.maxLength).toBe(600);
    expect(host.querySelector('.showcase-editor h1')).toBe(document.activeElement);
    expect(
      host.querySelectorAll('input[type="file"], input[type="email"], input[type="tel"]'),
    ).toHaveLength(0);
    expect(host.textContent).not.toMatch(/SOMACOP|BICIM|RCCM|NIF|@|\+223/);
    expect(
      Array.from(host.querySelectorAll<HTMLButtonElement>('.showcase-editor button')).filter(
        (item) => /Soumettre|Publier|Modérer|Téléverser/.test(item.textContent ?? ''),
      ),
    ).toHaveLength(0);
  });

  it('autosauvegarde explicitement une modification locale et signale les champs invalides', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.loadResponse.next(DEMO_MEMBER_SHOWCASE_DRAFT);
    await fixture.whenStable();
    fixture.detectChanges();

    const tagline = host.querySelector<HTMLInputElement>('#showcase-tagline');
    if (!tagline) throw new Error('Champ tagline absent');
    tagline.value = 'Nouvelle phrase fictive locale';
    tagline.dispatchEvent(new Event('input'));
    await vi.waitFor(() => expect(gateway.storeCalls).toHaveLength(1), { timeout: 1000 });
    const stored = {
      ...gateway.storeCalls[0].draft,
      publication: {
        ...gateway.storeCalls[0].draft.publication,
        lastSavedAt: '2026-07-19T11:00:00.000Z',
      },
    };
    gateway.storeCalls[0].response.next(stored);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Brouillon local enregistré dans ce navigateur');

    const name = host.querySelector<HTMLInputElement>('#showcase-name');
    if (!name) throw new Error('Champ nom absent');
    name.value = '';
    name.dispatchEvent(new Event('input'));
    button(host, 'Vérifier le brouillon')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Brouillon incomplet');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(host.querySelector('.showcase-editor__validation')).toBe(document.activeElement);
  });

  it('distingue vide, erreur et indisponibilité HTTP', async () => {
    const empty = await setup();
    empty.gateway.loadResponse.next(null);
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun brouillon local');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.loadResponse.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('Le brouillon local n’a pas pu être chargé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.loadResponse.error(new UnavailableHttpFeatureError('MP-015'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Éditeur de vitrine indisponible en mode HTTP');
  });
});
