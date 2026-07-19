import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type { MemberProfileGateway, MemberProfileSnapshot } from './member-profile-gateway';

const DEMO_PROFILE: MemberProfileSnapshot = {
  displayLabel: 'Responsable adhésion',
  roleLabel: 'Administrateur de l’entreprise',
  organizationName: 'Sahel Agro SA',
  memberReference: 'CNPM-2026-0001',
  organizationTypeLabel: 'Société anonyme',
  membershipLabel: 'Adhésion active',
  membershipSince: '2024-03-18',
  disclosure: 'Profil consultable en lecture seule.',
};

@Injectable()
export class DemoMemberProfileGateway implements MemberProfileGateway {
  load(): Observable<MemberProfileSnapshot> {
    return of(DEMO_PROFILE).pipe(delay(0));
  }
}
