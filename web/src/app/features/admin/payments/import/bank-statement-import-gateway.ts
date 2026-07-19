import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type DemoStatementProfile = 'CNPM_DEMO_CSV_V0';
export type StatementLineControlStatus = 'VALID' | 'DUPLICATE' | 'UNALLOCATED' | 'INVALID';

export interface BankStatementImportContext {
  readonly profiles: readonly DemoStatementProfile[];
  readonly officialBankFormatAvailable: false;
  readonly recentRuns: readonly BankStatementRecentRun[];
}

export interface BankStatementRecentRun {
  readonly id: string;
  readonly fileName: string;
  readonly checkedAt: string;
  readonly totalLines: number;
  readonly alerts: number;
  readonly status: 'REVIEWED' | 'TO_REVIEW';
}

export interface BankStatementLocalFile {
  readonly fileName: string;
  readonly size: number;
  readonly profile: DemoStatementProfile;
}

export interface BankStatementControlledLine {
  readonly id: string;
  readonly valueDate: string;
  readonly reference: string;
  readonly payer: string;
  readonly amount: number;
  readonly status: StatementLineControlStatus;
  readonly explanation: string;
}

export interface BankStatementInspection {
  readonly runId: string;
  readonly fileName: string;
  readonly totalLines: number;
  readonly validLines: number;
  readonly duplicates: number;
  readonly unallocated: number;
  readonly invalidLines: number;
  readonly illustrativeAmount: number;
  readonly lines: readonly BankStatementControlledLine[];
}

/** Port de BO-015 : analyse locale seulement, aucune opération d'import ou d'écriture. */
export interface BankStatementImportGateway {
  loadContext(): Observable<BankStatementImportContext>;
  inspectLocalDemo(file: BankStatementLocalFile): Observable<BankStatementInspection>;
}

export const BANK_STATEMENT_IMPORT_GATEWAY = new InjectionToken<BankStatementImportGateway>(
  'BANK_STATEMENT_IMPORT_GATEWAY',
);

