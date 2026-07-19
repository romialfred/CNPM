import { Injectable } from '@angular/core';
import { delay, of, throwError, type Observable } from 'rxjs';
import {
  GroupNotFoundError,
  type GroupsGateway,
  type ProfessionalGroup,
  type ProfessionalGroupPage,
  type ProfessionalGroupQuery,
} from './groups-gateway';

const DEMO_LATENCY_MS = 90;

/**
 * Registre fermé et entièrement fictif. Les noms, codes, secteurs et UUID servent
 * uniquement aux tests et aux captures de démonstration.
 */
const DEMO_GROUPS: readonly ProfessionalGroup[] = [
  demoGroup(1, 'GRP-AGRI', 'Groupement agricole', 'SEC-AGRI'),
  demoGroup(2, 'GRP-ART', 'Collectif artisanal', 'SEC-ARTISANAT'),
  demoGroup(3, 'GRP-BTP', 'Groupement construction', 'SEC-BTP'),
  demoGroup(4, 'GRP-COM', 'Réseau commerce', 'SEC-COMMERCE'),
  demoGroup(5, 'GRP-ENE', 'Collectif énergie', 'SEC-ENERGIE'),
  demoGroup(6, 'GRP-HOT', 'Groupement hôtellerie', 'SEC-HOTELLERIE'),
  demoGroup(7, 'GRP-IND', 'Réseau industriel', 'SEC-INDUSTRIE'),
  demoGroup(8, 'GRP-LOG', 'Collectif logistique', 'SEC-LOGISTIQUE'),
  demoGroup(9, 'GRP-NUM', 'Groupement numérique', 'SEC-NUMERIQUE'),
  demoGroup(10, 'GRP-SER', 'Réseau services', 'SEC-SERVICES'),
  demoGroup(11, 'GRP-TEX', 'Collectif textile', 'SEC-TEXTILE'),
  demoGroup(12, 'GRP-TRA', 'Groupement transport', null),
];

@Injectable()
export class DemoGroupsGateway implements GroupsGateway {
  list(query: ProfessionalGroupQuery): Observable<ProfessionalGroupPage> {
    const start = (query.page - 1) * query.pageSize;
    return of({
      rows: DEMO_GROUPS.slice(start, start + query.pageSize),
      totalItems: DEMO_GROUPS.length,
    }).pipe(delay(DEMO_LATENCY_MS));
  }

  get(id: string): Observable<ProfessionalGroup> {
    const group = DEMO_GROUPS.find((candidate) => candidate.id === id);
    return group
      ? of({ ...group }).pipe(delay(DEMO_LATENCY_MS))
      : throwError(() => new GroupNotFoundError());
  }
}

function demoGroup(
  index: number,
  code: string,
  name: string,
  sectorCode: string | null,
): ProfessionalGroup {
  return {
    id: `20000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    code,
    name,
    sectorCode,
    status: 'ACTIVE',
    version: 0,
  };
}
