import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideInfo } from '@lucide/angular';
import { ButtonComponent } from '../../design-system/button/button.component';
import { DialogComponent } from '../../design-system/dialog/dialog.component';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';
import { VersionCheckService } from './version-check.service';

/**
 * Popup « mise à jour disponible », monté une seule fois à la racine. Il apparaît à tous les
 * utilisateurs restés sur une version antérieure dès qu'un nouveau déploiement est en ligne.
 *
 * Non refermable au clavier/clic extérieur ({@code dismissible=false}) : la mise à jour est à
 * accepter. « Actualiser maintenant » recharge sans déconnecter (le jeton survit) et revient
 * à la même page. « Plus tard » laisse quelques minutes pour enregistrer une saisie en cours,
 * puis le popup revient.
 */
@Component({
  selector: 'cnpm-update-available',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogComponent, ButtonComponent, LucideInfo],
  template: `
    <cnpm-dialog
      [open]="service.updateAvailable()"
      title="Mise à jour disponible"
      eyebrow="Plateforme COGEF"
      describedBy="cnpm-update-message"
      [dismissible]="false"
    >
      <!-- Bandeau média : logo COGEF coiffé d'un badge d'information. -->
      <div cnpm-dialog-media class="cnpm-update__hero">
        <span class="cnpm-update__logo-wrap">
          <img
            class="cnpm-update__logo"
            src="assets/brand/logo-CNPM.png"
            alt="Confédération Générale des Entreprises du Faso"
          />
          <span class="cnpm-update__badge" aria-hidden="true">
            <svg lucideInfo [size]="iconSize.compact"></svg>
          </span>
        </span>
      </div>

      <div class="cnpm-update">
        <p id="cnpm-update-message" class="cnpm-update__message">
          Une nouvelle version de la plateforme est disponible. Actualisez pour en bénéficier.
          <strong>Vous ne serez pas déconnecté</strong> et vous reviendrez sur la même page.
        </p>
        <p class="cnpm-update__hint">
          Astuce : si vous remplissez un formulaire, enregistrez votre saisie avant d’actualiser.
        </p>
      </div>
      <div cnpm-dialog-footer class="cnpm-update__actions">
        <cnpm-button variant="secondary" (click)="service.snooze(5)">Plus tard</cnpm-button>
        <cnpm-button variant="primary" (click)="service.reload()">Actualiser maintenant</cnpm-button>
      </div>
    </cnpm-dialog>
  `,
  styles: `
    .cnpm-update__logo-wrap {
      position: relative;
      display: inline-flex;
    }

    .cnpm-update__logo {
      block-size: 3.5rem;
      inline-size: auto;
    }

    /* Badge d'information posé sur le coin du logo : identifie la fenêtre comme un message
       d'information, en complément du logo de marque. */
    .cnpm-update__badge {
      position: absolute;
      inset-block-start: calc(-1 * var(--cnpm-space-1));
      inset-inline-end: calc(-1 * var(--cnpm-space-2));
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: var(--cnpm-space-6);
      block-size: var(--cnpm-space-6);
      border-radius: var(--cnpm-radius-pill);
      background-color: var(--cnpm-color-brand-blue-700);
      color: var(--cnpm-color-text-inverse);
      box-shadow: 0 0 0 2px var(--cnpm-color-surface-primary);
    }

    .cnpm-update {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--cnpm-space-3);
      text-align: center;
    }

    .cnpm-update__message {
      margin: 0;
      color: var(--cnpm-color-text-primary);
    }

    .cnpm-update__hint {
      margin: 0;
      font-size: var(--cnpm-font-size-sm);
      color: var(--cnpm-color-text-muted);
    }

    .cnpm-update__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--cnpm-space-3);
    }
  `,
})
export class UpdateAvailableComponent {
  protected readonly service = inject(VersionCheckService);
  protected readonly iconSize = CNPM_ICON_SIZE;
}
