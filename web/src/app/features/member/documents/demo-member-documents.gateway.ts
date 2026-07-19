import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  MemberDocumentMetadata,
  MemberDocumentPage,
  MemberDocumentQuery,
  MemberDocumentsGateway,
} from './member-documents-gateway';

const DEMO_DOCUMENTS: readonly MemberDocumentMetadata[] = [
  documentMetadata(
    '0001',
    'Attestation d’adhésion 2026',
    'ATTESTATION',
    'Attestation',
    'Version 1',
    '2026-07-12',
    'CATALOGUED',
    'Document répertorié au catalogue documentaire.',
  ),
  documentMetadata(
    '0002',
    'Carte membre 2026',
    'MEMBER_CARD',
    'Carte membre',
    'Version 2',
    '2026-07-05',
    'PROCESSING',
    'Métadonnée en cours de traitement.',
  ),
  documentMetadata(
    '0003',
    'Attestation annuelle 2025',
    'ATTESTATION',
    'Attestation',
    'Version 1',
    '2025-12-18',
    'EXPIRED',
    'Échéance dépassée : document à renouveler.',
  ),
  documentMetadata(
    '0004',
    'Carte membre 2025',
    'MEMBER_CARD',
    'Carte membre',
    'Version 1',
    '2025-06-25',
    'EXPIRED',
    'Échéance dépassée : document à renouveler.',
  ),
  documentMetadata(
    '0005',
    'Attestation d’adhésion 2024',
    'ATTESTATION',
    'Attestation',
    'Version 3',
    '2024-11-08',
    'CATALOGUED',
    'Document répertorié au catalogue documentaire.',
  ),
  documentMetadata(
    '0006',
    'Carte membre 2024',
    'MEMBER_CARD',
    'Carte membre',
    'Version 1',
    '2024-03-14',
    'CATALOGUED',
    'Document répertorié au catalogue documentaire.',
  ),
];

@Injectable()
export class DemoMemberDocumentsGateway implements MemberDocumentsGateway {
  list(query: MemberDocumentQuery): Observable<MemberDocumentPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const filtered = DEMO_DOCUMENTS.filter(
      (document) =>
        (!term ||
          [document.reference, document.title, document.typeLabel, document.versionLabel].some(
            (value) => value.toLocaleLowerCase('fr').includes(term),
          )) &&
        (!query.type || document.type === query.type) &&
        (!query.status || document.status === query.status),
    );
    const ordered = [...filtered].sort((left, right) => {
      const comparison = sortValue(left, query).localeCompare(sortValue(right, query), 'fr');
      return query.direction === 'asc' ? comparison : -comparison;
    });
    const start = (query.page - 1) * query.size;

    return of({
      items: ordered.slice(start, start + query.size),
      page: query.page,
      size: query.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / query.size),
    }).pipe(delay(0));
  }
}

function documentMetadata(
  suffix: string,
  title: string,
  type: MemberDocumentMetadata['type'],
  typeLabel: string,
  versionLabel: string,
  metadataRecordedOn: string,
  status: MemberDocumentMetadata['status'],
  availabilityDisclosure: string,
): MemberDocumentMetadata {
  return {
    id: `document-${suffix}`,
    reference: `CNPM-DOC-${suffix}`,
    title,
    type,
    typeLabel,
    versionLabel,
    metadataRecordedOn,
    status,
    availabilityDisclosure,
  };
}

function sortValue(document: MemberDocumentMetadata, query: MemberDocumentQuery): string {
  switch (query.sort) {
    case 'reference':
      return document.reference;
    case 'title':
      return document.title;
    default:
      return document.metadataRecordedOn;
  }
}
