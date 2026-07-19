import { Injectable } from '@angular/core';
import { delay, type Observable, of, throwError } from 'rxjs';
import type {
  BankStatementImportContext,
  BankStatementImportGateway,
  BankStatementInspection,
  BankStatementLocalFile,
} from './bank-statement-import-gateway';

const CONTEXT: BankStatementImportContext = {
  profiles: ['CNPM_DEMO_CSV_V0'],
  officialBankFormatAvailable: false,
  recentRuns: [
    {
      id: 'run-demo-003',
      fileName: 'releve-demo-juin-v3.csv',
      checkedAt: '2024-06-30T15:40:00Z',
      totalLines: 128,
      alerts: 7,
      status: 'TO_REVIEW',
    },
    {
      id: 'run-demo-002',
      fileName: 'releve-demo-juin-v2.csv',
      checkedAt: '2024-06-29T10:15:00Z',
      totalLines: 84,
      alerts: 0,
      status: 'REVIEWED',
    },
  ],
};

@Injectable()
export class DemoBankStatementImportGateway implements BankStatementImportGateway {
  loadContext(): Observable<BankStatementImportContext> {
    return of(CONTEXT).pipe(delay(80));
  }

  inspectLocalDemo(file: BankStatementLocalFile): Observable<BankStatementInspection> {
    if (!file.fileName.toLowerCase().endsWith('.csv')) {
      return throwError(() => new Error('Le banc de démonstration accepte uniquement un fichier CSV.'));
    }

    // Typage contextuel explicite : sans lui, `status` est élargi en `string` et ne
    // satisfait plus l'union StatementLineControlStatus.
    return of<BankStatementInspection>({
      runId: 'CTRL-DEMO-2024-0630-004',
      fileName: file.fileName,
      totalLines: 14,
      validLines: 9,
      duplicates: 2,
      unallocated: 2,
      invalidLines: 1,
      illustrativeAmount: 48_750_000,
      lines: [
        {
          id: 'line-001',
          valueDate: '2024-06-28',
          reference: 'VIR-DEMO-0628-1042',
          payer: 'Sahel Innovation SARL',
          amount: 12_500_000,
          status: 'VALID',
          explanation: 'Référence structurée reconnue dans le jeu fictif.',
        },
        {
          id: 'line-002',
          valueDate: '2024-06-28',
          reference: 'VIR-DEMO-0628-1043',
          payer: 'Kora Industrie SA',
          amount: 8_750_000,
          status: 'DUPLICATE',
          explanation: 'Référence déjà présente dans le lot fictif précédent.',
        },
        {
          id: 'line-003',
          valueDate: '2024-06-29',
          reference: 'VIR-DEMO-0629-1048',
          payer: 'Atelier Horizon SARL',
          amount: 7_250_000,
          status: 'UNALLOCATED',
          explanation: 'Aucun appel fictif ne correspond à la référence.',
        },
        {
          id: 'line-004',
          valueDate: '2024-06-29',
          reference: 'VIR-DEMO-0629-1051',
          payer: 'Nimba Services SAS',
          amount: 3_250_000,
          status: 'INVALID',
          explanation: 'Date de valeur absente dans le scénario source.',
        },
        {
          id: 'line-005',
          valueDate: '2024-06-30',
          reference: 'VIR-DEMO-0630-1055',
          payer: 'Djoliba Emballages SARL',
          amount: 5_400_000,
          status: 'VALID',
          explanation: 'Contrôles locaux du scénario satisfaits.',
        },
      ],
    }).pipe(delay(160));
  }
}

