import { Injectable } from '@angular/core';
import { delay, type Observable, of, throwError } from 'rxjs';
import {
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  type EnrollmentApplication,
  type EnrollmentApproval,
  type EnrollmentPage,
  type EnrollmentPageQuery,
  type EnrollmentRejection,
  type EnrollmentsGateway,
} from './enrollments-gateway';

const REVIEWER_ID = '90000000-0000-4000-8000-000000000001';
const DEMO_DELAY_MS = 140;

/**
 * Jeu entièrement fictif. Les identifiants, numéros de dossier et entreprises ne
 * représentent aucun membre réel et les canaux sont explicitement marqués démonstration.
 */
const DEMO_APPLICATIONS: readonly EnrollmentApplication[] = [
  application(1, 'SUBMITTED', '2026-07-18T08:15:00Z'),
  application(2, 'UNDER_REVIEW', '2026-07-17T14:40:00Z', REVIEWER_ID),
  application(3, 'COMPLEMENT_REQUIRED', '2026-07-16T09:05:00Z', REVIEWER_ID),
  application(4, 'APPROVED', '2026-07-15T11:20:00Z', REVIEWER_ID),
  application(5, 'REJECTED', '2026-07-14T15:55:00Z', REVIEWER_ID),
  application(6, 'DRAFT'),
  application(7, 'SUBMITTED', '2026-07-12T10:30:00Z'),
  application(8, 'UNDER_REVIEW', '2026-07-11T12:00:00Z', REVIEWER_ID),
  application(9, 'APPROVED', '2026-07-10T16:45:00Z', REVIEWER_ID),
  application(10, 'COMPLEMENT_REQUIRED', '2026-07-09T08:50:00Z', REVIEWER_ID),
  application(11, 'SUBMITTED', '2026-07-08T13:10:00Z'),
  application(12, 'DRAFT'),
];

@Injectable()
export class DemoEnrollmentsGateway implements EnrollmentsGateway {
  private readonly applications = new Map(DEMO_APPLICATIONS.map((item) => [item.id, item]));

  list(query: EnrollmentPageQuery): Observable<EnrollmentPage> {
    const rows = [...this.applications.values()];
    const start = (Math.max(1, query.page) - 1) * query.pageSize;
    return of({
      rows: rows.slice(start, start + query.pageSize),
      totalItems: rows.length,
      totalPages: Math.ceil(rows.length / query.pageSize),
    }).pipe(delay(DEMO_DELAY_MS));
  }

  get(id: string): Observable<EnrollmentApplication> {
    const item = this.applications.get(id);
    return item
      ? of(item).pipe(delay(DEMO_DELAY_MS))
      : throwError(() => new EnrollmentNotFoundError());
  }

  startReview(id: string): Observable<EnrollmentApplication> {
    return this.transition(id, ['SUBMITTED'], {
      status: 'UNDER_REVIEW',
      assignedTo: REVIEWER_ID,
    });
  }

  requestComplement(id: string, comment: string): Observable<EnrollmentApplication> {
    void comment;
    return this.transition(id, ['UNDER_REVIEW'], { status: 'COMPLEMENT_REQUIRED' });
  }

  approve(id: string, input: EnrollmentApproval): Observable<EnrollmentApplication> {
    void input;
    return this.transition(id, ['UNDER_REVIEW'], { status: 'APPROVED' });
  }

  reject(id: string, input: EnrollmentRejection): Observable<EnrollmentApplication> {
    void input;
    return this.transition(id, ['UNDER_REVIEW'], { status: 'REJECTED' });
  }

  private transition(
    id: string,
    allowedStatuses: readonly EnrollmentApplication['status'][],
    change: Pick<EnrollmentApplication, 'status'> & Partial<EnrollmentApplication>,
  ): Observable<EnrollmentApplication> {
    const current = this.applications.get(id);
    if (!current) {
      return throwError(() => new EnrollmentNotFoundError());
    }
    if (!allowedStatuses.includes(current.status)) {
      return throwError(() => new EnrollmentConflictError());
    }
    const next: EnrollmentApplication = {
      ...current,
      ...change,
      version: current.version + 1,
    };
    this.applications.set(id, next);
    return of(next).pipe(delay(DEMO_DELAY_MS));
  }
}

function application(
  sequence: number,
  status: EnrollmentApplication['status'],
  submittedAt: string | null = null,
  assignedTo: string | null = null,
): EnrollmentApplication {
  const suffix = String(sequence).padStart(12, '0');
  return {
    id: `10000000-0000-4000-8000-${suffix}`,
    caseNumber: `ENR-DEMO-${String(sequence).padStart(4, '0')}`,
    organizationId: `20000000-0000-4000-8000-${suffix}`,
    channel: sequence % 2 === 0 ? 'DEMO_ASSISTE' : 'DEMO_PORTAIL',
    status,
    submittedAt,
    assignedTo,
    version: 1,
  };
}
