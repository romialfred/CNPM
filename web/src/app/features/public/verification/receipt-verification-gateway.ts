import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export interface PublicReceiptVerificationDemo {
  readonly verificationCode: string;
  readonly receiptReference: string;
  readonly statusLabel: 'Aperçu valide';
  readonly amountXof: number;
  readonly scenarioDate: string;
  readonly fictionalDemo: true;
}

export type PublicReceiptVerificationResult =
  | { readonly outcome: 'found'; readonly verification: PublicReceiptVerificationDemo }
  | { readonly outcome: 'not-found' };

export interface ReceiptVerificationGateway {
  verify(code: string): Observable<PublicReceiptVerificationResult>;
}

export const RECEIPT_VERIFICATION_GATEWAY = new InjectionToken<ReceiptVerificationGateway>(
  'RECEIPT_VERIFICATION_GATEWAY',
);
