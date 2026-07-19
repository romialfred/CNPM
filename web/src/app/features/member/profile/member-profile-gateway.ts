import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Projection consultative et auto-scopée de MP-013.
 *
 * Elle reste volontairement alignée sur MOB-016 : aucun contact, identifiant IAM,
 * justificatif, adresse ou attribut KYC ne traverse cette frontière membre.
 */
export interface MemberProfileSnapshot {
  readonly displayLabel: string;
  readonly roleLabel: string;
  readonly organizationName: string;
  readonly memberReference: `CNPM-DEMO-${string}`;
  readonly organizationTypeLabel: string;
  readonly membershipLabel: string;
  readonly membershipSince: string;
  readonly disclosure: string;
}

export interface MemberProfileGateway {
  load(): Observable<MemberProfileSnapshot | null>;
}

export const MEMBER_PROFILE_GATEWAY = new InjectionToken<MemberProfileGateway>(
  'MEMBER_PROFILE_GATEWAY',
);
