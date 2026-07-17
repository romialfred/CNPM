import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface InsightStat {
  readonly label: string;
  /** `null` rend un tiret : une valeur indisponible n'est pas un zéro. */
  readonly value: number | null;
  /** Suffixe collé à la valeur, par exemple « % ». */
  readonly suffix?: string;
  /** Décimales affichées ; entier par défaut. */
  readonly decimals?: number;
  /** Sépare visuellement une mesure qui ne se cumule pas aux précédentes. */
  readonly apart?: boolean;
}

/**
 * Panneau de synthèse — `InsightSummary`, exigé par la fiche BO-002.
 *
 * Le composant ne calcule rien : il affiche des agrégats déjà établis par la source.
 * Additionner ou dériver ici produirait un second calcul, capable de contredire
 * silencieusement celui du tableau — précisément le « total incohérent » que la fiche
 * interdit.
 *
 * La note n'est pas décorative : elle dit ce que les chiffres recouvrent. Quatre
 * nombres empilés sans énoncer lequel contient lequel se prêtent à toutes les
 * lectures, y compris fausses.
 */
@Component({
  selector: 'cnpm-insight-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <section class="cnpm-insight" [attr.aria-labelledby]="headingId()">
      <h2 class="cnpm-insight__title" [id]="headingId()">
        {{ title() }}
        @if (unit()) {
          <span class="cnpm-insight__unit">{{ unit() }}</span>
        }
      </h2>

      <dl class="cnpm-insight__stats">
        @for (stat of stats(); track stat.label) {
          <div class="cnpm-insight__stat" [class.cnpm-insight__stat--apart]="stat.apart">
            <dt>{{ stat.label }}</dt>
            <dd>
              @if (stat.value === null) {
                <span aria-label="Donnée indisponible">—</span>
              } @else {
                {{ stat.value | number: format(stat) }}{{ stat.suffix ?? '' }}
              }
            </dd>
          </div>
        }
      </dl>

      @if (note()) {
        <p class="cnpm-insight__note">{{ note() }}</p>
      }
    </section>
  `,
  styleUrl: './insight-summary.component.scss',
})
export class InsightSummaryComponent {
  readonly title = input.required<string>();
  readonly headingId = input.required<string>();
  readonly stats = input.required<readonly InsightStat[]>();
  readonly unit = input<string>();
  readonly note = input<string>();

  protected format(stat: InsightStat): string {
    const decimals = stat.decimals ?? 0;
    return `1.${decimals}-${decimals}`;
  }
}
