import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_DOCUMENTS_GATEWAY,
  type MemberDocumentPage,
  type MemberDocumentQuery,
  type MemberDocumentsGateway,
} from './member-documents-gateway';
import { MemberDocumentsPage } from './member-documents.page';

const READY_PAGE: MemberDocumentPage = {
  items: [
    {
      id: 'demo-document-0003',
      reference: 'DEMO-DOC-0003',
      title: 'Attestation annuelle — scénario 2025',
      type: 'ATTESTATION',
      typeLabel: 'Attestation fictive',
      versionLabel: 'Version de démonstration 1',
      metadataRecordedOn: '2025-12-18',
      status: 'EXPIRED',
      availabilityDisclosure:
        'Échéance fictive dépassée. Aucun renouvellement ni alerte réelle n’est déclenché.',
    },
  ],
  page: 2,
  size: 5,
  totalElements: 6,
  totalPages: 2,
};

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

class ControllableGateway implements MemberDocumentsGateway {
  readonly calls: { query: MemberDocumentQuery; response: Subject<MemberDocumentPage> }[] = [];

  list(query: MemberDocumentQuery): Subject<MemberDocumentPage> {
    const response = new Subject<MemberDocumentPage>();
    this.calls.push({ query, response });
    return response;
  }

  get latest(): Subject<MemberDocumentPage> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberDocumentsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_DOCUMENTS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberDocumentsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, navigate, host: fixture.nativeElement as HTMLElement };
}

function button(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(label),
  );
}

describe('MemberDocumentsPage — MP-012', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit q, type, status, sort, order, page et size depuis l’URL', async () => {
    const { gateway, host } = await setup({
      q: '2025',
      type: 'ATTESTATION',
      status: 'EXPIRED',
      sort: 'title',
      order: 'asc',
      page: '2',
      size: '5',
    });
    expect(gateway.calls[0].query).toEqual({
      search: '2025',
      type: 'ATTESTATION',
      status: 'EXPIRED',
      sort: 'title',
      direction: 'asc',
      page: 2,
      size: 5,
    });
    expect(host.textContent).toContain('Chargement du catalogue documentaire fictif');
  });

  it('rend table et fiches mobiles en lecture seule sans frontière GED interne', async () => {
    const { fixture, gateway, host } = await setup({ page: '2', size: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('table caption')?.textContent).toContain(
      'Métadonnées documentaires fictives',
    );
    expect(host.textContent).toContain('DEMO-DOC-0003');
    expect(host.textContent).toContain('Expiré — scénario');
    expect(host.querySelector('.member-documents__mobile-list article dl')).not.toBeNull();
    expect(
      host.querySelectorAll('.member-documents a, .member-documents input[type="file"]'),
    ).toHaveLength(0);
    expect(host.textContent).not.toMatch(/CONFIDENTIAL|RESTRICTED|object_key|sha256|antivirus/i);
  });

  it('conserve les filtres et le tri appliqués dans l’URL canonique', async () => {
    const { fixture, gateway, host, navigate } = await setup({ page: '2', size: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const search = host.querySelector<HTMLInputElement>('#member-document-search');
    if (!search) throw new Error('Recherche absente');
    search.value = '  DEMO-DOC  ';
    search.dispatchEvent(new Event('input'));
    const type = host.querySelector<HTMLSelectElement>('#member-document-type');
    if (!type) throw new Error('Type absent');
    type.value = 'ATTESTATION';
    type.dispatchEvent(new Event('change'));
    const sort = host.querySelector<HTMLSelectElement>('#member-document-sort');
    if (!sort) throw new Error('Tri absent');
    sort.value = 'reference:asc';
    sort.dispatchEvent(new Event('change'));
    button(host, 'Appliquer')?.click();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: expect.objectContaining({
        q: 'DEMO-DOC',
        type: 'ATTESTATION',
        sort: 'reference',
        order: 'asc',
        page: 1,
      }),
      queryParamsHandling: 'merge',
    });
  });

  it('distingue aucun résultat, vide, erreur et indisponibilité HTTP', async () => {
    const filtered = await setup({ q: 'absent' });
    filtered.gateway.latest.next({
      ...READY_PAGE,
      items: [],
      totalElements: 0,
      totalPages: 0,
      page: 1,
    });
    await filtered.fixture.whenStable();
    filtered.fixture.detectChanges();
    expect(filtered.host.textContent).toContain('Aucun document ne correspond');

    TestBed.resetTestingModule();
    const empty = await setup();
    empty.gateway.latest.next({
      ...READY_PAGE,
      items: [],
      totalElements: 0,
      totalPages: 0,
      page: 1,
    });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun document');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(button(failed.host, 'Réessayer')).toBeDefined();

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-012'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain(
      'Catalogue documentaire indisponible en mode HTTP',
    );
  });
});
