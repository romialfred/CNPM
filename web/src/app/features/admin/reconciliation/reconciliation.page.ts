import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { catchError, of } from 'rxjs';
import { AlertComponent } from '../../../design-system/alert/alert.component';
import { BadgeComponent, type CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import { ButtonComponent } from '../../../design-system/button/button.component';
import { PageHeaderComponent } from '../../../design-system/page-header/page-header.component';
import { ToastService } from '../../../design-system/toast/toast.service';
import { AdminShellComponent } from '../../../layout/admin-shell/admin-shell.component';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  RECONCILIATION_GATEWAY,
  ReconciliationAccessError,
  ReconciliationConflictError,
  type ReconciliationCase,
  type ReconciliationStatus,
  type StatementLineInput,
} from './reconciliation-gateway';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * Écran CNPM « Rapprochement » (Lot 5) : import d'un relevé et file des cas.
 *
 * <p>L'import propose des appariements par la référence lue dans le libellé ; c'est la décision
 * de la CNPM qui, en confirmant, crée l'encaissement. Rien de démo, tout via le vrai backend.
 */
@Component({
  selector: 'cnpm-reconciliation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DecimalPipe,
    AdminShellComponent,
    AlertComponent,
    BadgeComponent,
    ButtonComponent,
    PageHeaderComponent,
  ],
  templateUrl: './reconciliation.page.html',
  styleUrl: './reconciliation.page.scss',
})
export class ReconciliationPage {
  private readonly gateway = inject(RECONCILIATION_GATEWAY);
  private readonly session = inject(SESSION_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly title = inject(Title);

  private readonly sessionIdentity = toSignal(
    this.session.identity.pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  protected readonly canRecord = computed(
    () => this.sessionIdentity()?.permissions.includes('PAYMENT.RECORD') ?? false,
  );

  protected readonly cases = signal<readonly ReconciliationCase[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly busyId = signal<string | null>(null);

  protected readonly proposedCount = computed(
    () => this.cases().filter((c) => c.status === 'PROPOSED').length,
  );
  protected readonly unmatchedCount = computed(
    () => this.cases().filter((c) => c.status === 'UNMATCHED').length,
  );

  // Import.
  protected readonly showImport = signal(false);
  protected readonly importing = signal(false);
  protected readonly importError = signal<string | null>(null);
  protected readonly bankCode = signal('BDM');
  protected readonly statementRef = signal('');
  protected readonly accountRefMasked = signal('****0001');
  protected readonly periodStart = signal('');
  protected readonly periodEnd = signal('');
  protected readonly linesText = signal('');

  constructor() {
    this.title.setTitle('Rapprochement — Administration CNPM');
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.gateway
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (cases) => {
          this.cases.set(cases);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  protected openImport(): void {
    if (!this.canRecord()) return;
    this.importError.set(null);
    this.showImport.set(true);
  }

  protected cancelImport(): void {
    this.showImport.set(false);
    this.importError.set(null);
  }

  protected runImport(): void {
    this.importError.set(null);
    if (!this.statementRef().trim()) {
      this.importError.set('Indiquez la référence du relevé.');
      return;
    }
    const lines = this.parseLines();
    if (lines === null) {
      return;
    }
    if (lines.length === 0) {
      this.importError.set('Ajoutez au moins une ligne (format : date ; montant ; libellé).');
      return;
    }
    this.importing.set(true);
    this.gateway
      .importStatement({
        bankCode: this.bankCode().trim() || 'BANQUE',
        statementRef: this.statementRef().trim(),
        accountRefMasked: this.accountRefMasked().trim() || '****',
        periodStart: this.periodStart() || lines[0].bookingDate,
        periodEnd: this.periodEnd() || lines[lines.length - 1].bookingDate,
        lines,
      })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (summary) => {
          this.importing.set(false);
          this.showImport.set(false);
          this.toast.success(
            `Relevé importé : ${summary.matched} apparié(s), ${summary.unmatched} non rapproché(s), ${summary.duplicates} doublon(s).`,
          );
          this.load();
        },
        error: (error: unknown) => {
          this.importing.set(false);
          this.importError.set(this.messageFor(error));
        },
      });
  }

  /** Analyse le collage « date ; montant ; libellé » (une ligne par encaissement). */
  private parseLines(): StatementLineInput[] | null {
    const rows = this.linesText()
      .split('\n')
      .map((row) => row.trim())
      .filter((row) => row.length > 0);
    const lines: StatementLineInput[] = [];
    for (let i = 0; i < rows.length; i++) {
      const parts = rows[i].split(';').map((p) => p.trim());
      const [date, amount, ...rest] = parts;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
        this.importError.set(`Ligne ${i + 1} : date invalide (attendu AAAA-MM-JJ).`);
        return null;
      }
      if (!/^\d{1,17}(\.\d{1,2})?$/.test(amount ?? '')) {
        this.importError.set(`Ligne ${i + 1} : montant invalide.`);
        return null;
      }
      lines.push({
        lineNumber: i + 1,
        bookingDate: date,
        amount,
        referenceText: rest.join(';'),
      });
    }
    return lines;
  }

  protected decide(reconciliationCase: ReconciliationCase, decision: 'CONFIRM' | 'REJECT'): void {
    if (!this.canRecord() || this.busyId()) return;
    let reason = '';
    if (decision === 'REJECT') {
      const entered = globalThis.prompt('Motif du rejet de ce cas ?');
      if (entered === null) return;
      if (entered.trim().length < 3) {
        this.toast.error('Un motif d’au moins 3 caractères est requis.');
        return;
      }
      reason = entered.trim();
    }
    this.busyId.set(reconciliationCase.id);
    this.gateway
      .decide(reconciliationCase.id, decision, reason)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.toast.success(
            decision === 'CONFIRM'
              ? 'Cas confirmé : l’encaissement a été créé et rattaché au cotisant.'
              : 'Cas rejeté.',
          );
          this.load();
        },
        error: (error: unknown) => {
          this.busyId.set(null);
          this.toast.error(this.messageFor(error));
        },
      });
  }

  protected statusLabel(status: ReconciliationStatus): string {
    return {
      PROPOSED: 'Apparié · à confirmer',
      CONFIRMED: 'Confirmé',
      REJECTED: 'Rejeté',
      UNMATCHED: 'Non rapproché',
    }[status];
  }

  protected statusTone(status: ReconciliationStatus): CnpmBadgeTone {
    if (status === 'CONFIRMED') return 'success';
    if (status === 'PROPOSED') return 'warning';
    if (status === 'UNMATCHED') return 'error';
    return 'neutral';
  }

  private messageFor(error: unknown): string {
    if (error instanceof ReconciliationAccessError) {
      return 'Le serveur a refusé l’opération : permission insuffisante.';
    }
    if (error instanceof ReconciliationConflictError) {
      return error.message;
    }
    return 'L’opération a échoué. Vérifiez votre saisie puis réessayez.';
  }
}
