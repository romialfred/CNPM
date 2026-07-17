import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Vocabulaire aligné sur `ui-contracts/status.contract.ts` et sur FDB-001, qui
// imposent tous deux `error`. Le composant employait `critical`, en contradiction avec
// sa propre couche de contrats — une même sémantique nommée de deux façons finit par
// diverger d'un écran à l'autre.
export type CnpmBadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

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
