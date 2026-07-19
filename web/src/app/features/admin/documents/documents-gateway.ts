import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type DocumentClassification = 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
export type DocumentLifecycle = 'CURRENT' | 'EXPIRING' | 'EXPIRED' | 'ARCHIVED';
export type DocumentKind = 'MEMBERSHIP' | 'ORGANIZATION' | 'PAYMENT_SUPPORT' | 'GOVERNANCE';
export type DocumentSortKey = 'updatedAt' | 'expiresAt' | 'title';

export interface DocumentQuery {
  readonly search: string;
  readonly classification: DocumentClassification | null;
  readonly lifecycle: DocumentLifecycle | null;
  readonly kind: DocumentKind | null;
  readonly sort: { readonly key: DocumentSortKey; readonly direction: 'asc' | 'desc' };
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Métadonnées uniquement. Aucun contenu, lien de stockage, URL de téléchargement,
 * empreinte, résultat antivirus ou donnée OCR n'entre dans la projection BO-023.
 */
export interface DocumentRegistryRow {
  readonly id: string;
  readonly demonstrationReference: string;
  readonly title: string;
  readonly kind: DocumentKind;
  readonly businessObjectLabel: string;
  readonly classification: DocumentClassification;
  readonly lifecycle: DocumentLifecycle;
  readonly versionLabel: string;
  readonly authorLabel: string;
  readonly updatedAt: string;
  readonly expiresAt: string | null;
  readonly retentionDisclosure: 'POLICY_NOT_CONFIGURED';
  readonly contentAvailable: false;
}

export interface DocumentRegistryPage {
  readonly rows: readonly DocumentRegistryRow[];
  readonly totalItems: number;
  readonly overview: {
    readonly total: number;
    readonly expiring: number;
    readonly expired: number;
    readonly restricted: number;
  };
}

export interface DocumentsGateway {
  search(query: DocumentQuery): Observable<DocumentRegistryPage>;
}

export const DOCUMENTS_GATEWAY = new InjectionToken<DocumentsGateway>('DOCUMENTS_GATEWAY');

export class DocumentAccessError extends Error {
  constructor() {
    super('Accès refusé à la bibliothèque documentaire');
    this.name = 'DocumentAccessError';
  }
}
