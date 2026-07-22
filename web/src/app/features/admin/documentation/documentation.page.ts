import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { DocContentComponent } from './doc-content.component';
import type { DocManualId } from './documentation.model';
import { TECHNICAL_MANUAL } from './technical-manual.content';
import { USER_MANUAL } from './user-manual.content';

/**
 * « Aide et documentation » du back-office.
 *
 * Regroupe deux corpus : un manuel utilisateur (prise en main des parcours) et une
 * documentation technique (architecture, base de données, code, déploiement). Un
 * commutateur bascule entre les deux ; le sommaire ancré permet un accès direct. Le
 * contenu est décrit en données typées et rendu par {@link DocContentComponent}.
 */
@Component({
  selector: 'cnpm-admin-documentation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminShellComponent, PageHeaderComponent, DocContentComponent],
  templateUrl: './documentation.page.html',
  styleUrl: './documentation.page.scss',
})
export class DocumentationPage {
  protected readonly manuals = [USER_MANUAL, TECHNICAL_MANUAL] as const;
  protected readonly activeManualId = signal<DocManualId>('user');
  protected readonly manual = computed(
    () => this.manuals.find((m) => m.id === this.activeManualId()) ?? USER_MANUAL,
  );

  protected select(id: DocManualId): void {
    this.activeManualId.set(id);
  }
}
