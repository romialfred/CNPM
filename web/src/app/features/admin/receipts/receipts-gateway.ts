import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type ReceiptStatus = 'ISSUED' | 'CANCELLED';
export type ReceiptChannel = 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH' | 'CHECK';
export type ReceiptPeriod = '2024-T1' | '2024-T2' | '2024-T3' | '2024-T4';
export type ReceiptSortKey = 'issuedAt' | 'amount' | 'status';

export interface ReceiptQuery {
  readonly search: string;
  readonly status: ReceiptStatus | null;
  readonly channel: ReceiptChannel | null;
  readonly period: ReceiptPeriod | null;
  readonly sort: {
    readonly key: ReceiptSortKey;
    readonly direction: 'asc' | 'desc';
  };
  /** Page lisible, indexée à partir de 1. */
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Projection du registre. Elle ne contient volontairement aucun
 * document, jeton de vérification, QR, signature, cachet ou identité d'émetteur.
 */
export interface ReceiptRegistryRow {
  readonly id: string;
  readonly demonstrationReference: string;
  readonly memberCode: string;
  readonly memberLabel: string;
  readonly amount: number;
  readonly period: ReceiptPeriod;
  readonly channel: ReceiptChannel;
  readonly issuedAt: string;
  readonly status: ReceiptStatus;
  readonly paymentReference: string;
  readonly paymentConfirmedAt: string;
  readonly sourcePaymentStatus: 'CONFIRMED';
  readonly supersedesReference: string | null;
  readonly replacedByReference: string | null;
  readonly deliveryState: 'NOT_SIMULATED';
}

export interface ReceiptRegistryOverview {
  readonly totalRecords: number;
  readonly issuedCount: number;
  readonly cancelledCount: number;
  readonly totalAmount: number;
}

export interface ReceiptRegistryPage {
  readonly rows: readonly ReceiptRegistryRow[];
  readonly totalItems: number;
  readonly overview: ReceiptRegistryOverview;
}

export interface ReceiptsGateway {
  search(query: ReceiptQuery): Observable<ReceiptRegistryPage>;
}

export const RECEIPTS_GATEWAY = new InjectionToken<ReceiptsGateway>('RECEIPTS_GATEWAY');

export class ReceiptAccessError extends Error {
  constructor(message = 'Accès refusé au registre des reçus') {
    super(message);
    this.name = 'ReceiptAccessError';
  }
}
