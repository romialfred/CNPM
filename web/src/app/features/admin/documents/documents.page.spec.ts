import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { DOCUMENTS_GATEWAY, type DocumentsGateway } from './documents-gateway';
import { DocumentsPage } from './documents.page';

const DATA = {
  rows: [
    {
      id: 'demo',
      demonstrationReference: 'DOC-2026-0001',
      title: 'Document',
      kind: 'MEMBERSHIP' as const,
      businessObjectLabel: 'Membre 2026',
      classification: 'CONFIDENTIAL' as const,
      lifecycle: 'CURRENT' as const,
      versionLabel: 'v1.0 — scénario',
      authorLabel: 'Agent',
      updatedAt: '2026-07-19T00:00:00Z',
      expiresAt: null,
      retentionDisclosure: 'POLICY_NOT_CONFIGURED' as const,
      contentAvailable: false as const,
    },
  ],
  totalItems: 1,
  overview: { total: 1, expiring: 0, expired: 0, restricted: 0 },
};

async function setup(gateway: DocumentsGateway = { search: () => of(DATA) }) {
  await TestBed.configureTestingModule({
    imports: [DocumentsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: DOCUMENTS_GATEWAY, useValue: gateway },
      { provide: CNPM_DATA_MODE, useValue: 'demo' },
      { provide: SESSION_GATEWAY, useValue: { identity: of(null) } },
    ],
  }).compileComponents();
  const fixture: ComponentFixture<DocumentsPage> = TestBed.createComponent(DocumentsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('DocumentsPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend les métadonnées sans affordance de fichier', async () => {
    const fixture = await setup();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('DOC-2026-0001');
    expect(text).toContain('contenu indisponible');
    expect(
      fixture.nativeElement.querySelectorAll(
        '.documents-page a[download], .documents-page input[type=file], .documents-page img, .documents-page canvas',
      ),
    ).toHaveLength(0);
  });

  it('conserve les filtres dans l’URL', async () => {
    const fixture = await setup();
    const search = fixture.nativeElement.querySelector('#document-search') as HTMLInputElement;
    search.value = '2026';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.documents-page form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toContain('q=2026');
  });

  it('distingue le profil HTTP indisponible', async () => {
    const fixture = await setup({
      search: () => throwError(() => new UnavailableHttpFeatureError('BO-023')),
    });
    expect(fixture.nativeElement.textContent).toContain('Bibliothèque indisponible en mode HTTP');
  });
});
