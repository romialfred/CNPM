import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type MemberDocumentStatus = 'CATALOGUED' | 'PROCESSING' | 'EXPIRED';
export type MemberDocumentType = 'ATTESTATION' | 'MEMBER_CARD';
export type MemberDocumentSort = 'metadataRecordedOn' | 'reference' | 'title';

/**
 * Projection auto-scopée et strictement consultative de MP-012.
 *
 * Elle reprend le vocabulaire public de MOB-014 sans exposer les classifications,
 * auteurs, objets métier, clés de stockage ou attributs antivirus de BO-023/GED.
 * Aucun fichier, URL, PDF, QR, cachet, signature ou justificatif KYC n'entre dans
 * cette frontière membre.
 */
export interface MemberDocumentMetadata {
  readonly id: string;
  readonly reference: `DEMO-DOC-${string}`;
  readonly title: string;
  readonly type: MemberDocumentType;
  readonly typeLabel: string;
  readonly versionLabel: string;
  readonly metadataRecordedOn: string;
  readonly status: MemberDocumentStatus;
  readonly availabilityDisclosure: string;
}

export interface MemberDocumentQuery {
  readonly search: string;
  readonly type?: MemberDocumentType;
  readonly status?: MemberDocumentStatus;
  readonly sort: MemberDocumentSort;
  readonly direction: 'asc' | 'desc';
  readonly page: number;
  readonly size: number;
}

export interface MemberDocumentPage {
  readonly items: readonly MemberDocumentMetadata[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface MemberDocumentsGateway {
  list(query: MemberDocumentQuery): Observable<MemberDocumentPage>;
}

export const MEMBER_DOCUMENTS_GATEWAY = new InjectionToken<MemberDocumentsGateway>(
  'MEMBER_DOCUMENTS_GATEWAY',
);
