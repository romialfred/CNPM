import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ShowcaseModerationItem } from './showcase-moderation-gateway';

/** Aperçu de présentation pur : aucun formulaire, média distant ou commande métier. */
@Component({
  selector: 'cnpm-showcase-moderation-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './showcase-moderation-preview.component.html',
  styleUrl: './showcase-moderation-preview.component.scss',
})
export class ShowcaseModerationPreviewComponent {
  readonly item = input.required<ShowcaseModerationItem>();
}
