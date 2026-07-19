import { Injectable } from '@angular/core';
import { delay, of, throwError, type Observable } from 'rxjs';
import {
  MemberRequestNotFoundError,
  type AddMemberRequestMessageInput,
  type CreateMemberRequestInput,
  type MemberRequestDetail,
  type MemberRequestMessage,
  type MemberRequestPage,
  type MemberRequestQuery,
  type MemberRequestsGateway,
} from './member-requests-gateway';

const FIXED_CREATE_TIME = '2026-07-19T12:00:00Z';
const FIXED_CREATE_TARGET = '2026-07-26T16:00:00Z';

const INITIAL_REQUESTS: readonly MemberRequestDetail[] = [
  fixture(1, {
    reference: 'CNPM-REQ-MEMBRE-2026-0006',
    kind: 'REQUEST',
    category: 'DEMO_DOCUMENT',
    subject: 'Comprendre une pièce demandée dans le dossier',
    description:
      'Cette demande porte sur la pièce justificative à joindre au dossier.',
    status: 'WAITING_MEMBER',
    createdAt: '2026-07-18T09:20:00Z',
    updatedAt: '2026-07-19T08:45:00Z',
    targetAt: '2026-07-22T16:00:00Z',
    slaState: 'DUE_SOON',
    conversation: [
      message(
        'demo-message-1',
        'MEMBER',
        'Membre',
        'Bonjour, quelle pièce dois-je ajouter à ce dossier ?',
        '2026-07-18T09:20:00Z',
      ),
      message(
        'demo-message-2',
        'CNPM',
        'Équipe CNPM',
        'Merci. Une pièce justificative est demandée pour poursuivre le traitement.',
        '2026-07-19T08:45:00Z',
      ),
    ],
    requestedDocuments: [
      {
        id: 'demo-requested-document-1',
        label: 'Justificatif au format PDF',
        state: 'REQUESTED',
      },
    ],
  }),
  fixture(2, {
    reference: 'CNPM-REQ-MEMBRE-2026-0005',
    kind: 'REQUEST',
    category: 'DEMO_PORTAL',
    subject: 'Question sur l’accès au portail',
    description: 'Question concernant l’accès au portail membre.',
    status: 'IN_PROGRESS',
    createdAt: '2026-07-16T14:10:00Z',
    updatedAt: '2026-07-18T10:15:00Z',
    targetAt: '2026-07-25T16:00:00Z',
    slaState: 'ON_TRACK',
  }),
  fixture(3, {
    reference: 'CNPM-REC-MEMBRE-2026-0004',
    kind: 'CLAIM',
    category: 'DEMO_CLAIM',
    subject: 'Signaler un délai de traitement',
    description: 'Réclamation portant sur un délai de traitement dépassé.',
    status: 'IN_PROGRESS',
    createdAt: '2026-07-14T11:30:00Z',
    updatedAt: '2026-07-17T16:20:00Z',
    targetAt: '2026-07-17T12:00:00Z',
    slaState: 'OVERDUE',
  }),
  fixture(4, {
    reference: 'CNPM-REQ-MEMBRE-2026-0003',
    kind: 'REQUEST',
    category: 'DEMO_INFORMATION',
    subject: 'Demander une information',
    description: 'Demande d’information générale.',
    status: 'RESOLVED',
    createdAt: '2026-07-11T08:00:00Z',
    updatedAt: '2026-07-15T13:00:00Z',
    targetAt: null,
    slaState: 'NOT_APPLICABLE',
    conversation: [
      message(
        'demo-message-40',
        'MEMBER',
        'Membre',
        'Pouvez-vous préciser le fonctionnement de ce dispositif ?',
        '2026-07-11T08:00:00Z',
      ),
      message(
        'demo-message-41',
        'CNPM',
        'Équipe CNPM',
        'Une réponse a été apportée et le dossier peut être clôturé.',
        '2026-07-15T13:00:00Z',
      ),
    ],
  }),
  fixture(5, {
    reference: 'CNPM-REQ-MEMBRE-2026-0002',
    kind: 'REQUEST',
    category: 'DEMO_DOCUMENT',
    subject: 'Suivre un document transmis',
    description: 'Suivi d’une pièce justificative déclarée comme fournie.',
    status: 'CLOSED',
    createdAt: '2026-07-08T15:40:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
    targetAt: null,
    slaState: 'NOT_APPLICABLE',
    requestedDocuments: [
      {
        id: 'demo-requested-document-5',
        label: 'Pièce déclarée comme fournie',
        state: 'PROVIDED',
      },
    ],
  }),
  fixture(6, {
    reference: 'CNPM-REC-MEMBRE-2026-0001',
    kind: 'CLAIM',
    category: 'DEMO_CLAIM',
    subject: 'Retour sur une expérience de traitement',
    description: 'Ancienne réclamation clôturée.',
    status: 'CLOSED',
    createdAt: '2026-07-05T07:50:00Z',
    updatedAt: '2026-07-10T17:30:00Z',
    targetAt: null,
    slaState: 'NOT_APPLICABLE',
  }),
];

@Injectable()
export class DemoMemberRequestsGateway implements MemberRequestsGateway {
  private requests = INITIAL_REQUESTS.map(cloneDetail);
  private createSequence = INITIAL_REQUESTS.length;
  private messageSequence = 100;

  list(query: MemberRequestQuery): Observable<MemberRequestPage> {
    const term = query.search.trim().toLocaleLowerCase('fr');
    const filtered = this.requests
      .filter((request) => {
        const matchesTerm =
          !term ||
          [request.reference, request.subject].some((value) =>
            value.toLocaleLowerCase('fr').includes(term),
          );
        return (
          matchesTerm &&
          (!query.status || request.status === query.status) &&
          (!query.kind || request.kind === query.kind)
        );
      })
      .sort((left, right) => compareRequests(left, right, query));
    const start = (query.page - 1) * query.size;
    const items = filtered.slice(start, start + query.size).map(summary);

    return of({
      items,
      page: query.page,
      size: query.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / query.size),
    }).pipe(delay(0));
  }

  create(input: CreateMemberRequestInput): Observable<MemberRequestDetail> {
    this.createSequence += 1;
    const suffix = String(this.createSequence).padStart(4, '0');
    const detail: MemberRequestDetail = {
      id: `demo-member-request-created-${suffix}`,
      reference: `CNPM-${input.kind === 'CLAIM' ? 'REC' : 'REQ'}-MEMBRE-2026-${suffix}`,
      kind: input.kind,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: 'SUBMITTED',
      createdAt: FIXED_CREATE_TIME,
      updatedAt: FIXED_CREATE_TIME,
      targetAt: FIXED_CREATE_TARGET,
      slaState: 'ON_TRACK',
      conversation: [
        message(
          `demo-created-message-${suffix}`,
          'MEMBER',
          'Membre',
          input.description.trim(),
          FIXED_CREATE_TIME,
          input.attachments,
        ),
      ],
      requestedDocuments: [],
    };
    this.requests = [detail, ...this.requests];
    return of(cloneDetail(detail)).pipe(delay(0));
  }

  loadDetail(id: string): Observable<MemberRequestDetail> {
    const request = this.requests.find(
      (candidate) => candidate.id === id || candidate.reference === id,
    );
    return request
      ? of(cloneDetail(request)).pipe(delay(0))
      : throwError(() => new MemberRequestNotFoundError(id));
  }

  addMessage(id: string, input: AddMemberRequestMessageInput): Observable<MemberRequestDetail> {
    const index = this.requests.findIndex(
      (candidate) => candidate.id === id || candidate.reference === id,
    );
    if (index < 0) return throwError(() => new MemberRequestNotFoundError(id));

    this.messageSequence += 1;
    const createdAt = `2026-07-19T12:${String(this.messageSequence % 60).padStart(2, '0')}:00Z`;
    const current = this.requests[index];
    const updated: MemberRequestDetail = {
      ...current,
      updatedAt: createdAt,
      conversation: [
        ...current.conversation,
        message(
          `demo-member-message-${this.messageSequence}`,
          'MEMBER',
          'Membre',
          input.body.trim(),
          createdAt,
          input.attachments,
        ),
      ],
    };
    this.requests[index] = updated;
    return of(cloneDetail(updated)).pipe(delay(0));
  }
}

interface FixtureInput extends Omit<
  MemberRequestDetail,
  'id' | 'conversation' | 'requestedDocuments'
> {
  readonly conversation?: readonly MemberRequestMessage[];
  readonly requestedDocuments?: MemberRequestDetail['requestedDocuments'];
}

function fixture(index: number, input: FixtureInput): MemberRequestDetail {
  return {
    id: `demo-member-request-${index}`,
    ...input,
    conversation: input.conversation ?? [
      message(
        `demo-message-${index * 10}`,
        'MEMBER',
        'Membre',
        input.description,
        input.createdAt,
      ),
    ],
    requestedDocuments: input.requestedDocuments ?? [],
  };
}

function message(
  id: string,
  sender: MemberRequestMessage['sender'],
  authorLabel: string,
  body: string,
  createdAt: string,
  attachments: MemberRequestMessage['attachments'] = [],
): MemberRequestMessage {
  return {
    id,
    sender,
    authorLabel,
    body,
    createdAt,
    attachments: attachments.map((attachment) => ({ ...attachment })),
  };
}

function summary(detail: MemberRequestDetail) {
  return {
    id: detail.id,
    reference: detail.reference,
    kind: detail.kind,
    category: detail.category,
    subject: detail.subject,
    status: detail.status,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    targetAt: detail.targetAt,
    slaState: detail.slaState,
  };
}

function cloneDetail(detail: MemberRequestDetail): MemberRequestDetail {
  return {
    ...detail,
    conversation: detail.conversation.map((entry) => ({
      ...entry,
      attachments: entry.attachments.map((attachment) => ({ ...attachment })),
    })),
    requestedDocuments: detail.requestedDocuments.map((document) => ({ ...document })),
  };
}

function compareRequests(
  left: MemberRequestDetail,
  right: MemberRequestDetail,
  query: MemberRequestQuery,
): number {
  const leftValue = left[query.sort] ?? '9999-12-31T23:59:59Z';
  const rightValue = right[query.sort] ?? '9999-12-31T23:59:59Z';
  const comparison = leftValue.localeCompare(rightValue);
  return query.direction === 'asc' ? comparison : -comparison;
}
