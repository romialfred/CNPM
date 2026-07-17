import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { BadgeComponent, type CnpmBadgeTone } from '../badge/badge.component';

export type CnpmVerificationStatus = 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'SUSPENDED';

/**
 * Badge de vérification CNPM, avec son explication (`VerificationBadge` du catalogue).
 *
 * Le badge ne se contente pas d'afficher un état : il ouvre une explication, comme
 * l'exige la fiche PUB-006. Le déclencheur est un bouton, donc atteignable au
 * clavier — un visuel seul rendrait l'explication inaccessible.
 *
 * Le composant n'énonce aucune règle de vérification : il reçoit l'explication de son
 * appelant. Les critères, la durée et la portée du badge relèvent d'UX-DEC-004, non
 * tranchée ; un composant de présentation ne doit pas les inventer.
 */
@Component({
  selector: 'cnpm-verification-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent],
  template: `
    <div class="cnpm-verification">
      <button
        type="button"
        class="cnpm-verification__trigger"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="panelId"
        (click)="toggle()"
      >
        <cnpm-badge [tone]="tone()">{{ label() }}</cnpm-badge>
        <span class="cnpm-verification__hint">
          {{ expanded() ? 'Masquer le détail' : 'En savoir plus' }}
        </span>
      </button>
      <div class="cnpm-verification__panel" [id]="panelId">
        @if (expanded()) {
          <p class="cnpm-verification__text">{{ explanation() }}</p>
          @if (verifiedAt()) {
            <p class="cnpm-verification__text">Statut constaté le {{ verifiedAt() }}.</p>
          } @else {
            <p class="cnpm-verification__text">
              La date de vérification n’est pas disponible pour cette vitrine.
            </p>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './verification-badge.component.scss',
})
export class VerificationBadgeComponent {
  readonly status = input.required<CnpmVerificationStatus>();
  readonly explanation = input.required<string>();
  /** Date à laquelle le CNPM a constaté le statut ; omise si la source ne la porte pas. */
  readonly verifiedAt = input<string | null>(null);

  private static nextId = 0;

  protected readonly expanded = signal(false);

  // Identifiant unique par instance : `aria-controls` et `[id]` doivent se
  // correspondre sans ambiguïté. Un identifiant constant produirait des `id` dupliqués
  // dès que deux badges coexistent sur une page (annuaire, liste de vitrines), rendant
  // `aria-controls` ambigu — WCAG 4.1.1/4.1.2.
  protected readonly panelId = `cnpm-verification-panel-${VerificationBadgeComponent.nextId++}`;

  private static readonly PRESENTATION: Record<
    CnpmVerificationStatus,
    { tone: CnpmBadgeTone; label: string }
  > = {
    VERIFIED: { tone: 'success', label: 'Membre vérifié par le CNPM' },
    PENDING: { tone: 'info', label: 'Vérification en cours' },
    EXPIRED: { tone: 'warning', label: 'Vérification expirée' },
    SUSPENDED: { tone: 'error', label: 'Membre suspendu' },
  };

  protected readonly tone = computed(
    () => VerificationBadgeComponent.PRESENTATION[this.status()].tone,
  );
  protected readonly label = computed(
    () => VerificationBadgeComponent.PRESENTATION[this.status()].label,
  );

  protected toggle(): void {
    this.expanded.update((open) => !open);
  }
}
