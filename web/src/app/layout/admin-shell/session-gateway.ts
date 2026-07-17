import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Identité de la session affichée par le bandeau d'administration.
 *
 * Volontairement pauvre : le bandeau n'a besoin que d'un nom à afficher et d'un rôle
 * à annoncer. Il ne porte ni permission ni jeton — les permissions se vérifient côté
 * backend, et l'UI ne fait que les refléter (`frontend-angular.md`).
 */
export interface SessionIdentity {
  readonly displayName: string;
  /** Rôle lisible, tel qu'il doit apparaître sous le nom. */
  readonly roleLabel: string;
}

export interface SessionGateway {
  /** `null` lorsque aucune session n'est établie. */
  readonly identity: Observable<SessionIdentity | null>;
}

export const SESSION_GATEWAY = new InjectionToken<SessionGateway>('SESSION_GATEWAY');
