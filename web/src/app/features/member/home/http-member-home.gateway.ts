import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  MemberHomeAccessError,
  MemberHomeNoMembershipError,
  type ExerciseSummary,
  type MemberDashboard,
  type MemberHomeGateway,
  type MembershipStatus,
} from './member-home-gateway';

interface ExerciseResponse {
  readonly year: number;
  readonly called: string;
  readonly settled: string;
  readonly outstanding: string;
}

interface DashboardResponse {
  readonly identity: {
    readonly organization: string;
    readonly memberCode: string;
    readonly category: string;
    readonly status: string;
    readonly memberSince?: string | null;
  };
  readonly calledTotal: string;
  readonly settledTotal: string;
  readonly outstandingTotal: string;
  readonly overdueAmount: string;
  readonly nextDueDate?: string | null;
  readonly lastPayment?: {
    readonly amount: string;
    readonly currency: string;
    readonly paidAt?: string | null;
  } | null;
  readonly paymentCount: number;
  readonly receiptCount: number;
  readonly exercises: readonly ExerciseResponse[];
}

const MEMBERSHIP_STATUSES: ReadonlySet<MembershipStatus> = new Set<MembershipStatus>([
  'ACTIVE',
  'DORMANT',
  'SUSPENDED',
]);

/** Adaptateur HTTP du tableau de bord membre, sans repli vers des données locales. */
@Injectable()
export class HttpMemberHomeGateway implements MemberHomeGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  load(): Observable<MemberDashboard> {
    return this.http
      .get<DashboardResponse>(buildCnpmApiUrl(this.baseUrl, 'portal/dashboard'))
      .pipe(
        map(mapDashboard),
        catchError((error: unknown) => throwError(() => mapDomainError(error))),
      );
  }
}

function mapDashboard(response: DashboardResponse): MemberDashboard {
  return {
    identity: {
      organization: response.identity.organization,
      memberCode: response.identity.memberCode,
      category: response.identity.category,
      status: normalizeStatus(response.identity.status),
      memberSince: response.identity.memberSince ?? null,
    },
    calledTotal: Number.parseFloat(response.calledTotal),
    settledTotal: Number.parseFloat(response.settledTotal),
    outstandingTotal: Number.parseFloat(response.outstandingTotal),
    overdueAmount: Number.parseFloat(response.overdueAmount),
    nextDueDate: response.nextDueDate ?? null,
    lastPayment: response.lastPayment
      ? {
          amount: Number.parseFloat(response.lastPayment.amount),
          currency: response.lastPayment.currency,
          paidAt: response.lastPayment.paidAt ?? null,
        }
      : null,
    paymentCount: response.paymentCount,
    receiptCount: response.receiptCount,
    exercises: response.exercises.map(mapExercise),
  };
}

function mapExercise(item: ExerciseResponse): ExerciseSummary {
  return {
    year: item.year,
    called: Number.parseFloat(item.called),
    settled: Number.parseFloat(item.settled),
    outstanding: Number.parseFloat(item.outstanding),
  };
}

function normalizeStatus(status: string): MembershipStatus {
  return MEMBERSHIP_STATUSES.has(status as MembershipStatus)
    ? (status as MembershipStatus)
    : 'DORMANT';
}

function mapDomainError(error: unknown): unknown {
  if (!(error instanceof CnpmApiError)) {
    return error;
  }
  switch (error.category) {
    case 'authentication':
    case 'authorization':
      return new MemberHomeAccessError();
    case 'not-found':
      return new MemberHomeNoMembershipError();
    default:
      return error;
  }
}
