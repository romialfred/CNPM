import { AsyncPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
  private readonly injector = inject(Injector);

  readonly drawerOpen = input(false);

  readonly drawerToggle = output<void>();
  /** Nommé `searchSubmit` : un output `search` masquerait l'évènement DOM natif du même nom. */
  readonly searchSubmit = output<string>();

  protected readonly identity = this.session.identity;
  protected readonly iconSize = CNPM_ICON_SIZE;
  protected readonly query = signal('');

  /**
   * Ouverture du champ de recherche.
   *
   * Le champ occupait le centre de la barre, où le client veut un titre. Il devient un
   * dépliant : le repère `role="search"` exigé par FRM-012 reste monté en permanence,
   * seul le champ apparaît à la demande. Supprimer le formulaire aurait supprimé le
   * repère, et c'est une exigence P0 du catalogue.
   */
  protected readonly searchOpen = signal(false);

  private readonly searchToggle = viewChild<ElementRef<HTMLButtonElement>>('searchToggle');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected toggleSearch(): void {
    const ouvert = !this.searchOpen();
    this.searchOpen.set(ouvert);
    // Déplier un champ sans y porter le focus obligerait à le viser à la souris.
    if (ouvert) {
      afterNextRender(() => this.searchInput()?.nativeElement.focus(), {
        injector: this.injector,
      });
    }
  }

  /**
   * Referme le champ et ramène le focus sur le déclencheur.
   *
   * Sans ce retour, `Échap` laisserait le focus sur un champ devenu `hidden` : le
   * navigateur le renverrait au document et la personne au clavier repartirait du haut
   * de la page (WCAG 2.2, critère 2.4.3).
   */
  protected closeSearch(): void {
    this.searchOpen.set(false);
    this.searchToggle()?.nativeElement.focus();
  }

  /**
   * Prénom affiché dans l'accroche.
   *
   * Le port ne fournit qu'un `displayName` ; le premier mot en est extrait plutôt que
   * d'ajouter un champ au contrat pour un besoin d'affichage.
   */
  protected firstName(displayName: string): string {
    return displayName.split(/\s+/u).filter(Boolean)[0] ?? displayName;
  }

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
