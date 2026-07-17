import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AlertComponent } from '../alert/alert.component';

/**
 * Signale la perte de connexion réseau.
 *
 * `CLAUDE.md` impose de prévoir l'état hors ligne pour chaque vue. Sans ce signal, un
 * échec d'envoi hors connexion s'afficherait comme un refus d'identifiants : le
 * message serait faux et pousserait l'utilisateur à ressaisir un mot de passe correct.
 *
 * La région live est **pré-montée vide** et seul son contenu apparaît : insérer la
 * région et son contenu d'un même mouvement est l'anti-patron classique — l'annonce
 * n'est alors pas fiable, car la plupart des lecteurs d'écran n'observent que les
 * mutations des régions déjà présentes. C'est le même patron que la zone d'annonce de
 * l'écran de vérification.
 */
@Component({
  selector: 'cnpm-offline-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AlertComponent],
  template: `
    <div role="status" aria-live="polite">
      @if (offline()) {
        <!-- live=false : la région live est portée par le conteneur ci-dessus ;
             deux régions imbriquées provoqueraient une double annonce. -->
        <cnpm-alert tone="warning" title="Connexion indisponible" [live]="false">
          Vous semblez hors ligne. La connexion nécessite un accès au réseau :
          rétablissez-le, puis réessayez.
        </cnpm-alert>
      }
    </div>
  `,
})
export class OfflineNoticeComponent {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly offline = signal(!navigator.onLine);

  constructor() {
    const goOffline = () => this.offline.set(true);
    const goOnline = () => this.offline.set(false);
    globalThis.addEventListener('offline', goOffline);
    globalThis.addEventListener('online', goOnline);
    this.destroyRef.onDestroy(() => {
      globalThis.removeEventListener('offline', goOffline);
      globalThis.removeEventListener('online', goOnline);
    });
  }
}
