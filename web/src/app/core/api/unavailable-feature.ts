import { type Observable, throwError } from 'rxjs';

/** Erreur explicite d'une feature dont aucun contrat HTTP exploitable n'est encore livré. */
export class UnavailableHttpFeatureError extends Error {
  constructor(readonly feature: string) {
    super(`La feature ${feature} n'est pas encore disponible en mode HTTP.`);
    this.name = 'UnavailableHttpFeatureError';
  }
}

export function unavailableFeature$<T>(feature: string): Observable<T> {
  return throwError(() => new UnavailableHttpFeatureError(feature));
}
