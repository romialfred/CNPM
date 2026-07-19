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
    'Attestation d’adhésion — scénario 2026',
    'ATTESTATION',
    'Attestation fictive',
    'Version de démonstration 1',
    '2026-07-12',
    'CATALOGUED',
    'Métadonnées consultatives uniquement. Aucun fichier ni preuve officielle n’est disponible.',
  ),
  documentMetadata(
    '0002',
    'Carte membre — aperçu de catalogue',
    'MEMBER_CARD',
    'Carte membre fictive',
    'Version de démonstration 2',
    '2026-07-05',
    'PROCESSING',
    'Traitement fictif de la métadonnée. Aucun document n’est généré ou analysé.',
  ),
  documentMetadata(
    '0003',
    'Attestation annuelle — scénario 2025',
    'ATTESTATION',
    'Attestation fictive',
    'Version de démonstration 1',
    '2025-12-18',
    'EXPIRED',
    'Échéance fictive dépassée. Aucun renouvellement ni alerte réelle n’est déclenché.',
  ),
  documentMetadata(
    '0004',
    'Carte membre — scénario 2025',
    'MEMBER_CARD',
    'Carte membre fictive',
    'Version de démonstration 1',
    '2025-06-25',
    'EXPIRED',
    'Échéance fictive dépassée. Aucun renouvellement ni alerte réelle n’est déclenché.',
  ),
  documentMetadata(
    '0005',
    'Attestation d’adhésion — scénario 2024',
    'ATTESTATION',
    'Attestation fictive',
    'Version de démonstration 3',
    '2024-11-08',
    'CATALOGUED',
    'Métadonnées consultatives uniquement. Aucun fichier ni preuve officielle n’est disponible.',
  ),
  documentMetadata(
    '0006',
    'Carte membre — métadonnée de test',
    'MEMBER_CARD',
    'Carte membre fictive',
    'Version de démonstration 1',
    '2024-03-14',
    'CATALOGUED',
    'Métadonnées consultatives uniquement. Aucun fichier ni preuve officielle n’est disponible.',
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
    id: `demo-document-${suffix}`,
    reference: `DEMO-DOC-${suffix}`,
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
