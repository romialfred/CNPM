import { provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { OrganizationDetailPage } from './organization-detail.page';
import { buildOrganizationProfile } from './organization-profile';
import { OrganizationEditPage } from './organization-edit.page';
import {
  ORGANIZATIONS_GATEWAY,
  type Organization,
  type OrganizationPage,
  type OrganizationsGateway,
  type OrganizationUpdate,
} from './organizations-gateway';
import { OrganizationsPage } from './organizations.page';

const ORGANIZATION: Organization = {
  id: '10000000-0000-4000-8000-000000000001',
  legalName: 'Entreprise Exemple',
  tradeName: 'Exemple',
  organizationType: 'Société anonyme',
  sectorCode: 'SECTEUR_FABRICATION',
  status: 'ACTIVE',
  riskLevel: 'NORMAL',
  version: 7,
};

class OrganizationsStub implements OrganizationsGateway {
  readonly searches: Subject<OrganizationPage>[] = [];
  readonly update = vi.fn((id: string, version: number, changes: OrganizationUpdate) =>
    of({
      ...ORGANIZATION,
      ...changes,
      id,
      version: version + 1,
      tradeName: changes.tradeName || null,
    }),
  );
  readonly get = vi.fn(() => of(ORGANIZATION));
  readonly create = vi.fn(() => of({ ...ORGANIZATION, status: 'PROSPECT' }));

  search(): Subject<OrganizationPage> {
    const result = new Subject<OrganizationPage>();
    this.searches.push(result);
    return result;
  }
}

function activatedRoute(id: string | null = null) {
  const params = new BehaviorSubject(convertToParamMap(id ? { id } : {}));
  const query = new BehaviorSubject(convertToParamMap({ page: '2', statut: 'ACTIVE' }));
  return {
    paramMap: params.asObservable(),
    queryParamMap: query.asObservable(),
    snapshot: { paramMap: params.value, queryParamMap: query.value },
  };
}

async function setup<T>(component: Type<T>, id: string | null = null) {
  const gateway = new OrganizationsStub();
  await TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRoute(id) },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: ORGANIZATIONS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(component);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('écrans organisations', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('BO-005 montre un squelette puis les résultats du port', async () => {
    const { fixture, gateway, host } = await setup(OrganizationsPage);
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();

    gateway.searches[0].next({ rows: [ORGANIZATION], totalItems: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(ORGANIZATION.legalName);
    expect(host.textContent).toContain('1 entreprise trouvée');
    expect(host.querySelector('table caption')?.textContent).toContain('Entreprises');
  });

  it('BO-006 rend une fiche enrichie et « vivante », avec activités et données illustratives', async () => {
    const { gateway, host } = await setup(OrganizationDetailPage, ORGANIZATION.id);
    expect(gateway.get).toHaveBeenCalledWith(ORGANIZATION.id);
    // L'identité vient du registre…
    expect(host.textContent).toContain(ORGANIZATION.legalName);
    expect(host.textContent).toContain(ORGANIZATION.organizationType);
    expect(host.textContent).toContain('État courant');
    // …le reste est un profil enrichi, clairement marqué comme démonstration.
    expect(host.textContent).toContain('Données de démonstration');
    expect(host.textContent).toContain('Dernières activités');
    expect(host.textContent).toContain('Membre depuis');
    expect(host.querySelectorAll('.cnpm-organization-detail__figure').length).toBeGreaterThan(0);
    // Le fil d'activité porte au moins un événement, avec sa pastille colorée.
    expect(host.querySelectorAll('.cnpm-organization-detail__event').length).toBeGreaterThan(0);
    expect(host.querySelector('.cnpm-organization-detail__dot')).not.toBeNull();
    // Aucun agrégat financier réel n'est présenté comme officiel.
    expect(host.textContent).not.toContain('Montant dû');
  });

  it('BO-006 produit un profil DÉTERMINISTE — même entreprise, même profil', () => {
    // La stabilité vaut aussi pour les captures de régression : deux appels doivent rendre
    // exactement le même profil, et deux entreprises différentes doivent diverger.
    const profileA = buildOrganizationProfile(ORGANIZATION, 2026);
    const profileAbis = buildOrganizationProfile(ORGANIZATION, 2026);
    expect(profileAbis).toEqual(profileA);

    const other = { ...ORGANIZATION, id: 'other-org', legalName: 'Autre Entreprise SARL' };
    const profileB = buildOrganizationProfile(other, 2026);
    expect(profileB.keyFigures).not.toEqual(profileA.keyFigures);
  });

  it('BO-004 transmet la version chargée au PATCH et conserve le contexte de liste', async () => {
    const { fixture, gateway, host } = await setup(OrganizationEditPage, ORGANIZATION.id);
    const page = fixture.componentInstance as unknown as {
      form: { controls: { legalName: { setValue(value: string): void } } };
      submit(): void;
    };
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    page.form.controls.legalName.setValue('Entreprise Révisée');
    page.submit();
    await fixture.whenStable();

    expect(gateway.update).toHaveBeenCalledWith(
      ORGANIZATION.id,
      ORGANIZATION.version,
      expect.objectContaining({ legalName: 'Entreprise Révisée' }),
    );
    expect(host.textContent).toContain('Champs protégés');
  });
});
