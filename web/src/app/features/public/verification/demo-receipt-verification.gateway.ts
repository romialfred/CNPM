import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import type {
  PublicReceiptVerificationResult,
  ReceiptVerificationGateway,
} from './receipt-verification-gateway';

export const DEMO_VERIFICATION_CODE = 'DEMO-VERIF-2026-001';

@Injectable()
export class DemoReceiptVerificationGateway implements ReceiptVerificationGateway {
  verify(code: string): Observable<PublicReceiptVerificationResult> {
    const normalized = code.trim().toUpperCase();
    const result: PublicReceiptVerificationResult =
      normalized === DEMO_VERIFICATION_CODE
        ? {
            outcome: 'found',
            verification: {
              verificationCode: DEMO_VERIFICATION_CODE,
              receiptReference: 'DEMO-APERCU-2026-001',
              statusLabel: 'Aperçu valide',
              amountXof: 150000,
              scenarioDate: '2026-06-18',
              fictionalDemo: true,
            },
          }
        : { outcome: 'not-found' };
    return of(result).pipe(delay(180));
  }
}
