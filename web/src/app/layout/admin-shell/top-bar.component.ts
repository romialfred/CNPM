import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideMenu, LucideSearch } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';
import { SESSION_GATEWAY } from './session-gateway';

/**
 * Barre supérieure d'administration — `TopBar` (NAV-002).
 *
 * La cloche de notifications et le menu « Nouvelle action » de la maquette ne sont
 * pas rendus : ni l'un ni l'autre n'a de source, et le « 8 » de l'image est un chiffre
 * de maquette que `ux-ui.md` interdit de recopier. Voir UX-DEC-014.
 */
@Component({
  selector: 'cnpm-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, FormsModule, LucideMenu, LucideSearch],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
})
export class TopBarComponent {
  private readonly session = inject(SESSION_GATEWAY);

  readonly drawerOpen = input(false);

  readonly drawerToggle = output<void>();
  /** Nommé `searchSubmit` : un output `search` masquerait l'évènement DOM natif du même nom. */
  readonly searchSubmit = output<string>();

  protected readonly identity = this.session.identity;
  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly query = signal('');

  protected submit(): void {
    this.searchSubmit.emit(this.query().trim());
  }
}
