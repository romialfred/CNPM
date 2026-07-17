import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { SortState } from '../../../design-system/data-table/data-table.model';

/**
 * Cycle de vie d'un membre.
 *
 * `ACTIVE` et `DORMANT` composent la base de membres ; `PROSPECT` en est séparé —
 * c'est le critère d'acceptation de la fiche BO-002. « Grand cotisant » n'est
 * volontairement pas une valeur de statut : c'est un marqueur orthogonal, porté par
 * `isLargeContributor`. Voir DATA-DEC-001.
 */
export type MemberStatus = 'ACTIVE' | 'DORMANT' | 'PROSPECT';

export interface MemberRow {
  readonly id: string;
  readonly code: string;
  readonly organization: string;
  readonly category: string;
  readonly group: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly contactEmail: string;
  /** Montants en XOF, entiers. Jamais un flottant : `CLAUDE.md` l'interdit. */
  readonly due: number;
  readonly paid: number;
  readonly status: MemberStatus;
  /** Date ISO `AAAA-MM-JJ`, formatée à l'affichage seulement. */
  readonly lastActivity: string;
  readonly isLargeContributor: boolean;
}

export interface MemberQuery {
  readonly search: string;
  readonly status: MemberStatus | null;
  readonly category: string | null;
  readonly group: string | null;
  readonly sort: SortState | null;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Agrégats de la base de membres.
 *
 * Dérivés du même jeu que le tableau, jamais d'une autre source : un panneau
 * annonçant un total que le tableau contredit est exactement le « total incohérent »
 * que la fiche interdit.
 */
export interface MembersOverview {
  /** `active + dormant`, par construction. Les prospects n'y entrent pas. */
  readonly membersTotal: number;
  readonly active: number;
  readonly dormant: number;
  readonly prospects: number;
  readonly largeContributors: number;
  readonly expected: number;
  readonly collected: number;
  /** Pourcentage 0–100 ; `null` si aucun montant n'est attendu, pour éviter une division par zéro. */
  readonly recoveryRate: number | null;
}

export interface MembersPage {
  readonly rows: readonly MemberRow[];
  /** Nombre de membres correspondant au filtre, toutes pages confondues. */
  readonly totalItems: number;
  readonly overview: MembersOverview;
  /** Valeurs réellement présentes dans la source ; jamais une nomenclature inventée. */
  readonly categories: readonly string[];
  readonly groups: readonly string[];
}

/**
 * Port de la liste des membres (BO-002).
 *
 * Le filtrage, le tri et la pagination appartiennent à la source, pas à l'écran :
 * trier la page courante ne trierait que la page, ce qui mentirait sur un jeu paginé.
 */
export interface MembersGateway {
  search(query: MemberQuery): Observable<MembersPage>;
}

export const MEMBERS_GATEWAY = new InjectionToken<MembersGateway>('MEMBERS_GATEWAY');

/**
 * Erreur d'autorisation levée par le port lorsque le backend refuse l'accès (403).
 *
 * L'écran distingue ce cas d'une panne temporaire : un refus de droit ne se « réessaie »
 * pas — le proposer inviterait à répéter une action condamnée. L'adaptateur HTTP réel
 * lèvera cette erreur sur un 403 ; l'écran la traduit en état « accès refusé ».
 */
export class MembersAccessError extends Error {
  constructor(message = 'Accès refusé à la liste des membres') {
    super(message);
    this.name = 'MembersAccessError';
  }
}
