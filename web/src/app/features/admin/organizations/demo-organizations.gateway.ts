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
 * Jeu de données local du profil hors ligne. Les raisons sociales, UUID et
 * classifications ci-dessous ne désignent aucune organisation réelle.
 */
const DEMO_ORGANIZATIONS: readonly Organization[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    legalName: 'Ateliers Nimba',
    tradeName: 'Nimba Atelier',
    organizationType: 'Société anonyme',
    sectorCode: 'FABRICATION',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 4,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    legalName: 'Teriya Conseil',
    tradeName: null,
    organizationType: 'Cabinet de conseil',
    sectorCode: 'SERVICES',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 2,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    legalName: 'Delta Logistique',
    tradeName: 'Delta Log',
    organizationType: 'Société anonyme',
    sectorCode: 'LOGISTIQUE',
    status: 'DORMANT',
    riskLevel: 'NORMAL',
    version: 7,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    legalName: 'Kanu Technologies',
    tradeName: 'Kanu Lab',
    organizationType: 'Société à responsabilité limitée',
    sectorCode: 'NUMERIQUE',
    status: 'PROSPECT',
    riskLevel: 'NORMAL',
    version: 1,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    legalName: 'Sugu Distribution',
    tradeName: null,
    organizationType: 'Société à responsabilité limitée',
    sectorCode: 'DISTRIBUTION',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 3,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    legalName: 'Mandé Énergie',
    tradeName: 'Mandé Énergie Services',
    organizationType: 'Société anonyme',
    sectorCode: 'ENERGIE',
    status: 'DORMANT',
    riskLevel: 'NORMAL',
    version: 5,
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    legalName: 'Sahel Vert',
    tradeName: 'Sahel Vert Agro',
    organizationType: 'Coopérative',
    sectorCode: 'TRANSFORMATION',
    status: 'PROSPECT',
    riskLevel: 'NORMAL',
    version: 1,
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    legalName: 'Bama Emballages',
    tradeName: null,
    organizationType: 'Société anonyme',
    sectorCode: 'EMBALLAGE',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 6,
  },
  {
    id: '10000000-0000-4000-8000-000000000009',
    legalName: 'Djoliba Construction',
    tradeName: 'Djoliba BTP',
    organizationType: 'Société à responsabilité limitée',
    sectorCode: 'CONSTRUCTION',
    status: 'ACTIVE',
    riskLevel: 'NORMAL',
    version: 2,
  },
  {
    id: '10000000-0000-4000-8000-000000000010',
    legalName: 'Baobab Textile',
    tradeName: 'Baobab Tissus',
    organizationType: 'Coopérative',
    sectorCode: 'TEXTILE',
    status: 'DORMANT',
    riskLevel: 'NORMAL',
    version: 4,
  },
  {
    id: '10000000-0000-4000-8000-000000000011',
    legalName: 'Farafina Maintenance',
    tradeName: null,
    organizationType: 'Société à responsabilité limitée',
    sectorCode: 'MAINTENANCE',
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
