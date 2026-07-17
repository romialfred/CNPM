import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CnpmButtonSize, CnpmButtonVariant } from '../../ui-contracts/button.contract';

/**
 * Bouton du design system, conforme à `CnpmButtonContract`.
 *
 * Composant de présentation pur : aucune dépendance métier. L'état `loading`
 * désactive l'interaction et annonce l'occupation aux technologies d'assistance
 * via `aria-busy`, sans transmettre le statut par la seule couleur.
 *
 * Renseigner `routerLink` rend une ancre plutôt qu'un bouton. La distinction n'est
 * pas cosmétique : un `<button routerLink>` navigue au clic mais n'a pas de `href`,
 * donc ni ouverture dans un nouvel onglet, ni clic milieu, ni copie de l'adresse,
 * et il s'annonce « bouton » là où l'utilisateur attend un lien.
 */
@Component({
  selector: 'cnpm-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    <ng-template #content>
      @if (loading()) {
        <span class="cnpm-button__spinner" aria-hidden="true"></span>
      }
      <span class="cnpm-button__label"><ng-content /></span>
    </ng-template>

    @if (routerLink(); as destination) {
      <a
        [routerLink]="inert() ? null : destination"
        [class]="classes()"
        [class.cnpm-button--inert]="inert()"
        [attr.role]="inert() ? 'link' : null"
        [attr.tabindex]="inert() ? 0 : null"
        [attr.aria-disabled]="inert() ? 'true' : null"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-label]="accessibleLabel() || null"
        [attr.aria-describedby]="describedBy() || null"
        (click)="onClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </a>
    } @else {
      <button
        [type]="inert() ? 'button' : type()"
        [class]="classes()"
        [class.cnpm-button--inert]="inert()"
        [attr.aria-disabled]="inert() ? 'true' : null"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-label]="accessibleLabel() || null"
        [attr.aria-describedby]="describedBy() || null"
        (click)="onClick($event)"
      >
        <ng-container [ngTemplateOutlet]="content" />
      </button>
    }
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<CnpmButtonVariant>('primary');
  readonly size = input<CnpmButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly routerLink = input<string | readonly unknown[] | null>(null);
  readonly loading = input(false);
  readonly disabled = input(false);
  readonly block = input(false);
  readonly accessibleLabel = input<string>();
  /**
   * Identifiant d'un texte décrivant le bouton (motif d'indisponibilité, par exemple).
   *
   * Préférer ceci au nom accessible pour une information qui change : réécrire un
   * `aria-label` renomme le bouton à chaque mise à jour, ce qui est intrusif sur un
   * élément focalisable.
   */
  readonly describedBy = input<string | null>(null);

  /**
   * Bouton neutralisé mais toujours focalisable.
   *
   * L'attribut natif `disabled` retirerait le bouton du parcours de tabulation au
   * moment même où l'utilisateur vient de l'activer : le focus retomberait sur le
   * `body` et `aria-busy` ne serait jamais annoncé, puisque son porteur aurait quitté
   * le parcours. `aria-disabled` conserve le focus et l'annonce.
   */
  protected readonly inert = computed(() => this.disabled() || this.loading());

  protected readonly classes = computed(() => {
    const base = `cnpm-button cnpm-button--${this.variant()} cnpm-button--${this.size()}`;
    return this.block() ? `${base} cnpm-button--block` : base;
  });

  protected onClick(event: Event): void {
    if (this.inert()) {
      // `aria-disabled` n'empêche pas l'activation : la garde doit être explicite,
      // y compris pour ne pas soumettre le formulaire pendant un envoi en cours.
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
