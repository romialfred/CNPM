import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import type { HomeGateway, PublicHighlights, PublicMetric } from './home-gateway';

interface HighlightsResponse {
  readonly metrics: readonly {
    readonly id: string;
    readonly label: string;
    readonly value: number;
    readonly unit: 'percent' | 'currency' | null;
  }[];
  readonly sourceNotice: string;
  readonly dataAsOf: string | null;
}

/**
 * Adaptateur HTTP des chiffres clés publics de l'accueil (PUB-001 ; {@code GET /public/highlights}).
 *
 * <p>Endpoint public : dénombrements agrégés, non nominatifs. L'éditorial ({@code news}) reste
 * vide — il est strictement réservé au profil de démonstration (garde {@code fictionalDemo} du
 * contrat) ; aucun contenu non marqué fictif ne doit être rendu.
 */
@Injectable()
export class HttpHomeGateway implements HomeGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  loadHighlights(): Observable<PublicHighlights> {
    return this.http
      .get<HighlightsResponse>(buildCnpmApiUrl(this.baseUrl, 'public/highlights'))
      .pipe(
        map((response) => ({
          metrics: (response.metrics ?? []).map(
            (metric): PublicMetric => ({
              id: metric.id,
              label: metric.label,
              value: metric.value,
              unit: metric.unit ?? null,
            }),
          ),
          news: [],
          sourceNotice: response.sourceNotice,
          dataAsOf: response.dataAsOf ?? null,
        })),
      );
  }
}
