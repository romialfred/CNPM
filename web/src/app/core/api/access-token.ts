import { InjectionToken } from '@angular/core';

/**
 * Fournisseur du jeton d'accès courant.
 *
 * Une fonction plutôt qu'une valeur : le jeton change dans le temps (émission,
 * rafraîchissement, expiration), et l'intercepteur doit lire le jeton VALIDE au moment
 * de la requête, pas celui capturé au démarrage.
 *
 * Renvoie `null` quand aucune session n'est ouverte — c'est le cas en mode démo et tant
 * que le client OIDC/PKCE Keycloak n'est pas livré. L'intercepteur n'ajoute alors aucun
 * en-tête, si bien que rien ne régresse : la démo continue sans jeton, et le mode HTTP
 * n'expédie pas d'`Authorization` vide.
 */
export type AccessTokenProvider = () => string | null;

export const CNPM_ACCESS_TOKEN = new InjectionToken<AccessTokenProvider>('CNPM_ACCESS_TOKEN', {
  providedIn: 'root',
  // Défaut : aucune session. Le client d'identité remplacera ce fournisseur une fois
  // livré, sans qu'aucun consommateur HTTP n'ait à changer.
  factory: () => () => null,
});
