import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type CnpmSkeletonVariant = 'text' | 'table' | 'card' | 'chart';

/**
 * Ossature de chargement — `Skeleton` (FDB-005).
 *
 * Le pattern `loading-empty-error.md` pose la règle dure : « Ne jamais afficher une
 * page blanche ou un spinner indéfini », et exige un squelette « fidèle à la
 * structure » de ce qui se charge.
 *
 * Les barres sont purement décoratives : elles portent `aria-hidden`, et l'occupation
 * est annoncée une seule fois par une région de statut. Sans cela, un lecteur d'écran
 * énoncerait une succession de blocs vides ; avec, il entend « Chargement… » et rien
 * d'autre.
 */
@Component({
  selector: 'cnpm-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cnpm-skeleton" [class]="'cnpm-skeleton--' + variant()">
      <span class="cnpm-skeleton__status" role="status" aria-live="polite">{{ label() }}</span>

      <div class="cnpm-skeleton__bones" aria-hidden="true">
        @switch (variant()) {
          @case ('table') {
            <div class="cnpm-skeleton__row cnpm-skeleton__row--head">
              @for (col of columnTracks(); track $index) {
                <span class="cnpm-skeleton__cell"></span>
              }
            </div>
            @for (row of rowTracks(); track $index) {
              <div class="cnpm-skeleton__row">
                @for (col of columnTracks(); track $index) {
                  <span class="cnpm-skeleton__cell"></span>
                }
              </div>
            }
          }
          @case ('card') {
            <div class="cnpm-skeleton__card">
              <span class="cnpm-skeleton__line cnpm-skeleton__line--title"></span>
              @for (line of rowTracks(); track $index) {
                <span class="cnpm-skeleton__line"></span>
              }
            </div>
          }
          @case ('chart') {
            <div class="cnpm-skeleton__chart">
              @for (bar of columnTracks(); track $index) {
                <span class="cnpm-skeleton__bar"></span>
              }
            </div>
          }
          @default {
            @for (line of rowTracks(); track $index) {
              <span class="cnpm-skeleton__line"></span>
            }
          }
        }
      </div>
    </div>
  `,
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  readonly variant = input<CnpmSkeletonVariant>('text');
  readonly rows = input(3);
  readonly columns = input(4);
  /** Message annoncé aux technologies d'assistance pendant le chargement. */
  readonly label = input('Chargement en cours…');

  protected readonly rowTracks = computed(() => Array.from({ length: Math.max(1, this.rows()) }));
  protected readonly columnTracks = computed(() =>
    Array.from({ length: Math.max(1, this.columns()) }),
  );
}
