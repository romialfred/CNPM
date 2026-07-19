import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import { DEMO_DIRECTORY_ORGANIZATIONS } from './demo-member-directory.gateway';
import {
  MEMBER_DIRECTORY_GATEWAY,
  type MemberDirectoryGateway,
  type MemberDirectoryQuery,
  type MemberDirectorySnapshot,
} from './member-directory.gateway';
import { MemberDirectoryPage } from './member-directory.page';

const READY_SNAPSHOT: MemberDirectorySnapshot = {
  visibility: 'PRIVATE_MEMBER',
  items: DEMO_DIRECTORY_ORGANIZATIONS.slice(0, 2),
  total: 2,
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

class ControllableGateway implements MemberDirectoryGateway {
  readonly calls: { query: MemberDirectoryQuery; response: Subject<MemberDirectorySnapshot> }[] =
    [];

  list(query: MemberDirectoryQuery): Subject<MemberDirectorySnapshot> {
    const response = new Subject<MemberDirectorySnapshot>();
    this.calls.push({ query, response });
    return response;
  }

  get latest(): Subject<MemberDirectorySnapshot> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberDirectoryPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_DIRECTORY_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberDirectoryPage);
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

describe('MemberDirectoryPage — MP-018', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit tous les filtres et la vue depuis l’URL', async () => {
    const { gateway, host } = await setup({
      q: 'Sira',
      sector: 'AGRI',
      zone: 'ZONE_C',
      theme: 'LOGISTICS',
      sort: 'sector',
      view: 'compact',
    });
    expect(gateway.calls[0].query).toEqual({
      search: 'Sira',
      sector: 'AGRI',
      zone: 'ZONE_C',
      theme: 'LOGISTICS',
      sort: 'sector',
    });
    expect(host.textContent).toContain('Chargement de l’annuaire');
  });

  it('rend des fiches sans contact ni action commerciale et porte noindex', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY_SNAPSHOT);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.member-directory h1')).toBe(document.activeElement);
    expect(host.querySelectorAll('.member-directory__grid article')).toHaveLength(2);
    expect(host.textContent).toContain('Atelier Kanu 01');
    expect(host.textContent).toContain('Fiche informative');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex,nofollow');
    expect(
      host.querySelectorAll('a[href^="http"], a[href^="mailto"], a[href^="tel"]'),
    ).toHaveLength(0);
    expect(host.querySelectorAll('input[type="email"], input[type="tel"], textarea')).toHaveLength(
      0,
    );
    expect(
      Array.from(host.querySelectorAll<HTMLButtonElement>('.member-directory button')).filter(
        (item) => /Contacter|Message|Acheter|Devis|Favori|Partager/.test(item.textContent ?? ''),
      ),
    ).toHaveLength(0);
    expect(host.textContent).not.toMatch(/SOMACOP|BICIM|RCCM|NIF|@|\+223/);
  });

  it('conserve filtres et présentation dans l’URL partageable', async () => {
    const { fixture, gateway, host, navigate } = await setup();
    gateway.latest.next(READY_SNAPSHOT);
    await fixture.whenStable();
    fixture.detectChanges();

    const search = host.querySelector<HTMLInputElement>('#directory-search');
    if (!search) throw new Error('Recherche absente');
    search.value = '  Kanu  ';
    search.dispatchEvent(new Event('input'));
    const sector = host.querySelector<HTMLSelectElement>('#directory-sector');
    if (!sector) throw new Error('Secteur absent');
    sector.value = 'CRAFT';
    sector.dispatchEvent(new Event('change'));
    button(host, 'Appliquer')?.click();
    button(host, 'Compacte')?.click();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: expect.objectContaining({ q: 'Kanu', sector: 'CRAFT' }),
      queryParamsHandling: 'merge',
    });
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { view: 'compact' },
      queryParamsHandling: 'merge',
    });
  });

  it('borne q à 80 caractères et tronque sa chip active', async () => {
    const longSearch = 'x'.repeat(300);
    const { gateway, host, navigate } = await setup({ q: longSearch });

    expect(gateway.calls[0].query.search).toHaveLength(80);
    expect(host.querySelector<HTMLInputElement>('#directory-search')?.maxLength).toBe(80);
    expect(host.querySelector<HTMLInputElement>('#directory-search')?.value).toHaveLength(80);
    const chip = host.querySelector('.cnpm-filters__chip-label');
    expect(chip?.textContent).toContain('Recherche : xxxxxxxxxxxxxxxx…');
    expect(chip?.textContent).not.toContain('x'.repeat(80));
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { q: 'x'.repeat(80) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('distingue aucun résultat, vide, erreur et indisponibilité HTTP', async () => {
    const filtered = await setup({ q: 'absent' });
    filtered.gateway.latest.next({ visibility: 'PRIVATE_MEMBER', items: [], total: 0 });
    await filtered.fixture.whenStable();
    filtered.fixture.detectChanges();
    expect(filtered.host.textContent).toContain('Aucune organisation ne correspond');

    TestBed.resetTestingModule();
    const empty = await setup();
    empty.gateway.latest.next({ visibility: 'PRIVATE_MEMBER', items: [], total: 0 });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucune organisation');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('L’annuaire n’a pas pu être chargé');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-018'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Annuaire indisponible en mode HTTP');
  });
});
