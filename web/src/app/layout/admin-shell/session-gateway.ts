import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Identité de la session affichée par le bandeau d'administration.
 *
 * Le bandeau reçoit l'identité et les permissions dérivées par le backend. Il ne
 * porte jamais de jeton ; les permissions UI ne font que refléter les autorisations,
 * dont la vérification reste obligatoire côté backend (`frontend-angular.md`).
 */
export interface SessionIdentity {
  readonly displayName: string;
  /** Rôle lisible, tel qu'il doit apparaître sous le nom. */
  readonly roleLabel: string;
  /** Exercice affiché dans le shell ; `null` lorsque le contrat ne le fournit pas. */
  readonly exerciseLabel: string | null;
  /** Compteur du centre de notifications ; `null` signifie que le service est indisponible. */
  readonly notificationCount: number | null;
  /** Rend explicite un contexte fictif dans le chrome commun et les captures. */
  readonly demoMode: boolean;
  /** Permissions dérivées par le backend, sans préfixe `PERM_`. */
  readonly permissions: readonly string[];
}

export interface SessionGateway {
  /** `null` lorsque aucune session n'est établie. */
  readonly identity: Observable<SessionIdentity | null>;
}

export const SESSION_GATEWAY = new InjectionToken<SessionGateway>('SESSION_GATEWAY');
