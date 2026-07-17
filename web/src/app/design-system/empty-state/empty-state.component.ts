import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideInbox, LucidePackageOpen, LucideSearchX } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';

/**
 * `first-use` : la collection n'a jamais rien contenu → inviter à créer.
 * `no-results` : un filtre ne renvoie rien → inviter à élargir la recherche.
 * `no-data` : rien à afficher pour une raison légitime et non filtrable.
 *
 * Les trois appellent des gestes distincts. `feedback-states.md` l'impose :
 * « Distinguer : première utilisation, zéro donnée légitime, aucun résultat après
 * filtre. » Proposer « créer un membre » à quelqu'un dont le filtre est trop étroit
 * est une impasse ; proposer « effacer les filtres » sur une base réellement vide
 * aussi.
 */
export type CnpmEmptyStateVariant = 'first-use' | 'no-results' | 'no-data';

@Component({
  selector: 'cnpm-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideInbox, LucidePackageOpen, LucideSearchX],
  template: `
    <!-- « no-results » découle d'une action de l'utilisateur (un filtre) : il est
         annoncé via role="status". La première utilisation et l'absence de données
         sont des états d'entrée, pas des changements à annoncer. -->
    <div
      class="cnpm-empty"
      [attr.role]="variant() === 'no-results' ? 'status' : null"
      [attr.aria-live]="variant() === 'no-results' ? 'polite' : null"
    >
      <span class="cnpm-empty__icon" aria-hidden="true">
        @switch (variant()) {
          @case ('no-results') {
            <svg lucideSearchX [size]="iconSize.empty"></svg>
          }
          @case ('first-use') {
            <svg lucidePackageOpen [size]="iconSize.empty"></svg>
          }
          @default {
            <svg lucideInbox [size]="iconSize.empty"></svg>
          }
        }
      </span>

      <p class="cnpm-empty__title">{{ title() }}</p>
      @if (description()) {
        <p class="cnpm-empty__description">{{ description() }}</p>
      }

      <div class="cnpm-empty__action">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly variant = input<CnpmEmptyStateVariant>('no-data');
  readonly title = input.required<string>();
  readonly description = input<string>();

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly resolvedVariant = computed(() => this.variant());
}
