import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de « Actualités & informations » (MP) : les événements COGEF RÉELLEMENT publiés.
 *
 * <p>Un seul adaptateur HTTP réel, aucune démo. Aucune actualité n'est fabriquée : tant qu'aucun
 * événement n'est publié, la liste est vide et la page affiche un état vide honnête.
 */

export interface MemberEvent {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly type: string;
  readonly startAt: string;
  readonly endAt: string | null;
  readonly capacity: number | null;
  readonly status: string;
}

export interface MemberEventsGateway {
  list(): Observable<readonly MemberEvent[]>;
}

export const MEMBER_EVENTS_GATEWAY = new InjectionToken<MemberEventsGateway>(
  'MEMBER_EVENTS_GATEWAY',
);
