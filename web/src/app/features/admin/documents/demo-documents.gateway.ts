import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  DocumentQuery,
  DocumentRegistryPage,
  DocumentRegistryRow,
  DocumentsGateway,
} from './documents-gateway';

const ROWS: readonly DocumentRegistryRow[] = [
  row(
    12,
    'Attestation d’adhésion',
    'MEMBERSHIP',
    'Membre 2026-0012',
    'CONFIDENTIAL',
    'CURRENT',
    '2026-07-18T09:15:00Z',
    null,
  ),
  row(
    11,
    'Pièce entreprise — scénario',
    'ORGANIZATION',
    'Entreprise 2026-0011',
    'RESTRICTED',
    'EXPIRING',
    '2026-07-17T14:20:00Z',
    '2026-08-15T00:00:00Z',
  ),
  row(
    10,
    'Justificatif de paiement',
    'PAYMENT_SUPPORT',
    'Paiement 2026-0010',
    'CONFIDENTIAL',
    'CURRENT',
    '2026-07-16T08:40:00Z',
    null,
  ),
  row(
    9,
    'Procès-verbal de test',
    'GOVERNANCE',
    'Réunion 2026-0009',
    'INTERNAL',
    'ARCHIVED',
    '2026-07-15T16:05:00Z',
    null,
  ),
  row(
    8,
    'Pièce d’identité',
    'MEMBERSHIP',
    'Membre 2026-0008',
    'RESTRICTED',
    'EXPIRED',
    '2026-07-13T11:30:00Z',
    '2026-07-01T00:00:00Z',
  ),
  row(
    7,
    'RCCM sans format normatif',
    'ORGANIZATION',
    'Entreprise 2026-0007',
    'CONFIDENTIAL',
    'CURRENT',
    '2026-07-11T13:45:00Z',
    null,
  ),
  row(
    6,
    'Bordereau de versement',
    'PAYMENT_SUPPORT',
    'Paiement 2026-0006',
    'CONFIDENTIAL',
    'CURRENT',
    '2026-07-09T10:10:00Z',
    null,
  ),
  row(
    5,
    'Mandat interne',
    'GOVERNANCE',
    'Commission 2026-0005',
    'INTERNAL',
    'EXPIRING',
    '2026-07-08T17:00:00Z',
    '2026-08-01T00:00:00Z',
  ),
  row(
    4,
    'Formulaire membre — prototype',
    'MEMBERSHIP',
    'Membre 2026-0004',
    'CONFIDENTIAL',
    'ARCHIVED',
    '2026-07-05T09:25:00Z',
    null,
  ),
  row(
    3,
    'Statuts entreprise',
    'ORGANIZATION',
    'Entreprise 2026-0003',
    'RESTRICTED',
    'CURRENT',
    '2026-07-03T15:50:00Z',
    null,
  ),
  row(
    2,
    'Annexe de paiement',
    'PAYMENT_SUPPORT',
    'Paiement 2026-0002',
    'CONFIDENTIAL',
    'EXPIRED',
    '2026-06-28T12:00:00Z',
    '2026-06-30T00:00:00Z',
  ),
  row(
    1,
    'Compte rendu interne de test',
    'GOVERNANCE',
    'Réunion 2026-0001',
    'INTERNAL',
    'CURRENT',
    '2026-06-25T08:00:00Z',
    null,
  ),
];

@Injectable()
export class DemoDocumentsGateway implements DocumentsGateway {
  search(query: DocumentQuery): Observable<DocumentRegistryPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const filtered = ROWS.filter((document) => {
      const matchesSearch =
        !term ||
        [document.demonstrationReference, document.title, document.businessObjectLabel].some(
          (value) => value.toLocaleLowerCase('fr').includes(term),
        );
      return (
        matchesSearch &&
        (!query.classification || document.classification === query.classification) &&
        (!query.lifecycle || document.lifecycle === query.lifecycle) &&
        (!query.kind || document.kind === query.kind)
      );
    }).sort((left, right) => compare(left, right, query));
    const start = (query.page - 1) * query.pageSize;

    return of({
      rows: filtered.slice(start, start + query.pageSize).map((item) => ({ ...item })),
      totalItems: filtered.length,
      overview: {
        total: filtered.length,
        expiring: filtered.filter((item) => item.lifecycle === 'EXPIRING').length,
        expired: filtered.filter((item) => item.lifecycle === 'EXPIRED').length,
        restricted: filtered.filter((item) => item.classification === 'RESTRICTED').length,
      },
    }).pipe(delay(80));
  }
}

function row(
  index: number,
  title: string,
  kind: DocumentRegistryRow['kind'],
  businessObjectLabel: string,
  classification: DocumentRegistryRow['classification'],
  lifecycle: DocumentRegistryRow['lifecycle'],
  updatedAt: string,
  expiresAt: string | null,
): DocumentRegistryRow {
  return {
    id: `70000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    demonstrationReference: `DOC-2026-${String(index).padStart(4, '0')}`,
    title,
    kind,
    businessObjectLabel,
    classification,
    lifecycle,
    versionLabel: `v${(index % 3) + 1}.0 — scénario`,
    authorLabel: `Agent ${String(index).padStart(2, '0')}`,
    updatedAt,
    expiresAt,
    retentionDisclosure: 'POLICY_NOT_CONFIGURED',
    contentAvailable: false,
  };
}

function compare(left: DocumentRegistryRow, right: DocumentRegistryRow, query: DocumentQuery) {
  const leftValue = left[query.sort.key] ?? '9999-12-31T23:59:59Z';
  const rightValue = right[query.sort.key] ?? '9999-12-31T23:59:59Z';
  const result = leftValue.localeCompare(rightValue);
  return query.sort.direction === 'asc' ? result : -result;
}
