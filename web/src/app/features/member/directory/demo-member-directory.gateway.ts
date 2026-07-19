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
    'Atelier Kanu 01',
    'CRAFT',
    'ZONE_A',
    '10–19 personnes',
    'Atelier de fabrication artisanale ouvert au partage de méthodes et de savoir-faire.',
    ['SKILLS', 'TRAINING'],
  ),
  organization(
    '002',
    'Services Nafa 02',
    'SERVICES',
    'ZONE_B',
    '20–49 personnes',
    'Structure de services aux entreprises recherchant des complémentarités de compétences.',
    ['SKILLS'],
  ),
  organization(
    '003',
    'Projet Sira 03',
    'AGRI',
    'ZONE_C',
    '5–9 personnes',
    'Exploitation agricole intéressée par la mutualisation logistique et la formation.',
    ['LOGISTICS', 'TRAINING'],
  ),
  organization(
    '004',
    'Collectif Dôni 04',
    'SERVICES',
    'ZONE_A',
    '10–19 personnes',
    'Collectif de services exprimant un besoin d’apprentissage et de montée en compétences.',
    ['TRAINING'],
  ),
  organization(
    '005',
    'Fabrique Jigi 05',
    'CRAFT',
    'ZONE_B',
    '20–49 personnes',
    'Unité de fabrication ouverte à la mutualisation des flux logistiques régionaux.',
    ['LOGISTICS'],
  ),
  organization(
    '006',
    'Initiative Teriya 06',
    'AGRI',
    'ZONE_C',
    '50–99 personnes',
    'Initiative agricole engagée sur le partage de compétences et la logistique commune.',
    ['SKILLS', 'LOGISTICS'],
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

    return of({ visibility: 'PRIVATE_MEMBER' as const, items, total: items.length }).pipe(
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
  return { id: `directory-${suffix}`, name, sector, zone, sizeLabel, summary, themes };
}
