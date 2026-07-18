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
  /** Identifiant technique de l'adhésion, utilisé pour la sélection de ligne. */
  readonly id: string;
  /** Identifiant de l'entreprise, seul identifiant valide pour ouvrir BO-003. */
  readonly organizationId: string;
  readonly code: string;
  readonly organization: string;
  readonly category: string;
  readonly group: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly contactEmail: string | null;
  /** Montants en XOF, entiers. `null` tant que le read-model ADR-006 ne les expose pas. */
  readonly due: number | null;
  readonly paid: number | null;
  readonly status: MemberStatus;
  /** Date ISO `AAAA-MM-JJ`, formatée à l'affichage seulement. */
  readonly lastActivity: string | null;
  /** `null` tant que DATA-DEC-001 n'est pas portée par un contrat backend. */
  readonly isLargeContributor: boolean | null;
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
  /** Absent du contrat R0 ; livré par la démo et, plus tard, par le read-model ADR-006. */
  readonly overview: MembersOverview | null;
  /** Valeurs réellement présentes dans la source ; jamais une nomenclature inventée. */
  readonly categories: readonly string[] | null;
  readonly groups: readonly string[] | null;
  /** Clés que la source sait trier globalement, jamais seulement sur la page courante. */
  readonly supportedSortKeys: readonly string[];
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
