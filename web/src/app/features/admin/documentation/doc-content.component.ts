import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  LucideInfo,
  LucideLightbulb,
  LucideTriangleAlert,
} from '@lucide/angular';
import { CNPM_ICON_SIZE } from '../../../design-system/icon/icon';
import type { DocBlock } from './documentation.model';

/**
 * Rend une suite de blocs de documentation en HTML sémantique et accessible.
 *
 * Aucun `innerHTML` : chaque bloc est un gabarit dédié (titres, listes ordonnées,
 * tableaux avec en-têtes de colonnes, régions défilables au clavier pour les tableaux
 * larges). Le type de bloc étant une union discriminée que le vérificateur de gabarit
 * Angular ne restreint pas via `@switch`, un accès typé est fait par des fonctions de
 * transtypage (`asParagraph`, `asTable`…), sans perte de sûreté à la construction.
 */
@Component({
  selector: 'cnpm-doc-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideInfo, LucideLightbulb, LucideTriangleAlert],
  templateUrl: './doc-content.component.html',
  styleUrl: './doc-content.component.scss',
})
export class DocContentComponent {
  readonly blocks = input.required<readonly DocBlock[]>();
  protected readonly iconSize = CNPM_ICON_SIZE;

  protected asParagraph(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'paragraph' }>;
  }
  protected asSteps(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'steps' }>;
  }
  protected asList(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'list' }>;
  }
  protected asTable(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'table' }>;
  }
  protected asCode(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'code' }>;
  }
  protected asTree(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'tree' }>;
  }
  protected asCallout(block: DocBlock) {
    return block as Extract<DocBlock, { kind: 'callout' }>;
  }

  /** Mot d'état de l'encadré : le ton n'est jamais porté par la seule couleur (WCAG 2.2). */
  protected calloutLabel(tone: 'info' | 'warning' | 'tip'): string {
    return tone === 'warning' ? 'Attention' : tone === 'tip' ? 'Astuce' : 'À noter';
  }
}
