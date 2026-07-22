import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'cnpm.native.accessToken';

/**
 * Session applicative NATIVE (AUTH-DEC-020) : détient le jeton d'accès émis par le backend
 * après un second facteur validé. L'intercepteur Bearer le lit pour l'attacher aux appels
 * d'API ; la déconnexion l'efface.
 *
 * <p>Le jeton est conservé dans {@code sessionStorage} et restauré au démarrage : la session
 * survit au RAFRAÎCHISSEMENT de la page et à la navigation (demande du commanditaire — la
 * connexion ne devait pas être perdue à chaque F5). {@code sessionStorage} — et non
 * {@code localStorage} — borne l'exposition : la session se termine à la fermeture de
 * l'onglet et n'est pas partagée entre onglets. Un jeton expiré restauré est rejeté par le
 * backend (401), ce qui ramène proprement à la connexion.
 */
@Injectable({ providedIn: 'root' })
export class NativeSessionStore {
  private readonly token = signal<string | null>(readStoredToken());

  set(accessToken: string): void {
    this.token.set(accessToken);
    writeStoredToken(accessToken);
  }

  clear(): void {
    this.token.set(null);
    writeStoredToken(null);
  }

  current(): string | null {
    return this.token();
  }
}

function readStoredToken(): string | null {
  try {
    return globalThis.sessionStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    // Stockage indisponible (SSR, mode privé strict) : la session reste seulement en mémoire.
    return null;
  }
}

function writeStoredToken(accessToken: string | null): void {
  try {
    if (accessToken === null) {
      globalThis.sessionStorage?.removeItem(STORAGE_KEY);
    } else {
      globalThis.sessionStorage?.setItem(STORAGE_KEY, accessToken);
    }
  } catch {
    // Écriture impossible : on n'échoue pas la connexion pour autant.
  }
}
