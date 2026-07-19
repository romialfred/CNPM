import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  OrganizationContact,
  OrganizationContactsGateway,
  OrganizationContactsView,
} from './organization-contacts.gateway';

const CONTACTS: readonly OrganizationContact[] = [
  {
    id: 'contact-demo-001',
    displayName: 'Contact Direction Démo',
    role: 'DIRECTION',
    functionLabel: 'Direction générale — scénario fictif',
    email: 'direction.demo@entreprise.example',
    phone: '+223 00 00 00 01',
    primary: true,
    financial: false,
    active: true,
    validFrom: '15 janvier 2023',
  },
  {
    id: 'contact-demo-002',
    displayName: 'Contact Finance Démo',
    role: 'FINANCE',
    functionLabel: 'Responsable finance — scénario fictif',
    email: 'finance.demo@entreprise.example',
    phone: '+223 00 00 00 02',
    primary: false,
    financial: true,
    active: true,
    validFrom: '3 avril 2023',
  },
  {
    id: 'contact-demo-003',
    displayName: 'Contact Administration Démo',
    role: 'ADMINISTRATION',
    functionLabel: 'Administration — scénario fictif',
    email: 'administration.demo@entreprise.example',
    phone: '+223 00 00 00 03',
    primary: false,
    financial: false,
    active: true,
    validFrom: '12 septembre 2023',
  },
  {
    id: 'contact-demo-004',
    displayName: 'Contact Technique Démo',
    role: 'TECHNIQUE',
    functionLabel: 'Référent technique — scénario fictif',
    email: 'technique.demo@entreprise.example',
    phone: '+223 00 00 00 04',
    primary: false,
    financial: false,
    active: true,
    validFrom: '8 février 2024',
  },
  {
    id: 'contact-demo-005',
    displayName: 'Ancien Contact Démo',
    role: 'ADMINISTRATION',
    functionLabel: 'Ancien référent — scénario fictif',
    email: 'ancien.demo@entreprise.example',
    phone: '+223 00 00 00 05',
    primary: false,
    financial: false,
    active: false,
    validFrom: '4 mars 2022',
  },
];

/** Données exclusivement synthétiques pour reproduire BO-007 sans donnée personnelle réelle. */
@Injectable()
export class DemoOrganizationContactsGateway implements OrganizationContactsGateway {
  load(organizationId: string): Observable<OrganizationContactsView> {
    return of({
      organizationId,
      organizationName: 'Ateliers Nimba Démonstration',
      updatedAt: 'Données fictives actualisées le 19 juillet 2026 à 16:40',
      contacts: CONTACTS,
    }).pipe(delay(90));
  }
}
