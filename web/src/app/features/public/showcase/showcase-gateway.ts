import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * États de publication d'une vitrine, conformes à `docs/12-member-showcase/`.
 * Seul `PUBLISHED` est visible du public ; `SUSPENDED` retire la vitrine sans
 * supprimer les révisions.
 */
export type PublicationStatus =
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'UNPUBLISHED'
  | 'SUSPENDED';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'SUSPENDED';

export interface ShowcaseProject {
  readonly title: string;
  readonly summary: string;
  readonly category: string;
}

export interface ShowcaseContacts {
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly hours?: string;
}

/**
 * Consentement à la publication des coordonnées.
 *
 * `docs/12-member-showcase/requirements.md` l'impose : « Les contacts publics
 * nécessitent un consentement et une date de vérification ». Le porter dans le
 * contrat plutôt que dans l'affichage rend la règle explicite — une vitrine sans
 * consentement ne peut pas exposer de coordonnées, même par erreur d'intégration.
 */
export interface ContactConsent {
  readonly grantedAt: string;
  readonly verifiedAt: string;
}

export interface MemberShowcase {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly sector: string;
  readonly location: string;
  readonly employeeRange: string;
  readonly foundedYear: number;
  readonly legalForm: string;
  readonly verificationStatus: VerificationStatus;
  /** Date à laquelle le CNPM a constaté le statut ; le badge doit l'exposer. */
  readonly verifiedAt: string | null;
  readonly summary: string;
  readonly contacts: ShowcaseContacts;
  /** `null` quand le membre n'a pas consenti : les coordonnées ne sont alors pas publiées. */
  readonly contactConsent: ContactConsent | null;
  readonly activities: readonly string[];
  readonly projects: readonly ShowcaseProject[];
  readonly certifications: readonly string[];
  readonly publicationStatus: PublicationStatus;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly allowIndexing: boolean;
}

/** Une vitrine non publiée n'est pas « introuvable » : la distinction est visible. */
export type ShowcaseResult =
  | { readonly outcome: 'published'; readonly showcase: MemberShowcase }
  | { readonly outcome: 'not-public'; readonly status: PublicationStatus }
  | { readonly outcome: 'not-found' };

/**
 * Port de lecture d'une vitrine publique (PUB-006).
 *
 * L'API R4 correspondante n'est pas promue dans le contrat canonique : la checklist
 * de `docs/12-member-showcase/promotion-checklist.md` et les décisions UX-DEC-004 à
 * UX-DEC-008 restent ouvertes. Ce port permet à l'écran pilote d'exister sans
 * préempter ce contrat ; seul l'adaptateur changera.
 */
export interface ShowcaseGateway {
  findBySlug(slug: string): Observable<ShowcaseResult>;
}

export const SHOWCASE_GATEWAY = new InjectionToken<ShowcaseGateway>('SHOWCASE_GATEWAY');
