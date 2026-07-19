import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** États exposés par `EnrollmentApplicationView` dans le contrat OpenAPI. */
export type EnrollmentStatus =
  'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'COMPLEMENT_REQUIRED' | 'APPROVED' | 'REJECTED';

export interface EnrollmentApplication {
  readonly id: string;
  readonly caseNumber: string;
  readonly organizationId: string;
  /** Code de canal fourni par la source, sans traduction vers une nomenclature inventée. */
  readonly channel: string;
  readonly status: EnrollmentStatus;
  readonly submittedAt: string | null;
  readonly assignedTo: string | null;
  readonly version: number;
}

export interface EnrollmentPageQuery {
  /** Page lisible dans l'URL, indexée à partir de 1. */
  readonly page: number;
  readonly pageSize: number;
}

export interface EnrollmentPage {
  readonly rows: readonly EnrollmentApplication[];
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface EnrollmentApproval {
  /** Valeur explicitement fournie par le décideur : aucun format n'est inventé côté UI. */
  readonly membershipNumber: string;
  /** Valeur explicitement fournie par le décideur : aucune catégorie n'est calculée. */
  readonly categoryCode: string;
  readonly comment?: string;
}

export interface EnrollmentRejection {
  /** Code libre tant que la nomenclature des motifs n'est pas arbitrée (ENR-DEC-001). */
  readonly reasonCode?: string;
  readonly comment: string;
}

/** Port BO-008 / BO-010, aligné sur les opérations du contrat ENROLLMENT. */
export interface EnrollmentsGateway {
  list(query: EnrollmentPageQuery): Observable<EnrollmentPage>;
  get(id: string): Observable<EnrollmentApplication>;
  startReview(id: string): Observable<EnrollmentApplication>;
  requestComplement(id: string, comment: string): Observable<EnrollmentApplication>;
  approve(id: string, input: EnrollmentApproval): Observable<EnrollmentApplication>;
  reject(id: string, input: EnrollmentRejection): Observable<EnrollmentApplication>;
}

export const ENROLLMENTS_GATEWAY = new InjectionToken<EnrollmentsGateway>('ENROLLMENTS_GATEWAY');

export class EnrollmentAccessError extends Error {
  constructor(message = 'Accès refusé aux dossiers d’enrôlement') {
    super(message);
    this.name = 'EnrollmentAccessError';
  }
}

export class EnrollmentNotFoundError extends Error {
  constructor(message = 'Dossier d’enrôlement introuvable') {
    super(message);
    this.name = 'EnrollmentNotFoundError';
  }
}

export class EnrollmentConflictError extends Error {
  constructor(message = 'Le dossier a changé d’état depuis son affichage') {
    super(message);
    this.name = 'EnrollmentConflictError';
  }
}

export class EnrollmentValidationError extends Error {
  constructor(message = 'La décision contient une donnée invalide') {
    super(message);
    this.name = 'EnrollmentValidationError';
  }
}
