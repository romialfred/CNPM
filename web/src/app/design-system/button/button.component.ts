import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { CnpmButtonSize, CnpmButtonVariant } from '../../ui-contracts/button.contract';

/**
 * Bouton du design system, conforme à `CnpmButtonContract`.
 *
 * Composant de présentation pur : aucune dépendance métier. L'état `loading`
 * désactive l'interaction et annonce l'occupation aux technologies d'assistance
 * via `aria-busy`, sans transmettre le statut par la seule couleur.
 */
@Component({
  selector: 'cnpm-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
      @if (loading()) {
        <span class="cnpm-button__spinner" aria-hidden="true"></span>
      }
      <span class="cnpm-button__label"><ng-content /></span>
    </button>
  `,
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<CnpmButtonVariant>('primary');
  readonly size = input<CnpmButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
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
