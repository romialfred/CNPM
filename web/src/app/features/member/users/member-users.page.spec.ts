import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_USERS_GATEWAY,
  type MemberUserPage,
  type MemberUserQuery,
  type MemberUsersGateway,
} from './member-users-gateway';
import { MemberUsersPage } from './member-users.page';

const READY_PAGE: MemberUserPage = {
  items: [
    {
      id: 'demo-user-0004',
      reference: 'DEMO-USR-0004',
      displayLabel: 'Utilisateur fictif 04',
      email: 'delegue.04@entreprise-demo.example',
      roleLabel: 'Utilisateur délégué fictif',
      status: 'INACTIVE_DEMO',
      lastActivityOn: '2026-05-30',
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

class ControllableGateway implements MemberUsersGateway {
  readonly calls: { query: MemberUserQuery; response: Subject<MemberUserPage> }[] = [];

  list(query: MemberUserQuery): Subject<MemberUserPage> {
    const response = new Subject<MemberUserPage>();
    this.calls.push({ query, response });
    return response;
  }

  get latest(): Subject<MemberUserPage> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = {}) {
  const gateway = new ControllableGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [MemberUsersPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: MEMBER_USERS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(MemberUsersPage);
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

describe('MemberUsersPage — MP-014', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit q, status, sort, order, page et size depuis l’URL', async () => {
    const { gateway, host } = await setup({
      q: 'fictif 04',
      status: 'INACTIVE_DEMO',
      sort: 'lastActivityOn',
      order: 'desc',
      page: '2',
      size: '5',
    });
    expect(gateway.calls[0].query).toEqual({
      search: 'fictif 04',
      status: 'INACTIVE_DEMO',
      sort: 'lastActivityOn',
      direction: 'desc',
      page: 2,
      size: 5,
    });
    expect(host.textContent).toContain('Chargement des utilisateurs fictifs');
  });

  it('rend table et fiches mobiles en lecture seule sans frontière IAM', async () => {
    const { fixture, gateway, host } = await setup({ page: '2', size: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('table caption')?.textContent).toContain('sans action IAM');
    expect(host.textContent).toContain('DEMO-USR-0004');
    expect(host.textContent).toContain('delegue.04@entreprise-demo.example');
    expect(host.querySelector('.member-users__mobile-list article dl')).not.toBeNull();
    expect(host.querySelectorAll('.member-users input[type="checkbox"]')).toHaveLength(0);
    expect(
      Array.from(host.querySelectorAll<HTMLButtonElement>('.member-users button')).filter((item) =>
        /Inviter|Attribuer|Réinitialiser|Révoquer|Suspendre/.test(item.textContent ?? ''),
      ),
    ).toHaveLength(0);
    expect(host.textContent).not.toMatch(/Keycloak|secret|jeton|sessionId|ipAddress|permission/i);
  });

  it('conserve filtres et tri dans l’URL canonique', async () => {
    const { fixture, gateway, host, navigate } = await setup({ page: '2', size: '5' });
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const search = host.querySelector<HTMLInputElement>('#member-user-search');
    if (!search) throw new Error('Recherche absente');
    search.value = '  DEMO-USR  ';
    search.dispatchEvent(new Event('input'));
    const status = host.querySelector<HTMLSelectElement>('#member-user-status');
    if (!status) throw new Error('État absent');
    status.value = 'ACTIVE_DEMO';
    status.dispatchEvent(new Event('change'));
    const sort = host.querySelector<HTMLSelectElement>('#member-user-sort');
    if (!sort) throw new Error('Tri absent');
    sort.value = 'roleLabel:desc';
    sort.dispatchEvent(new Event('change'));
    button(host, 'Appliquer')?.click();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: expect.objectContaining({
        q: 'DEMO-USR',
        status: 'ACTIVE_DEMO',
        sort: 'roleLabel',
        order: 'desc',
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
    expect(filtered.host.textContent).toContain('Aucun utilisateur ne correspond');

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
    expect(empty.host.textContent).toContain('Aucun utilisateur');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(button(failed.host, 'Réessayer')).toBeDefined();

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-014'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Utilisateurs indisponibles en mode HTTP');
  });
});
