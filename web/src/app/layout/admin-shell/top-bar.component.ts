import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideBell, LucideMenu, LucidePlus, LucideSearch } from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../../design-system/icon/icon';
import { SESSION_GATEWAY } from './session-gateway';

/**
 * Barre supérieure d'administration — `TopBar` (NAV-002).
 *
 * Le compteur de notification provient du port de session et le profil de démonstration
 * est annoncé visuellement. Le CTA global reste unique et conduit au parcours livré.
 */
@Component({
  selector: 'cnpm-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, FormsModule, RouterLink, LucideBell, LucideMenu, LucidePlus, LucideSearch],
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

  protected initials(displayName: string): string {
    return displayName
      .split(/\s+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase('fr-ML'))
      .join('');
  }
}
