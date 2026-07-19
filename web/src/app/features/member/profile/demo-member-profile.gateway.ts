import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type { MemberProfileGateway, MemberProfileSnapshot } from './member-profile-gateway';

const DEMO_PROFILE: MemberProfileSnapshot = {
  displayLabel: 'Membre de démonstration',
  roleLabel: 'Administrateur fictif de l’entreprise',
  organizationName: 'Entreprise Démo Sahel',
  memberReference: 'CNPM-DEMO-0001',
  organizationTypeLabel: 'Entreprise fictive',
  membershipLabel: 'Adhésion active — scénario',
  membershipSince: '2024-03-18',
  disclosure:
    'Profil local, fictif et non modifiable. Il ne contient aucune coordonnée ni donnée membre réelle.',
};

@Injectable()
export class DemoMemberProfileGateway implements MemberProfileGateway {
  load(): Observable<MemberProfileSnapshot> {
    return of(DEMO_PROFILE).pipe(delay(0));
  }
}
