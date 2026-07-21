import { Injectable, signal } from '@angular/core';

/**
 * Session applicative NATIVE (AUTH-DEC-020) : détient en mémoire le jeton d'accès émis par
 * le backend après un second facteur validé. L'intercepteur Bearer le lit pour l'attacher
 * aux appels d'API ; la déconnexion l'efface. Rien n'est persisté (pas de stockage local) :
 * fermer l'onglet met fin à la session, ce qui limite l'exposition du jeton.
 */
@Injectable({ providedIn: 'root' })
export class NativeSessionStore {
  private readonly token = signal<string | null>(null);

  set(accessToken: string): void {
    this.token.set(accessToken);
  }

  clear(): void {
    this.token.set(null);
  }

  current(): string | null {
    return this.token();
  }
}
