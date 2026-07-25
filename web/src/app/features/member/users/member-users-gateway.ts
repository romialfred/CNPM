import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de « Utilisateurs de l'organisation » (MP-014) : la liste RÉELLE des comptes membres
 * de l'organisation du cotisant connecté.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Le périmètre (organisation) est déduit du compte
 * connecté ; un membre ne voit jamais les comptes d'une autre organisation. Vue consultative :
 * aucun sujet Keycloak, permission fine ni secret n'est exposé.
 */

export type MemberUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface MemberUser {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly roleLabel: string;
  readonly status: MemberUserStatus;
  readonly lastActivityAt: string | null;
}

export interface MemberUsersGateway {
  list(): Observable<readonly MemberUser[]>;
}

export const MEMBER_USERS_GATEWAY = new InjectionToken<MemberUsersGateway>('MEMBER_USERS_GATEWAY');

export class MemberUsersAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'MemberUsersAuthenticationError';
  }
}

/** Le compte n'est rattaché à aucune adhésion (compte professionnel). */
export class MemberUsersNoMembershipError extends Error {
  constructor(message = 'Aucune adhésion n’est rattachée à ce compte.') {
    super(message);
    this.name = 'MemberUsersNoMembershipError';
  }
}
