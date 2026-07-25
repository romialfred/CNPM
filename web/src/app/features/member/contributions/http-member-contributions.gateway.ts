import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberContributionNotFoundError,
  type MemberContributionDetail,
  type MemberContributionPage,
  type MemberContributionQuery,
  type MemberContributionsGateway,
  type MemberContributionStatus,
  type MemberContributionSummary,
} from './member-contributions-gateway';

/**
 * Adaptateur HTTP de « Mes cotisations » (PRT-006).
 *
 * <p>Le périmètre n'est jamais envoyé : aucun identifiant d'adhésion ne figure dans la
 * requête, le serveur le déduit du compte authentifié. L'écran ne peut donc pas, même par
 * erreur de code, demander les cotisations d'un autre membre.
 *
 * <p>Les montants arrivent en chaîne décimale (`numeric(19,2)` sérialisé) et non en
 * nombre : c'est le contrat qui l'impose, pour qu'aucun montant ne traverse un flottant.
 * La conversion en `number` a lieu ici, une seule fois, au bord de l'application.
 */

interface ContributionSummaryResponse {
  readonly id: string;
  readonly reference: string;
  readonly exercise: number;
  readonly dueDate: string;
  readonly calledAmount: string;
  readonly paidAmount: string;
  readonly outstandingAmount: string;
  readonly currency: string;
  readonly status: MemberContributionStatus;
}

interface ContributionPageResponse {
  readonly items: readonly ContributionSummaryResponse[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly availableExercises: readonly number[];
}

interface ContributionDetailResponse extends ContributionSummaryResponse {
  readonly issuedOn: string;
  readonly amountOriginNote: string;
  readonly adjustments: readonly {
    readonly reference: string;
    readonly direction: 'CREDIT' | 'DEBIT';
    readonly amount: string;
    readonly currency: string;
    readonly reason: string;
    readonly recordedOn: string;
  }[];
  readonly schedule: readonly {
    readonly id: string;
    readonly label: string;
    readonly dueDate: string;
    readonly expectedAmount: string;
    readonly paidAmount: string;
    readonly outstandingAmount: string;
    readonly currency: string;
    readonly status: MemberContributionStatus;
  }[];
}

function amount(value: string): number {
  return Number.parseFloat(value);
}

function toSummary(response: ContributionSummaryResponse): MemberContributionSummary {
  return {
    id: response.id,
    reference: response.reference,
    exercise: response.exercise,
    dueDate: response.dueDate,
    calledAmount: amount(response.calledAmount),
    paidAmount: amount(response.paidAmount),
    outstandingAmount: amount(response.outstandingAmount),
    currency: 'XOF',
    status: response.status,
  };
}

@Injectable()
export class HttpMemberContributionsGateway implements MemberContributionsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  list(query: MemberContributionQuery): Observable<MemberContributionPage> {
    let params = new HttpParams()
      .set('sort', query.sort)
      .set('direction', query.direction)
      // Le serveur pagine à partir de zéro ; l'écran compte à partir de un.
      .set('page', String(Math.max(0, query.page - 1)))
      .set('size', String(query.size));
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.exercise) {
      params = params.set('exercise', String(query.exercise));
    }

    return this.http
      .get<ContributionPageResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/contributions'), {
        params,
      })
      .pipe(
        map((response) => ({
          items: response.items.map(toSummary),
          page: response.page + 1,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          availableExercises: response.availableExercises,
        })),
      );
  }

  loadDetail(id: string): Observable<MemberContributionDetail> {
    return this.http
      .get<ContributionDetailResponse>(buildCnpmApiUrl(this.baseUrl, `portal/contributions/${id}`))
      .pipe(
        map((response) => ({
          ...toSummary(response),
          issuedOn: response.issuedOn,
          amountOriginNote: response.amountOriginNote,
          adjustments: response.adjustments.map((adjustment) => ({
            reference: adjustment.reference,
            direction: adjustment.direction,
            amount: amount(adjustment.amount),
            currency: 'XOF' as const,
            reason: adjustment.reason,
            recordedOn: adjustment.recordedOn,
          })),
          schedule: response.schedule.map((installment) => ({
            id: installment.id,
            label: installment.label,
            dueDate: installment.dueDate,
            expectedAmount: amount(installment.expectedAmount),
            paidAmount: amount(installment.paidAmount),
            outstandingAmount: amount(installment.outstandingAmount),
            currency: 'XOF' as const,
            status: installment.status,
          })),
        })),
        catchError((error: unknown) =>
          // Une cotisation d'un autre membre répond 404 comme une cotisation inexistante :
          // l'écran ne fait donc pas de différence, et n'en révèle aucune.
          throwError(() =>
            error instanceof CnpmApiError && error.status === 404
              ? new MemberContributionNotFoundError(id)
              : error,
          ),
        ),
      );
  }
}
