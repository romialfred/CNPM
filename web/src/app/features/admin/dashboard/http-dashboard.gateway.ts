import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  DashboardAccessError,
  type DashboardGateway,
  type DashboardSnapshot,
} from './dashboard-gateway';

/**
 * Adaptateur HTTP du tableau de bord (BO-001) : lit {@code GET /dashboards/{exercise}} et
 * projette la réponse vers {@link DashboardSnapshot}.
 *
 * <p>Le backend renvoie déjà des mesures établies (`null` quand indisponible, listes vides
 * pour les sections sans source livrée) : l'adaptateur ne recalcule rien, il transmet.
 * Un refus d'habilitation (403) devient {@link DashboardAccessError} — l'écran le distingue
 * d'une panne et ne propose pas de réessayer un droit refusé.
 */
@Injectable()
export class HttpDashboardGateway implements DashboardGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  /**
   * Exercices proposés au sélecteur. Le port expose cette liste de façon synchrone ; en
   * l'absence d'un endpoint dédié au contrat R0, on offre l'exercice courant et le
   * précédent, calculés côté client. Le contenu réel de chaque exercice vient de `load`.
   */
  readonly exercises: readonly string[] = (() => {
    const year = new Date().getFullYear();
    return [String(year), String(year - 1)];
  })();

  load(exercise: string): Observable<DashboardSnapshot> {
    return this.http
      .get<DashboardSnapshot>(buildCnpmApiUrl(this.baseUrl, `dashboards/${encodeURIComponent(exercise)}`))
      .pipe(
        map((response) => this.normalize(response)),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof CnpmApiError && error.category === 'authorization'
              ? new DashboardAccessError()
              : error,
          ),
        ),
      );
  }

  /**
   * Défensif : garantit des listes (jamais `undefined`) et un objet contributions complet,
   * pour que l'écran n'ait pas à distinguer « champ absent » de « mesure indisponible ».
   */
  private normalize(response: DashboardSnapshot): DashboardSnapshot {
    return {
      exercise: response.exercise,
      generatedAt: response.generatedAt,
      kpis: response.kpis ?? [],
      months: response.months ?? [],
      trend: response.trend ?? null,
      segments: response.segments ?? [],
      memberBase: response.memberBase ?? null,
      contributions: response.contributions ?? {
        expected: null,
        collected: null,
        outstanding: null,
        recoveryRate: null,
      },
      payments: response.payments ?? [],
      alerts: response.alerts ?? [],
      activities: response.activities ?? [],
    };
  }
}
