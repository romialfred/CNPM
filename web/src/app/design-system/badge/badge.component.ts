import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CnpmBadgeTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

/**
 * Étiquette d'état du design system.
 *
 * Le ton est toujours doublé d'un libellé textuel : un statut ne doit jamais être
 * porté par la seule couleur. Composant de présentation pur — il ne connaît aucune
 * règle métier et ne décide pas de l'état qu'il affiche.
 */
@Component({
  selector: 'cnpm-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="cnpm-badge" [class]="'cnpm-badge--' + tone()">
      <span class="cnpm-badge__dot" aria-hidden="true"></span>
      <ng-content />
    </span>
  `,
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  readonly tone = input<CnpmBadgeTone>('neutral');

  protected readonly toneClass = computed(() => `cnpm-badge--${this.tone()}`);
}
