import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Indicateur public du CNPM, avec sa date de constat. */
export interface PublicMetric {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  /** Unité d'affichage ; `null` pour un simple dénombrement. */
  readonly unit: 'percent' | 'currency' | null;
}

export interface PublicHighlights {
  readonly metrics: readonly PublicMetric[];
  /**
   * Date à laquelle les chiffres ont été constatés.
   *
   * La fiche PUB-001 impose que les chiffres clés « affichent leur date de mise à
   * jour ». `null` quand la source ne la porte pas : on l'omet alors plutôt que
   * d'afficher une fraîcheur qu'on ne peut pas garantir.
   */
  readonly dataAsOf: string | null;
}

/**
 * Port de lecture des données publiques de l'accueil (PUB-001).
 *
 * La fiche prévoit que les chiffres viennent « d'une API publique mise en cache ».
 * Cette API n'existe pas au contrat canonique : le port la préfigure sans la
 * préempter, et seul l'adaptateur changera.
 */
export interface HomeGateway {
  loadHighlights(): Observable<PublicHighlights>;
}

export const HOME_GATEWAY = new InjectionToken<HomeGateway>('HOME_GATEWAY');
