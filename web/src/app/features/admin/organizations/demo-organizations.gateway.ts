import { Injectable } from '@angular/core';
import { delay, map, of, throwError, type Observable } from 'rxjs';
import {
  OrganizationConflictError,
  OrganizationNotFoundError,
  type Organization,
  type OrganizationPage,
  type OrganizationQuery,
  type OrganizationsGateway,
  type OrganizationUpdate,
} from './organizations-gateway';

const DEMO_LATENCY_MS = 90;

/**
 * Jeu de démonstration entièrement synthétique. Les raisons sociales, UUID et
 * classifications ci-dessous ne désignent aucune organisation réelle.
 */
const DEMO_ORGANIZATIONS: readonly Organization[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    legalName: 'Ateliers Nimba Démonstration',
    tradeName: 'Nimba Atelier',
    organizationType: 'Société de démonstration',
    sectorCode: 'FABRICATION_DEMO',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 4,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    legalName: 'Teriya Conseil Exemple',
    tradeName: null,
    organizationType: 'Cabinet de démonstration',
    sectorCode: 'SERVICES_DEMO',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 2,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    legalName: 'Delta Logistique Fictive',
    tradeName: 'Delta Fictive',
    organizationType: 'Société de démonstration',
    sectorCode: 'LOGISTIQUE_DEMO',
    status: 'DORMANT',
    riskLevel: 'NORMAL',
    version: 7,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    legalName: 'Kanu Technologies Laboratoire',
    tradeName: 'Kanu Lab',
    organizationType: 'Entreprise fictive',
    sectorCode: 'NUMERIQUE_DEMO',
    status: 'PROSPECT',
    riskLevel: 'NORMAL',
    version: 1,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    legalName: 'Sugu Distribution Scénario',
    tradeName: null,
    organizationType: 'Entreprise fictive',
    sectorCode: 'DISTRIBUTION_DEMO',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 3,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    legalName: 'Mandé Énergie Prototype',
    tradeName: 'Mandé Prototype',
    organizationType: 'Société de démonstration',
    sectorCode: 'ENERGIE_DEMO',
    status: 'DORMANT',
    riskLevel: 'NORMAL',
    version: 5,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    legalName: 'Sahel Vert Bac à sable',
    tradeName: 'Sahel Vert Démo',
    organizationType: 'Coopérative fictive',
    sectorCode: 'TRANSFORMATION_DEMO',
    status: 'PROSPECT',
    riskLevel: 'NORMAL',
    version: 1,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    legalName: 'Bama Emballages Exemple',
    tradeName: null,
    organizationType: 'Société de démonstration',
    sectorCode: 'EMBALLAGE_DEMO',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 6,
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    legalName: 'Djoliba Construction Simulation',
    tradeName: 'Djoliba Simu',
    organizationType: 'Entreprise fictive',
    sectorCode: 'CONSTRUCTION_DEMO',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 2,
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    legalName: 'Baobab Textile Démo',
    tradeName: 'Baobab Démo',
    organizationType: 'Coopérative fictive',
    sectorCode: 'TEXTILE_DEMO',
    status: 'DORMANT',
    riskLevel: 'NORMAL',
    version: 4,
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    legalName: 'Farafina Maintenance Test',
    tradeName: null,
    organizationType: 'Cabinet de démonstration',
    sectorCode: 'MAINTENANCE_DEMO',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 2,
  },
];

@Injectable()
export class DemoOrganizationsGateway implements OrganizationsGateway {
  private records = DEMO_ORGANIZATIONS.map((organization) => ({ ...organization }));

  search(query: OrganizationQuery): Observable<OrganizationPage> {
    return of(this.records).pipe(
      map((records) => {
        const search = normalize(query.search);
        const type = normalize(query.organizationType ?? '');
        const sector = normalize(query.sectorCode ?? '');
        const filtered = records.filter((organization) => {
          const searchable = normalize(`${organization.legalName} ${organization.tradeName ?? ''}`);
          return (
            (!search || searchable.includes(search)) &&
            (!query.status || organization.status === query.status) &&
            (!type || normalize(organization.organizationType) === type) &&
            (!sector || normalize(organization.sectorCode ?? '') === sector)
          );
        });
        const sorted = [...filtered].sort((left, right) => compare(left, right, query));
        const start = (query.page - 1) * query.pageSize;
        return {
          rows: sorted.slice(start, start + query.pageSize),
          totalItems: sorted.length,
        };
      }),
      delay(DEMO_LATENCY_MS),
    );
  }

  get(id: string): Observable<Organization> {
    const organization = this.records.find((candidate) => candidate.id === id);
    return organization
      ? of({ ...organization }).pipe(delay(DEMO_LATENCY_MS))
      : throwError(() => new OrganizationNotFoundError());
  }

  update(
    id: string,
    expectedVersion: number,
    changes: OrganizationUpdate,
  ): Observable<Organization> {
    const index = this.records.findIndex((candidate) => candidate.id === id);
    if (index < 0) {
      return throwError(() => new OrganizationNotFoundError());
    }
    const current = this.records[index];
    if (current.version !== expectedVersion) {
      return throwError(() => new OrganizationConflictError());
    }
    const updated: Organization = {
      ...current,
      legalName: changes.legalName.trim(),
      tradeName: changes.tradeName.trim() || null,
      organizationType: changes.organizationType.trim(),
      sectorCode: changes.sectorCode.trim() || null,
      version: current.version + 1,
    };
    this.records[index] = updated;
    return of({ ...updated }).pipe(delay(DEMO_LATENCY_MS));
  }
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('fr');
}

function compare(left: Organization, right: Organization, query: OrganizationQuery): number {
  const sort = query.sort ?? { key: 'legalName', direction: 'asc' as const };
  const leftValue = sort.key === 'status' ? left.status : left.legalName;
  const rightValue = sort.key === 'status' ? right.status : right.legalName;
  const result = leftValue.localeCompare(rightValue, 'fr');
  return sort.direction === 'desc' ? -result : result;
}
