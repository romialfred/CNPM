import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface CnpmDefinition {
  readonly label: string;
  readonly value: string;
}

/**
 * Liste de définitions (`DefinitionList` du catalogue).
 *
 * Rend un couple libellé/valeur par entrée, en `<dl>` : la relation entre l'intitulé
 * et sa valeur est portée par la sémantique, pas seulement par la mise en page.
 * L'appelant ne transmet que les entrées réellement renseignées — une valeur vide
 * laisserait un espace mort, que la fiche PUB-006 proscrit.
 */
@Component({
  selector: 'cnpm-definition-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="cnpm-definitions">
      @for (item of items(); track item.label) {
        <div class="cnpm-definitions__item">
          <dt class="cnpm-definitions__label">{{ item.label }}</dt>
          <dd class="cnpm-definitions__value">{{ item.value }}</dd>
        </div>
      }
    </dl>
  `,
  styleUrl: './definition-list.component.scss',
})
export class DefinitionListComponent {
  readonly items = input.required<readonly CnpmDefinition[]>();
}
