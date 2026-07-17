import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  LucideFileQuestionMark,
  LucideShieldX,
  LucideTriangleAlert,
  LucideWifiOff,
} from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../icon/icon';

/**
 * État d'erreur — `ErrorState` (FDB-007).
 *
 * Le catalogue liste quatre états : `recoverable`, `forbidden`, `not-found`,
 * `offline`. `session-ended` s'y ajoute pour la ligne « Session expirée » de
 * `loading-empty-error.md`, que ce pattern impose avec sa propre action
 * (« se reconnecter ») mais que la liste du catalogue omet. L'extension est assumée :
 * le pattern est normatif, la liste du catalogue est incomplète.
 *
 * Chaque état porte un pictogramme ET un titre textuel : un état d'erreur ne se
 * distingue jamais par la seule couleur. `forbidden` n'affiche aucun lien de support
 * (UX-DEC-011, BLOCKED) : seule une raison générique, sans divulguer pourquoi l'accès
 * est refusé.
 */
export type CnpmErrorStateVariant =
  | 'recoverable'
  | 'forbidden'
  | 'not-found'
  | 'offline'
  | 'session-ended';

interface ErrorPreset {
  readonly title: string;
  readonly description: string;
}

const PRESETS: Readonly<Record<CnpmErrorStateVariant, ErrorPreset>> = {
  recoverable: {
    title: 'Le chargement a échoué',
    description: 'Une erreur temporaire est survenue. Réessayez dans un instant.',
  },
  forbidden: {
    title: 'Accès refusé',
    description:
      'Vous n’avez pas les droits nécessaires pour consulter cette page. Contactez un administrateur si vous pensez qu’il s’agit d’une erreur.',
  },
  'not-found': {
    title: 'Page introuvable',
    description: 'La ressource demandée n’existe pas ou a été déplacée.',
  },
  offline: {
    title: 'Vous êtes hors connexion',
    description: 'Les données affichées peuvent ne pas être à jour. La reprise est automatique.',
  },
  'session-ended': {
    title: 'Session expirée',
    description: 'Votre session a pris fin pour des raisons de sécurité. Reconnectez-vous pour continuer.',
  },
};

@Component({
  selector: 'cnpm-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideFileQuestionMark, LucideShieldX, LucideTriangleAlert, LucideWifiOff],
  template: `
    <!-- role="alert" pour une erreur récupérable, qui survient en réaction à une
         action et doit être annoncée ; les autres états sont des pages d'entrée que
         l'utilisateur atteint délibérément, et n'ont pas à interrompre le lecteur. -->
    <div
      class="cnpm-error"
      [class]="'cnpm-error--' + variant()"
      [attr.role]="variant() === 'recoverable' ? 'alert' : null"
    >
      <span class="cnpm-error__icon" aria-hidden="true">
        @switch (variant()) {
          @case ('forbidden') {
            <svg lucideShieldX [size]="iconSize.empty"></svg>
          }
          @case ('not-found') {
            <svg lucideFileQuestionMark [size]="iconSize.empty"></svg>
          }
          @case ('offline') {
            <svg lucideWifiOff [size]="iconSize.empty"></svg>
          }
          @default {
            <svg lucideTriangleAlert [size]="iconSize.empty"></svg>
          }
        }
      </span>

      <!-- Le titre est un paragraphe par défaut : dans une table ou une carte, l'état
           d'erreur n'est pas le titre de la page. Quand il EST le contenu principal
           (page 404, session expirée), l'écran demande un vrai niveau de titre pour ne
           pas laisser la page sans titre de rang 1. -->
      @switch (titleAs()) {
        @case ('h1') {
          <h1 class="cnpm-error__title">{{ resolvedTitle() }}</h1>
        }
        @case ('h2') {
          <h2 class="cnpm-error__title">{{ resolvedTitle() }}</h2>
        }
        @default {
          <p class="cnpm-error__title">{{ resolvedTitle() }}</p>
        }
      }
      <p class="cnpm-error__description">{{ resolvedDescription() }}</p>

      <div class="cnpm-error__action">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly variant = input<CnpmErrorStateVariant>('recoverable');
  /** Remplace le titre par défaut du variant lorsque le contexte le précise. */
  readonly title = input<string>();
  readonly description = input<string>();
  /**
   * Niveau du titre. `p` par défaut — l'état vit alors dans une table ou une carte et
   * ne doit pas introduire de titre. `h1`/`h2` quand l'état est le contenu principal
   * d'une page, qui a besoin d'un titre de rang.
   */
  readonly titleAs = input<'p' | 'h1' | 'h2'>('p');

  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly resolvedTitle = computed(() => this.title() ?? PRESETS[this.variant()].title);
  protected readonly resolvedDescription = computed(
    () => this.description() ?? PRESETS[this.variant()].description,
  );
}
