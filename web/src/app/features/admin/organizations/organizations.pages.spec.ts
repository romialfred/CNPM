import { provideZonelessChangeDetection, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { OrganizationDetailPage } from './organization-detail.page';
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

  it('BO-006 affiche uniquement le cœur contractuel de la fiche', async () => {
    const { gateway, host } = await setup(OrganizationDetailPage, ORGANIZATION.id);
    expect(gateway.get).toHaveBeenCalledWith(ORGANIZATION.id);
    expect(host.textContent).toContain('Identité descriptive');
    expect(host.textContent).toContain(ORGANIZATION.organizationType);
    expect(host.textContent).toContain('État courant');
    expect(host.textContent).not.toContain('Montant dû');
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
