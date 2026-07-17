import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CnpmAlertTone = 'info' | 'success' | 'warning' | 'error';

/**
 * Message d'alerte du design system.
 *
 * Le ton est doublé d'un préfixe textuel et d'une icône : l'information n'est jamais
 * portée par la seule couleur. Les alertes d'erreur portent `role="alert"` pour être
 * annoncées immédiatement ; les autres tons utilisent `role="status"`.
 */
@Component({
  selector: 'cnpm-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="cnpm-alert"
      [class]="'cnpm-alert--' + tone()"
      [attr.role]="role()"
    >
      <span class="cnpm-alert__icon" aria-hidden="true">{{ glyph() }}</span>
      <div class="cnpm-alert__body">
        @if (title()) {
          <p class="cnpm-alert__title">
            <span class="cnpm-alert__prefix">{{ prefix() }}</span>
            {{ title() }}
          </p>
        }
        <div class="cnpm-alert__content"><ng-content /></div>
      </div>
    </div>
  `,
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  readonly tone = input<CnpmAlertTone>('info');
  readonly title = input<string>();

  /**
   * Laisse l'alerte porter elle-même son rôle de région live.
   *
   * À passer à `false` quand un conteneur porte déjà `role="status"` (patron de région
   * pré-montée) : deux régions live imbriquées provoquent une double annonce.
   */
  readonly live = input(true);

  protected readonly role = computed(() => {
    if (!this.live()) {
      return null;
    }
    return this.tone() === 'error' ? 'alert' : 'status';
  });

  private readonly prefixes: Record<CnpmAlertTone, string> = {
    info: 'Information :',
    success: 'Succès :',
    warning: 'Attention :',
    error: 'Erreur :',
  };

  private readonly glyphs: Record<CnpmAlertTone, string> = {
    info: 'i',
    success: '✓',
    warning: '!',
    error: '!',
  };

  protected readonly prefix = computed(() => this.prefixes[this.tone()]);
  protected readonly glyph = computed(() => this.glyphs[this.tone()]);
}
