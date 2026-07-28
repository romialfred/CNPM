import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ButtonComponent } from '../../design-system/button/button.component';
import { DialogComponent } from '../../design-system/dialog/dialog.component';
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
  imports: [DialogComponent, ButtonComponent],
  template: `
    <cnpm-dialog
      [open]="service.updateAvailable()"
      title="Mise à jour disponible"
      eyebrow="Plateforme CNPM"
      describedBy="cnpm-update-message"
      [dismissible]="false"
    >
      <div class="cnpm-update">
        <img
          class="cnpm-update__logo"
          src="assets/brand/logo-CNPM.png"
          alt="Conseil National du Patronat du Mali"
        />
        <p id="cnpm-update-message" class="cnpm-update__message">
          Une nouvelle version de la plateforme est disponible. Actualisez pour en bénéficier —
          <strong>vous ne serez pas déconnecté</strong> et vous reviendrez sur la même page.
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
    .cnpm-update {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--cnpm-space-3);
      text-align: center;
    }

    .cnpm-update__logo {
      block-size: 3rem;
      inline-size: auto;
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
}
