import { AsyncPipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
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

  /**
   * Panneau de notifications — `<details>` natif, sans état parallèle.
   *
   * L'ouverture reste gérée par le navigateur ; on lit et on écrit `open` sur l'élément
   * lui-même. Dupliquer cet état dans un signal le ferait diverger du DOM dès que
   * l'utilisateur replie le panneau par un clic sur le `<summary>`.
   */
  private readonly notifications = viewChild<ElementRef<HTMLDetailsElement>>('notifications');
  private readonly notificationTrigger = viewChild<ElementRef<HTMLElement>>('notificationTrigger');

  /**
   * Échap referme le panneau.
   *
   * L'écoute est posée sur le document, pas sur l'hôte : un panneau ouvert alors que le
   * focus se trouve ailleurs dans la page ne recevrait jamais l'événement et resterait
   * ouvert.
   *
   * Le focus n'est rendu au `<summary>` QUE s'il se trouvait dans le panneau. Rapatrier
   * inconditionnellement en ferait un voleur de focus : un Échap frappé n'importe où —
   * typiquement dans le champ de recherche, qui a son propre Échap — déplacerait la
   * personne sur la cloche, et `preventDefault` priverait au passage tout autre
   * consommateur de la touche. Fermer sans toucher au focus est le comportement correct
   * hors du panneau (WCAG 2.2, critère 2.4.3), comme le fait déjà le clic extérieur.
   *
   * `@HostListener` est retiré par Angular à la destruction du composant : aucun
   * écouteur ne survit à la vue.
   */
  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    const panneau = this.notifications()?.nativeElement;
    if (!panneau?.open) return;
    const dedans = panneau.contains(document.activeElement);
    panneau.open = false;
    if (dedans) {
      event.preventDefault();
      this.notificationTrigger()?.nativeElement.focus();
    }
  }

  /**
   * Sortir du panneau au clavier le referme.
   *
   * Sans cela, une tabulation depuis le `<summary>` laisserait `open` à `true`
   * indéfiniment — le panneau ne contient aujourd'hui aucun élément focalisable. Sous
   * 479 px il passe en `position: fixed` pleine largeur et recouvrirait alors l'élément
   * qui vient de recevoir le focus (WCAG 2.2, critère 2.4.11).
   *
   * Le focus n'est pas déplacé : il appartient déjà à sa nouvelle destination.
   */
  @HostListener('focusout', ['$event'])
  protected onFocusOut(event: FocusEvent): void {
    const panneau = this.notifications()?.nativeElement;
    if (!panneau?.open) return;
    const destination = event.relatedTarget as Node | null;
    // `relatedTarget` nul signifie que le focus quitte le document : le panneau n'a plus
    // de raison de rester ouvert non plus.
    if (destination && panneau.contains(destination)) return;
    panneau.open = false;
  }

  /**
   * Un clic hors du panneau le referme sans lui voler le focus.
   *
   * Le focus appartient déjà à la cible du clic : le déplacer sur le `<summary>` ferait
   * sauter le point d'insertion de la personne.
   */
  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: Event): void {
    const panneau = this.notifications()?.nativeElement;
    if (!panneau?.open) return;
    if (panneau.contains(event.target as Node)) return;
    panneau.open = false;
  }

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
