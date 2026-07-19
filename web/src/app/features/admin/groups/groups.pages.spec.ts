import { provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, type Observable, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { GroupDetailPage } from './group-detail.page';
import {
  GROUPS_GATEWAY,
  GroupAccessError,
  GroupNotFoundError,
  type GroupsGateway,
  type ProfessionalGroup,
  type ProfessionalGroupPage,
  type ProfessionalGroupQuery,
} from './groups-gateway';
import { GroupsPage } from './groups.page';

const GROUP: ProfessionalGroup = {
  id: '20000000-0000-4000-8000-000000000001',
  code: 'GRP-AGRI',
  name: 'Groupement agricole',
  sectorCode: null,
  status: 'ACTIVE',
  version: 0,
};

class GroupsStub implements GroupsGateway {
  listResult: Observable<ProfessionalGroupPage> = new Subject<ProfessionalGroupPage>();
  getResult: Observable<ProfessionalGroup> = of(GROUP);
  readonly list = vi.fn((query: ProfessionalGroupQuery) => {
    void query;
    return this.listResult;
  });
  readonly get = vi.fn((id: string) => {
    void id;
    return this.getResult;
  });
}

function activatedRoute(id: string | null = null, queryParams: Record<string, string> = {}) {
  const params = new BehaviorSubject(convertToParamMap(id ? { id } : {}));
  const query = new BehaviorSubject(convertToParamMap(queryParams));
  return {
    paramMap: params.asObservable(),
    queryParamMap: query.asObservable(),
    snapshot: { paramMap: params.value, queryParamMap: query.value },
  };
}

async function setup<T>(
  component: Type<T>,
  options: {
    readonly id?: string;
    readonly query?: Record<string, string>;
    readonly gateway?: GroupsStub;
  } = {},
) {
  const gateway = options.gateway ?? new GroupsStub();
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: activatedRoute(options.id ?? null, options.query),
      },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: GROUPS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('BO-024 — liste des groupements', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le chargement puis la table et sa version mobile', async () => {
    const gateway = new GroupsStub();
    const subject = new Subject<ProfessionalGroupPage>();
    gateway.listResult = subject;
    const { fixture, host } = await setup(GroupsPage, { gateway });

    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    subject.next({ rows: [GROUP], totalItems: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('table caption')?.textContent).toContain(
      'Groupements professionnels',
    );
    expect(host.textContent).toContain(GROUP.name);
    expect(host.textContent).toContain('1 groupement disponible');
    expect(host.querySelector('.cnpm-groups__cards')).not.toBeNull();
    expect(host.querySelector(`a[href="/admin/groups/${GROUP.id}"]`)).not.toBeNull();
  });

  it('lit page et size dans l’URL puis remet la page à un lors du changement de taille', async () => {
    const gateway = new GroupsStub();
    gateway.listResult = of({ rows: [GROUP], totalItems: 42 });
    const { host } = await setup(GroupsPage, {
      gateway,
      query: { page: '2', size: '25' },
    });
    expect(gateway.list).toHaveBeenCalledWith({ page: 2, pageSize: 25 });

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const select = host.querySelector<HTMLSelectElement>('#taille-page');
    if (!select) throw new Error('Sélecteur de taille absent');
    select.value = '50';
    select.dispatchEvent(new Event('change'));

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { size: 50, page: null } }),
    );
  });

  it.each([
    [new GroupAccessError(), 'Accès refusé'],
    [new GroupNotFoundError(), 'Référentiel introuvable'],
    [new Error('panne'), 'Les groupements n’ont pas pu être chargés'],
  ])('rend les erreurs normalisées sans masquer leur nature', async (error, expected) => {
    const gateway = new GroupsStub();
    gateway.listResult = throwError(() => error);
    const { host } = await setup(GroupsPage, { gateway });
    expect(host.textContent).toContain(expected);
  });

  it('distingue une collection réellement vide d’une page hors plage', async () => {
    const empty = new GroupsStub();
    empty.listResult = of({ rows: [], totalItems: 0 });
    expect((await setup(GroupsPage, { gateway: empty })).host.textContent).toContain(
      'Aucun groupement disponible',
    );

    TestBed.resetTestingModule();
    const outOfRange = new GroupsStub();
    outOfRange.listResult = of({ rows: [], totalItems: 12 });
    expect((await setup(GroupsPage, { gateway: outOfRange })).host.textContent).toContain(
      'Cette page ne contient aucun groupement',
    );
  });
});

describe('BO-025 — fiche groupement', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('restitue uniquement la projection contractuelle et conserve le retour de liste', async () => {
    const { gateway, host } = await setup(GroupDetailPage, {
      id: GROUP.id,
      query: { page: '2', size: '10' },
    });

    expect(gateway.get).toHaveBeenCalledWith(GROUP.id);
    expect(host.querySelector('h1')?.textContent).toContain(GROUP.name);
    expect(host.textContent).toContain('Non renseigné');
    expect(host.textContent).toContain('Incréments non disponibles');
    expect(host.textContent).toContain('responsables, mandats et zones');
    expect(host.querySelector('.cnpm-page-header__actions button')).toBeNull();
    const back = host.querySelector<HTMLAnchorElement>('a[href^="/admin/groups?"]');
    expect(back?.href).toContain('page=2');
    expect(back?.href).toContain('size=10');
  });

  it.each([
    [new GroupAccessError(), 'Accès refusé'],
    [new GroupNotFoundError(), 'Groupement introuvable'],
    [new Error('panne'), 'La fiche n’a pas pu être chargée'],
  ])('couvre les états 403, 404 et erreur récupérable', async (error, expected) => {
    const gateway = new GroupsStub();
    gateway.getResult = throwError(() => error);
    const { host } = await setup(GroupDetailPage, { id: GROUP.id, gateway });
    expect(host.textContent).toContain(expected);
  });
});
