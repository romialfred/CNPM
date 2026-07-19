import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface CnpmTab {
  readonly id: string;
  readonly label: string;
}

/**
 * Sélecteur segmenté accessible (patron ARIA tablist).
 *
 * La sélection est indiquée par plusieurs signaux — soulignement, graisse et
 * `aria-selected` — jamais par la seule couleur. Navigation clavier par flèches
 * gauche/droite, conforme au patron WAI-ARIA. Le panneau associé est décrit par
 * l'appelant via `aria-labelledby` pointant sur l'onglet actif.
 */
@Component({
  selector: 'cnpm-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cnpm-tabs" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          class="cnpm-tabs__tab"
          [id]="'tab-' + tab.id"
          [class.cnpm-tabs__tab--active]="tab.id === selected()"
          [attr.aria-selected]="tab.id === selected() ? 'true' : 'false'"
          [attr.aria-controls]="panelId()"
          [attr.tabindex]="tab.id === selected() ? 0 : -1"
          (click)="select(tab.id)"
          (keydown)="onKeydown($event)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './tabs.component.scss',
})
export class TabsComponent {
  readonly tabs = input.required<readonly CnpmTab[]>();
  readonly ariaLabel = input.required<string>();
  /** Panneau unique piloté par le groupe ; optionnel pour préserver les usages existants. */
  readonly panelId = input<string | null>(null);
  readonly selected = model.required<string>();

  protected select(id: string): void {
    this.selected.set(id);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const items = this.tabs();
    const currentIndex = items.findIndex((tab) => tab.id === this.selected());
    if (currentIndex < 0) {
      return;
    }
    let nextIndex: number;
    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextId = items[nextIndex].id;
    this.selected.set(nextId);
    const target = document.getElementById(`tab-${nextId}`);
    target?.focus();
  }
}
