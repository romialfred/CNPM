import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberShowcasePublicationStatus = 'DRAFT';
export type MemberShowcaseVerificationStatus = 'UNVERIFIED';

export interface MemberShowcaseProjectDraft {
  readonly title: string;
  readonly summary: string;
  readonly category: string;
}

export interface MemberShowcaseSeoDraft {
  readonly title: string;
  readonly description: string;
  readonly allowIndexing: false;
}

/**
 * Brouillon local conforme au sous-ensemble éditorial de
 * `data/member-showcase.schema.json` autorisé pour MP-015/016.
 *
 * La frontière exclut volontairement contacts, médias, documents, partenaires,
 * certifications revendiquées, badge CNPM et données d’organisation réelles.
 */
export interface MemberShowcaseDraft {
  readonly version: number;
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly sector: string;
  readonly location: string;
  readonly employeeRange: string;
  readonly foundedYear: number;
  readonly legalForm: string;
  readonly verificationStatus: MemberShowcaseVerificationStatus;
  readonly summary: string;
  readonly activities: readonly string[];
  readonly projects: readonly MemberShowcaseProjectDraft[];
  readonly certifications: readonly string[];
  readonly seo: MemberShowcaseSeoDraft;
  readonly publication: {
    readonly status: MemberShowcasePublicationStatus;
    readonly lastSavedAt: string | null;
    readonly scheduledAt: null;
  };
  readonly disclosure: string;
}

export interface MemberShowcaseGateway {
  loadDraft(feature: 'MP-015' | 'MP-016'): Observable<MemberShowcaseDraft | null>;
  /** Stockage navigateur de démonstration uniquement ; ce n’est pas une sauvegarde serveur. */
  storeLocalDraft(draft: MemberShowcaseDraft): Observable<MemberShowcaseDraft>;
}

export const MEMBER_SHOWCASE_GATEWAY = new InjectionToken<MemberShowcaseGateway>(
  'MEMBER_SHOWCASE_GATEWAY',
);
