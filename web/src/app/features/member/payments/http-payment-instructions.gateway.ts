import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  PaymentInstructionsAccessError,
  PaymentInstructionsAuthenticationError,
  PaymentInstructionsNoMembershipError,
  type CollectionAccountLine,
  type PaymentInstructions,
  type PaymentInstructionsGateway,
  type PaymentReferenceLine,
} from './payment-instructions-gateway';

interface ReferenceResponse {
  readonly id: string;
  readonly referenceValue: string;
  readonly exercise?: number | null;
}

interface AccountResponse {
  readonly id: string;
  readonly channel: CollectionAccountLine['channel'];
  readonly label: string;
  readonly accountHolder: string;
  readonly accountIdentifier: string;
  readonly bankName?: string | null;
  readonly instructions?: string | null;
}

interface InstructionsResponse {
  readonly references: readonly ReferenceResponse[];
  readonly collectionAccounts: readonly AccountResponse[];
}

/** Adaptateur HTTP des instructions de paiement, sans repli vers des données locales. */
@Injectable()
export class HttpPaymentInstructionsGateway implements PaymentInstructionsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  load(): Observable<PaymentInstructions> {
    return this.http
      .get<InstructionsResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/payment-instructions'))
      .pipe(
        map((response) => ({
          references: response.references.map(mapReference),
          collectionAccounts: response.collectionAccounts.map(mapAccount),
        })),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapReference(item: ReferenceResponse): PaymentReferenceLine {
  return { id: item.id, referenceValue: item.referenceValue, exercise: item.exercise ?? null };
}

function mapAccount(item: AccountResponse): CollectionAccountLine {
  return {
    id: item.id,
    channel: item.channel,
    label: item.label,
    accountHolder: item.accountHolder,
    accountIdentifier: item.accountIdentifier,
    bankName: item.bankName ?? null,
    instructions: item.instructions ?? null,
  };
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
      return new PaymentInstructionsAuthenticationError();
    case 'authorization':
      return new PaymentInstructionsAccessError();
    case 'not-found':
      return new PaymentInstructionsNoMembershipError();
    default:
      return error;
  }
}
