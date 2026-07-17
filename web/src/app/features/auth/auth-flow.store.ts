import { Injectable, signal } from '@angular/core';
import type { AuthSpace } from './auth-gateway';

/**
 * Conserve l'état transitoire entre l'étape identifiants et l'étape 2FA.
 *
 * Le défi 2FA ne transite pas par l'URL (aucun secret ni identifiant de session dans
 * l'URL, log ou analytics). Sans défi actif, la page de vérification renvoie vers la
 * saisie des identifiants.
 */
@Injectable({ providedIn: 'root' })
export class AuthFlowStore {
  private readonly challenge = signal<{ id: string; space: AuthSpace } | null>(null);

  readonly activeChallenge = this.challenge.asReadonly();

  startChallenge(id: string, space: AuthSpace): void {
    this.challenge.set({ id, space });
  }

  clear(): void {
    this.challenge.set(null);
  }
}
