import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Contrat de l'écran COGEF « Reçus » (Lot 6). Un seul adaptateur HTTP réel, aucune démo.
 */

export interface IssuedReceipt {
  readonly id: string;
  readonly receiptNumber: string;
  readonly transactionNumber: string | null;
  readonly referenceValue: string | null;
  readonly organizationName: string | null;
  readonly channel: string | null;
  readonly amount: number;
  readonly currency: string;
  readonly issuedAt: string | null;
  readonly status: string;
}

export interface ReceiptsRegistryGateway {
  list(): Observable<readonly IssuedReceipt[]>;
}

export const RECEIPTS_REGISTRY_GATEWAY = new InjectionToken<ReceiptsRegistryGateway>(
  'RECEIPTS_REGISTRY_GATEWAY',
);

export class ReceiptsRegistryAuthenticationError extends Error {
  constructor(message = 'Une authentification valide est requise.') {
    super(message);
    this.name = 'ReceiptsRegistryAuthenticationError';
  }
}

export class ReceiptsRegistryAccessError extends Error {
  constructor(message = 'Accès refusé aux reçus.') {
    super(message);
    this.name = 'ReceiptsRegistryAccessError';
  }
}
