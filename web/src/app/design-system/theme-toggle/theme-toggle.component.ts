import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';
import { ThemeService } from '../../core/theme/theme.service';

/**
 * Bascule de thème clair/sombre — bouton d'icône (lune en clair, soleil en sombre). L'état
 * courant est porté par `aria-pressed` et un libellé explicite, jamais par la seule icône.
 * S'appuie sur les alias de chrome pour s'intégrer à la barre supérieure des deux espaces.
 */
@Component({
  selector: 'cnpm-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideSun, LucideMoon],
  template: `
    <button
      type="button"
      class="cnpm-theme-toggle"
      (click)="theme.toggle()"
      [attr.aria-pressed]="theme.theme() === 'dark'"
      [attr.aria-label]="theme.theme() === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'"
      [attr.title]="theme.theme() === 'dark' ? 'Thème clair' : 'Thème sombre'"
    >
      @if (theme.theme() === 'dark') {
        <svg lucideSun aria-hidden="true"></svg>
      } @else {
        <svg lucideMoon aria-hidden="true"></svg>
      }
    </button>
  `,
  styleUrl: './theme-toggle.component.scss',
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
