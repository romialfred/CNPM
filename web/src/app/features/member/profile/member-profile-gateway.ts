import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat du profil membre (self-service). Un seul adaptateur HTTP réel, aucune démo.
 *
 * <p>Le profil et la photo sont ceux du compte connecté ; le serveur borne le périmètre.
 */

export interface MemberProfile {
  readonly displayName: string;
  readonly email: string;
  readonly organization: string | null;
  readonly jobTitle: string | null;
  readonly phone: string | null;
  /** Photo encodée en `data:` (prête pour un `<img>`), ou `null` si aucune photo. */
  readonly avatarDataUri: string | null;
  readonly avatarUpdatedAt: string | null;
}

export interface MemberProfileGateway {
  load(): Observable<MemberProfile>;
  updateAvatar(contentType: string, base64: string): Observable<MemberProfile>;
  deleteAvatar(): Observable<MemberProfile>;
}

export const MEMBER_PROFILE_GATEWAY = new InjectionToken<MemberProfileGateway>(
  'MEMBER_PROFILE_GATEWAY',
);

export class MemberProfileAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'MemberProfileAuthenticationError';
  }
}

export class MemberProfileValidationError extends Error {
  constructor(message = 'La photo n’a pas pu être enregistrée.') {
    super(message);
    this.name = 'MemberProfileValidationError';
  }
}
