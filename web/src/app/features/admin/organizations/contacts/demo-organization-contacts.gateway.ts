import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  OrganizationContact,
  OrganizationContactsGateway,
  OrganizationContactsView,
} from './organization-contacts.gateway';

const CONTACTS: readonly OrganizationContact[] = [
  {
    id: 'contact-2026-001',
    displayName: 'Contact Direction',
    role: 'DIRECTION',
    functionLabel: 'Direction générale',
    email: 'direction@entreprise.example',
    phone: '+223 00 00 00 01',
    primary: true,
    financial: false,
    active: true,
    validFrom: '15 janvier 2023',
  },
  {
    id: 'contact-2026-002',
    displayName: 'Contact Finance',
    role: 'FINANCE',
    functionLabel: 'Responsable finance',
    email: 'finance@entreprise.example',
    phone: '+223 00 00 00 02',
    primary: false,
    financial: true,
    active: true,
    validFrom: '3 avril 2023',
  },
  {
    id: 'contact-2026-003',
    displayName: 'Contact Administration',
    role: 'ADMINISTRATION',
    functionLabel: 'Administration',
    email: 'administration@entreprise.example',
    phone: '+223 00 00 00 03',
    primary: false,
    financial: false,
    active: true,
    validFrom: '12 septembre 2023',
  },
  {
    id: 'contact-2026-004',
    displayName: 'Contact Technique',
    role: 'TECHNIQUE',
    functionLabel: 'Référent technique',
    email: 'technique@entreprise.example',
    phone: '+223 00 00 00 04',
    primary: false,
    financial: false,
    active: true,
    validFrom: '8 février 2024',
  },
  {
    id: 'contact-2026-005',
    displayName: 'Ancien Contact',
    role: 'ADMINISTRATION',
    functionLabel: 'Ancien référent',
    email: 'ancien@entreprise.example',
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
      organizationName: 'Ateliers Nimba',
      updatedAt: 'Données actualisées le 19 juillet 2026 à 16:40',
      contacts: CONTACTS,
    }).pipe(delay(90));
  }
}
