import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

/**
 * Détection d'une nouvelle version DÉPLOYÉE de l'application, sans dépendance serveur.
 *
 * À chaque build, l'`index.html` référence des bundles au nom haché (`main-XXXX.js`), qui
 * changent donc à chaque déploiement. On mémorise une empreinte de ces références au
 * démarrage, puis on sonde périodiquement : si l'empreinte servie diffère, un nouveau
 * déploiement est en ligne — on lève `updateAvailable`, ce qui montre le popup à TOUS les
 * utilisateurs encore sur l'ancienne version.
 *
 * Le rechargement recharge la MÊME URL : le jeton d'authentification (stockage) survit, donc
 * AUCUNE déconnexion, et les filtres/onglets portés par l'URL sont conservés.
 */
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
  private readonly document = inject(DOCUMENT);

  /** Vrai dès qu'un nouveau déploiement est détecté. */
  readonly updateAvailable = signal(false);

  private baseline: string | null = null;
  private timer: number | null = null;

  /** Intervalle de sondage. Trois minutes : réactif sans marteler le serveur. */
  private static readonly POLL_MS = 3 * 60 * 1000;

  /** Démarre la surveillance. Sans effet si l'environnement ne fournit pas `fetch`. */
  start(): void {
    const view = this.document.defaultView;
    if (!view || typeof view.fetch !== 'function' || this.timer) {
      return;
    }
    void this.marker().then((initial) => {
      this.baseline = initial;
      this.timer = view.setInterval(() => void this.check(), VersionCheckService.POLL_MS);
    });
  }

  /** Recharge la page pour charger la nouvelle version (sans déconnecter). */
  reload(): void {
    this.document.defaultView?.location.reload();
  }

  /** Réarme la surveillance après un « Plus tard » : le popup reviendra si la version diffère. */
  snooze(minutes: number): void {
    this.updateAvailable.set(false);
    const view = this.document.defaultView;
    view?.setTimeout(() => void this.check(), Math.max(1, minutes) * 60 * 1000);
  }

  private async check(): Promise<void> {
    const current = await this.marker();
    if (current && this.baseline && current !== this.baseline) {
      this.updateAvailable.set(true);
      if (this.timer) {
        this.document.defaultView?.clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  /** Empreinte des références de bundles hachés de l'`index.html` courant. */
  private async marker(): Promise<string | null> {
    const view = this.document.defaultView;
    if (!view || typeof view.fetch !== 'function') {
      return null;
    }
    try {
      const response = await view.fetch('index.html', { cache: 'no-store' });
      if (!response.ok) {
        return null;
      }
      const html = await response.text();
      const refs = [...html.matchAll(/(?:src|href)="([^"]*\.(?:js|css))"/g)]
        .map((match) => match[1])
        .sort()
        .join('|');
      return refs || String(html.length);
    } catch {
      return null;
    }
  }
}
