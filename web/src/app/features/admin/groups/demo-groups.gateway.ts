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
  demoGroup(1, 'DEMO-AGRI', 'Groupement agricole de démonstration', 'DEMO-AGRI'),
  demoGroup(2, 'DEMO-ART', 'Collectif artisanal fictif', 'DEMO-ARTISANAT'),
  demoGroup(3, 'DEMO-BTP', 'Groupement construction scénario', 'DEMO-BTP'),
  demoGroup(4, 'DEMO-COM', 'Réseau commerce de démonstration', 'DEMO-COMMERCE'),
  demoGroup(5, 'DEMO-ENE', 'Collectif énergie prototype', 'DEMO-ENERGIE'),
  demoGroup(6, 'DEMO-HOT', 'Groupement hôtellerie fictif', 'DEMO-HOTELLERIE'),
  demoGroup(7, 'DEMO-IND', 'Réseau industriel de démonstration', 'DEMO-INDUSTRIE'),
  demoGroup(8, 'DEMO-LOG', 'Collectif logistique scénario', 'DEMO-LOGISTIQUE'),
  demoGroup(9, 'DEMO-NUM', 'Groupement numérique prototype', 'DEMO-NUMERIQUE'),
  demoGroup(10, 'DEMO-SER', 'Réseau services de démonstration', 'DEMO-SERVICES'),
  demoGroup(11, 'DEMO-TEX', 'Collectif textile fictif', 'DEMO-TEXTILE'),
  demoGroup(12, 'DEMO-TRA', 'Groupement transport scénario', null),
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
