import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';
import type { CnpmToast } from './toast.model';
import { ToastService } from './toast.service';

/**
 * Point d'affichage des toasts — `Toast` (FDB-003), rendu une seule fois par
 * application.
 *
 * Les deux régions vivantes sont **montées en permanence**, même vides : une région
 * `aria-live` créée en même temps que son contenu n'est pas annoncée, le lecteur
 * d'écran n'ayant rien observé changer. Les erreurs vont dans la région assertive
 * (elles interrompent, car elles bloquent l'action) ; le reste dans la région polie.
 */
@Component({
  selector: 'cnpm-toast-outlet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, LucideCircleAlert, LucideCircleCheck, LucideInfo, LucideX],
  template: `
    <!-- Régions vivantes sans role explicite : les rôles status/alert imposent
         aria-atomic true, ce qui ferait ré-annoncer TOUTE la pile à chaque nouveau
         toast. aria-live seul, atomic à false, n'annonce que le toast inséré. C'est
         aussi ce qui évite qu'une région toujours présente n'apparaisse comme un
         second role=alert en collision avec les alertes de contenu. -->
    <div class="cnpm-toasts">
      <div class="cnpm-toasts__region" aria-live="polite" aria-atomic="false">
        @for (toast of toasts.politeToasts(); track toast.id) {
          <ng-container [ngTemplateOutlet]="toastTpl" [ngTemplateOutletContext]="{ $implicit: toast }" />
        }
      </div>
      <div class="cnpm-toasts__region" aria-live="assertive" aria-atomic="false">
        @for (toast of toasts.assertiveToasts(); track toast.id) {
          <ng-container [ngTemplateOutlet]="toastTpl" [ngTemplateOutletContext]="{ $implicit: toast }" />
        }
      </div>
    </div>

    <ng-template #toastTpl let-toast>
      <div class="cnpm-toast" [class]="'cnpm-toast--' + toast.tone">
        <span class="cnpm-toast__icon" aria-hidden="true">
          @switch (toast.tone) {
            @case ('success') {
              <svg lucideCircleCheck [size]="iconSize.control"></svg>
            }
            @case ('error') {
              <svg lucideCircleAlert [size]="iconSize.control"></svg>
            }
            @default {
              <svg lucideInfo [size]="iconSize.control"></svg>
            }
          }
        </span>
        <p class="cnpm-toast__message">{{ toast.message }}</p>
        @if (toast.action; as action) {
          <button type="button" class="cnpm-toast__action" (click)="runAction(toast, action)">
            {{ action.label }}
          </button>
        }
        <button
          type="button"
          class="cnpm-toast__close"
          (click)="toasts.dismiss(toast.id)"
          aria-label="Fermer la notification"
        >
          <svg lucideX [size]="iconSize.compact"></svg>
        </button>
      </div>
    </ng-template>
  `,
  styleUrl: './toast-outlet.component.scss',
})
export class ToastOutletComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly iconSize = CNPM_ICON_SIZE;

  protected runAction(toast: CnpmToast, action: NonNullable<CnpmToast['action']>): void {
    action.run();
    this.toasts.dismiss(toast.id);
  }
}
