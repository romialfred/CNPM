import { Injectable } from '@angular/core';
import { concatMap, delay, of, throwError, type Observable } from 'rxjs';
import {
  RequestAccessError,
  RequestNotFoundError,
  type RequestsGateway,
  type ServiceRequestDetail,
  type ServiceRequestPage,
  type ServiceRequestPriority,
  type ServiceRequestQuery,
  type ServiceRequestStatus,
  type ServiceRequestSummary,
} from './requests-gateway';

const DEMO_LATENCY_MS = 100;
export const DEMO_REQUEST_FORBIDDEN_ID = 'REQ-DEMO-INTERDIT';
export const DEMO_REQUEST_ERROR_ID = 'REQ-DEMO-ERREUR';

/**
 * Jeu fermé et 100 % fictif pour BO-021/022. Les échéances servent uniquement à
 * vérifier les états d'interface : elles ne constituent ni un SLA CNPM ni un délai
 * communiqué à un membre réel.
 */
const DEMO_REQUESTS: readonly ServiceRequestDetail[] = [
  request(1, {
    reference: 'REQ-2026-0012',
    subject: 'Comprendre une pièce demandée au dossier',
    requesterLabel: 'Atelier Kanu',
    categoryLabel: 'Dossier membre',
    serviceLabel: 'Accueil membres',
    priority: 'HIGH',
    status: 'WAITING_INTERNAL',
    submittedAt: '2026-07-18T09:20:00Z',
    targetAt: '2026-07-20T16:00:00Z',
    slaState: 'DUE_SOON',
    assigneeLabel: 'Agent support A',
    description: 'Le membre demande quelle pièce complète son dossier.',
    conversation: [
      memberMessage(
        1,
        'MEMBER',
        'Contact — Atelier Kanu',
        'Bonjour, pouvez-vous préciser la pièce attendue dans ce dossier ?',
        '2026-07-18T09:20:00Z',
      ),
      memberMessage(
        2,
        'AGENT',
        'Agent support A',
        'Votre demande est en cours de qualification.',
        '2026-07-18T10:05:00Z',
      ),
    ],
    internalNotes: [
      internalNote(
        1,
        'Agent support A',
        'Vérifier la qualification avant de préparer une réponse. Cette note reste strictement interne.',
        '2026-07-18T10:12:00Z',
      ),
    ],
  }),
  request(2, {
    reference: 'REC-2026-0011',
    subject: 'Signaler un délai dans un parcours',
    requesterLabel: 'Entreprise Sira',
    categoryLabel: 'Réclamation',
    serviceLabel: 'Qualité de service',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    submittedAt: '2026-07-17T14:40:00Z',
    targetAt: '2026-07-18T14:40:00Z',
    slaState: 'OVERDUE',
    assigneeLabel: 'Agent support B',
  }),
  request(3, {
    reference: 'REQ-2026-0010',
    subject: 'Demander une orientation sectorielle',
    requesterLabel: 'Coopérative Néma',
    categoryLabel: 'Orientation',
    serviceLabel: 'Accueil membres',
    priority: 'NORMAL',
    status: 'ASSIGNED',
    submittedAt: '2026-07-16T08:30:00Z',
    targetAt: '2026-07-23T16:00:00Z',
    slaState: 'ON_TRACK',
    assigneeLabel: 'Agent support A',
  }),
  request(4, {
    reference: 'REQ-2026-0009',
    subject: 'Compléter une information du dossier',
    requesterLabel: 'Maison Dô',
    categoryLabel: 'Mise à jour',
    serviceLabel: 'Gestion membres',
    priority: 'NORMAL',
    status: 'WAITING_MEMBER',
    submittedAt: '2026-07-15T11:15:00Z',
    targetAt: '2026-07-24T16:00:00Z',
    slaState: 'ON_TRACK',
    assigneeLabel: 'Agent support C',
  }),
  request(5, {
    reference: 'REQ-2026-0008',
    subject: 'Question sur un appel de cotisation',
    requesterLabel: 'Réseau Teriya',
    categoryLabel: 'Cotisation',
    serviceLabel: 'Cotisations',
    priority: 'HIGH',
    status: 'TRIAGED',
    submittedAt: '2026-07-14T13:00:00Z',
    targetAt: '2026-07-21T16:00:00Z',
    slaState: 'DUE_SOON',
    assigneeLabel: null,
  }),
  request(6, {
    reference: 'REQ-2026-0007',
    subject: 'Accès au portail',
    requesterLabel: 'Studio Bolo',
    categoryLabel: 'Accès',
    serviceLabel: 'Support numérique',
    priority: 'NORMAL',
    status: 'SUBMITTED',
    submittedAt: '2026-07-13T07:50:00Z',
    targetAt: '2026-07-25T16:00:00Z',
    slaState: 'ON_TRACK',
    assigneeLabel: null,
  }),
  request(7, {
    reference: 'REQ-2026-0006',
    subject: 'Réouverture d’un cas',
    requesterLabel: 'Collectif Wassa',
    categoryLabel: 'Suivi',
    serviceLabel: 'Qualité de service',
    priority: 'HIGH',
    status: 'REOPENED',
    submittedAt: '2026-07-12T16:10:00Z',
    targetAt: '2026-07-22T16:00:00Z',
    slaState: 'DUE_SOON',
    assigneeLabel: 'Agent support B',
  }),
  request(8, {
    reference: 'REQ-2026-0005',
    subject: 'Validation d’une réponse au membre',
    requesterLabel: 'Entreprise Lumo',
    categoryLabel: 'Information',
    serviceLabel: 'Accueil membres',
    priority: 'NORMAL',
    status: 'RESOLVED',
    submittedAt: '2026-07-11T10:30:00Z',
    targetAt: null,
    slaState: 'NOT_APPLICABLE',
    assigneeLabel: 'Agent support C',
    resolutionProofLabel: 'Réponse validée et transmise au membre',
  }),
  request(9, {
    reference: 'REC-2026-0004',
    subject: 'Retour sur un parcours',
    requesterLabel: 'Atelier Fôro',
    categoryLabel: 'Réclamation',
    serviceLabel: 'Qualité de service',
    priority: 'NORMAL',
    status: 'CLOSED',
    submittedAt: '2026-07-10T12:45:00Z',
    targetAt: null,
    slaState: 'NOT_APPLICABLE',
    assigneeLabel: 'Agent support A',
    resolutionProofLabel: 'Preuve associée au dossier clôturé',
  }),
  request(10, {
    reference: 'REQ-2026-0003',
    subject: 'Question de rattachement',
    requesterLabel: 'Société Kélé',
    categoryLabel: 'Rattachement',
    serviceLabel: 'Gestion membres',
    priority: 'NORMAL',
    status: 'IN_PROGRESS',
    submittedAt: '2026-07-09T09:05:00Z',
    targetAt: '2026-07-26T16:00:00Z',
    slaState: 'ON_TRACK',
    assigneeLabel: 'Agent support B',
  }),
  request(11, {
    reference: 'REQ-2026-0002',
    subject: 'Demande de complément',
    requesterLabel: 'Groupe Sanu',
    categoryLabel: 'Dossier membre',
    serviceLabel: 'Gestion membres',
    priority: 'HIGH',
    status: 'WAITING_MEMBER',
    submittedAt: '2026-07-08T15:20:00Z',
    targetAt: '2026-07-19T16:00:00Z',
    slaState: 'OVERDUE',
    assigneeLabel: 'Agent support C',
  }),
  request(12, {
    reference: 'REQ-2026-0001',
    subject: 'Premier dossier du registre',
    requesterLabel: 'Entreprise Dama',
    categoryLabel: 'Information',
    serviceLabel: 'Accueil membres',
    priority: 'NORMAL',
    status: 'CLOSED',
    submittedAt: '2026-07-07T08:00:00Z',
    targetAt: null,
    slaState: 'NOT_APPLICABLE',
    assigneeLabel: 'Agent support A',
    resolutionProofLabel: 'Réponse approuvée et tracée',
  }),
];

@Injectable()
export class DemoRequestsGateway implements RequestsGateway {
  search(query: ServiceRequestQuery): Observable<ServiceRequestPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const filtered = DEMO_REQUESTS.filter((row) => {
      const matchesSearch =
        !term ||
        [row.reference, row.subject, row.requesterLabel, row.categoryLabel].some((value) =>
          value.toLocaleLowerCase('fr').includes(term),
        );
      return (
        matchesSearch &&
        (!query.status || row.status === query.status) &&
        (!query.priority || row.priority === query.priority)
      );
    }).sort((left, right) => compareRows(left, right, query));

    const start = (query.page - 1) * query.pageSize;
    return of({
      rows: filtered.slice(start, start + query.pageSize).map(summary),
      totalItems: filtered.length,
    }).pipe(delay(DEMO_LATENCY_MS));
  }

  get(id: string): Observable<ServiceRequestDetail> {
    if (id === DEMO_REQUEST_FORBIDDEN_ID) return fail(new RequestAccessError());
    if (id === DEMO_REQUEST_ERROR_ID) return fail(new Error('Service de traitement indisponible'));
    const detail = DEMO_REQUESTS.find(
      (candidate) => candidate.id === id || candidate.reference === id,
    );
    return detail
      ? of(cloneDetail(detail)).pipe(delay(DEMO_LATENCY_MS))
      : fail(new RequestNotFoundError());
  }
}

interface RequestFixture {
  readonly reference: string;
  readonly subject: string;
  readonly requesterLabel: string;
  readonly categoryLabel: string;
  readonly serviceLabel: string;
  readonly priority: ServiceRequestPriority;
  readonly status: ServiceRequestStatus;
  readonly submittedAt: string;
  readonly targetAt: string | null;
  readonly slaState: ServiceRequestDetail['slaState'];
  readonly assigneeLabel: string | null;
  readonly description?: string;
  readonly conversation?: ServiceRequestDetail['memberConversation'];
  readonly internalNotes?: ServiceRequestDetail['internalNotes'];
  readonly resolutionProofLabel?: string | null;
}

function request(index: number, fixture: RequestFixture): ServiceRequestDetail {
  return {
    id: `70000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    ...fixture,
    description:
      fixture.description ??
      'Demande transmise au service concerné pour qualification et traitement.',
    confidentialityLabel: 'Interne CNPM',
    memberConversation: fixture.conversation ?? [
      memberMessage(
        index * 10,
        'MEMBER',
        'Contact membre',
        'Bonjour, je souhaite un retour sur cette demande.',
        fixture.submittedAt,
      ),
    ],
    internalNotes: fixture.internalNotes ?? [],
    attachments: {
      available: false,
      reason:
        'Pièces jointes indisponibles : le contrat GED, l’antivirus et les règles de conservation restent à arbitrer.',
    },
    resolutionProofLabel: fixture.resolutionProofLabel ?? null,
    notificationNotice:
      'Aucune notification n’est envoyée par ce scénario ; les fournisseurs SMS et courriel restent à décider.',
  };
}

function memberMessage(
  index: number,
  direction: 'MEMBER' | 'AGENT',
  authorLabel: string,
  body: string,
  createdAt: string,
) {
  return { id: `message-demo-${index}`, direction, authorLabel, body, createdAt } as const;
}

function internalNote(index: number, authorLabel: string, body: string, createdAt: string) {
  return { id: `note-demo-${index}`, authorLabel, body, createdAt } as const;
}

function summary(detail: ServiceRequestDetail): ServiceRequestSummary {
  return {
    id: detail.id,
    reference: detail.reference,
    subject: detail.subject,
    requesterLabel: detail.requesterLabel,
    categoryLabel: detail.categoryLabel,
    priority: detail.priority,
    status: detail.status,
    submittedAt: detail.submittedAt,
    targetAt: detail.targetAt,
    slaState: detail.slaState,
    assigneeLabel: detail.assigneeLabel,
  };
}

function cloneDetail(detail: ServiceRequestDetail): ServiceRequestDetail {
  return {
    ...detail,
    memberConversation: detail.memberConversation.map((message) => ({ ...message })),
    internalNotes: detail.internalNotes.map((note) => ({ ...note })),
    attachments: { ...detail.attachments },
  };
}

function compareRows(
  left: ServiceRequestDetail,
  right: ServiceRequestDetail,
  query: ServiceRequestQuery,
): number {
  const direction = query.sort.direction === 'asc' ? 1 : -1;
  if (query.sort.key === 'priority') {
    const order: Record<ServiceRequestPriority, number> = { NORMAL: 1, HIGH: 2, URGENT: 3 };
    return (order[left.priority] - order[right.priority]) * direction;
  }
  const leftValue = left[query.sort.key] ?? '9999-12-31T23:59:59Z';
  const rightValue = right[query.sort.key] ?? '9999-12-31T23:59:59Z';
  return leftValue.localeCompare(rightValue) * direction;
}

function fail(error: Error): Observable<never> {
  return of(null).pipe(
    delay(DEMO_LATENCY_MS),
    concatMap(() => throwError(() => error)),
  );
}
