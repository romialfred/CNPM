import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import { unavailableFeature$ } from '../../../core/api/unavailable-feature';

export type ShowcaseReviewCheckStatus =
  'SAFE_DEMO' | 'REVIEW_REQUIRED' | 'NOT_VERIFIED' | 'NOT_APPLICABLE';

export interface ShowcaseReviewCheck {
  readonly id: 'MEDIA_RIGHTS' | 'CONTACT_CONSENT' | 'CLAIMS' | 'MEMBERSHIP' | 'REPORTS';
  readonly label: string;
  readonly status: ShowcaseReviewCheckStatus;
  readonly detail: string;
}

export interface ShowcasePreviewVersion {
  readonly versionLabel: string;
  readonly tagline: string;
  readonly summary: string;
  readonly sectorLabel: string;
  readonly locationDisclosure: 'Localisation masquée dans la démonstration';
  readonly activities: readonly string[];
  readonly mediaPresentation: 'PLACEHOLDER_ONLY';
  readonly publicContactPresentation: 'MASKED_NO_CONSENT';
}

export interface ShowcaseModerationItem {
  readonly id: string;
  readonly demonstrationReference: string;
  readonly organizationLabel: string;
  readonly submittedAt: string;
  readonly queueLabel: 'À examiner' | 'Contrôle requis';
  readonly membershipLabel: 'Adhésion active — scénario fictif';
  readonly publishedVersion: ShowcasePreviewVersion;
  readonly proposedVersion: ShowcasePreviewVersion;
  readonly changedFields: readonly string[];
  readonly checks: readonly ShowcaseReviewCheck[];
}

export interface ShowcaseModerationQueue {
  readonly items: readonly ShowcaseModerationItem[];
}

/**
 * Projection strictement consultative de BO-037.
 *
 * Le port ne porte volontairement aucune commande de décision ou de publication :
 * l'addendum vitrine et les règles de consentement/modération ne sont pas promus.
 */
export interface ShowcaseModerationGateway {
  loadQueue(): Observable<ShowcaseModerationQueue>;
}

export const SHOWCASE_MODERATION_GATEWAY = new InjectionToken<ShowcaseModerationGateway>(
  'SHOWCASE_MODERATION_GATEWAY',
);

/** Le contrat OpenAPI canonique ne contient pas encore la vitrine membre. */
export const UNAVAILABLE_SHOWCASE_MODERATION_GATEWAY: ShowcaseModerationGateway = {
  loadQueue: () => unavailableFeature$('BO-037'),
};
