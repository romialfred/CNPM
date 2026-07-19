import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  MemberDirectoryGateway,
  MemberDirectoryQuery,
  MemberDirectorySnapshot,
  PrivateDirectoryOrganization,
} from './member-directory.gateway';

export const DEMO_DIRECTORY_ORGANIZATIONS: readonly PrivateDirectoryOrganization[] = [
  organization(
    '001',
    'Atelier Kanu 01 — organisation fictive',
    'CRAFT_DEMO',
    'ZONE_A_DEMO',
    '10–19 personnes — scénario',
    'Atelier entièrement inventé présentant des méthodes de fabrication simulées.',
    ['SKILLS_DEMO', 'TRAINING_DEMO'],
  ),
  organization(
    '002',
    'Services Nafa 02 — organisation fictive',
    'SERVICES_DEMO',
    'ZONE_B_DEMO',
    '20–49 personnes — scénario',
    'Structure fictive utilisée pour éprouver une fiche de services sans coordonnées.',
    ['SKILLS_DEMO'],
  ),
  organization(
    '003',
    'Projet Sira 03 — organisation fictive',
    'AGRI_DEMO',
    'ZONE_C_DEMO',
    '5–9 personnes — scénario',
    'Exemple agricole simulé sans exploitation, partenaire, client ni production réelle.',
    ['LOGISTICS_DEMO', 'TRAINING_DEMO'],
  ),
  organization(
    '004',
    'Collectif Dôni 04 — organisation fictive',
    'SERVICES_DEMO',
    'ZONE_A_DEMO',
    '10–19 personnes — scénario',
    'Collectif inventé décrivant un besoin d’apprentissage strictement illustratif.',
    ['TRAINING_DEMO'],
  ),
  organization(
    '005',
    'Fabrique Jigi 05 — organisation fictive',
    'CRAFT_DEMO',
    'ZONE_B_DEMO',
    '20–49 personnes — scénario',
    'Fabrique fictive sans catalogue, vente, adresse ou moyen de mise en relation.',
    ['LOGISTICS_DEMO'],
  ),
  organization(
    '006',
    'Initiative Teriya 06 — organisation fictive',
    'AGRI_DEMO',
    'ZONE_C_DEMO',
    '50–99 personnes — scénario',
    'Initiative simulée destinée uniquement à tester les filtres de l’annuaire privé.',
    ['SKILLS_DEMO', 'LOGISTICS_DEMO'],
  ),
];

@Injectable()
export class DemoMemberDirectoryGateway implements MemberDirectoryGateway {
  list(query: MemberDirectoryQuery): Observable<MemberDirectorySnapshot> {
    const term = query.search.trim().slice(0, 80).toLocaleLowerCase('fr');
    const items = DEMO_DIRECTORY_ORGANIZATIONS.filter(
      (organization) =>
        (!term ||
          [organization.name, organization.summary].some((value) =>
            value.toLocaleLowerCase('fr').includes(term),
          )) &&
        (!query.sector || organization.sector === query.sector) &&
        (!query.zone || organization.zone === query.zone) &&
        (!query.theme || organization.themes.includes(query.theme)),
    ).sort((left, right) => {
      const leftValue = query.sort === 'name' ? left.name : left.sector;
      const rightValue = query.sort === 'name' ? right.name : right.sector;
      return leftValue.localeCompare(rightValue, 'fr');
    });

    return of({ visibility: 'PRIVATE_MEMBER_DEMO' as const, items, total: items.length }).pipe(
      delay(0),
    );
  }
}

function organization(
  suffix: string,
  name: string,
  sector: PrivateDirectoryOrganization['sector'],
  zone: PrivateDirectoryOrganization['zone'],
  sizeLabel: string,
  summary: string,
  themes: PrivateDirectoryOrganization['themes'],
): PrivateDirectoryOrganization {
  return { id: `demo-directory-${suffix}`, name, sector, zone, sizeLabel, summary, themes };
}
