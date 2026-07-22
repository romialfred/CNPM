import { Injectable } from '@angular/core';
import { delay, of, throwError, type Observable } from 'rxjs';
import {
  MemberPaymentNotFoundError,
  type InitiateMemberPaymentInput,
  type MemberPaymentChannel,
  type MemberPaymentContributionOption,
  type MemberPaymentDetail,
  type MemberPaymentPage,
  type MemberPaymentQuery,
  type MemberPaymentsGateway,
  type PaymentInitiationResult,
  type PaymentOperator,
  type PrepareMemberPaymentDemoInput,
} from './member-payments-gateway';

/** Ce qui se produirait, par opérateur, une fois la passerelle branchée. */
const OPERATOR_NEXT_STEP: Readonly<
  Record<PaymentOperator, (input: InitiateMemberPaymentInput) => string>
> = {
  ORANGE_MONEY: (input) =>
    `Une demande de confirmation Orange Money serait envoyée au ${input.phone ?? 'numéro saisi'} ; vous la valideriez par votre code secret sur votre téléphone.`,
  MTN_MONEY: (input) =>
    `Un push USSD MTN MoMo serait envoyé au ${input.phone ?? 'numéro saisi'} pour approbation avant débit.`,
  WAVE: () =>
    'Vous seriez redirigé vers l’application Wave pour approuver le paiement, puis ramené automatiquement sur votre espace.',
  VISA: (input) =>
    `Votre carte se terminant par ${input.cardLast4 ?? '••••'} serait débitée après authentification 3-D Secure de votre banque.`,
};

const BLOCKED_STEPS = [
  {
    id: 'PREPARED',
    label: 'Aperçu préparé',
    detail: 'La demande est enregistrée sur votre espace membre.',
    state: 'current',
  },
  {
    id: 'PROVIDER',
    label: 'Transmission au canal',
    detail: 'En attente : le raccordement des canaux de paiement n’est pas encore actif.',
    state: 'blocked',
  },
  {
    id: 'RECONCILIATION',
    label: 'Rapprochement CNPM',
    detail: 'En attente du rapprochement bancaire par les services du CNPM.',
    state: 'blocked',
  },
  {
    id: 'CONFIRMATION',
    label: 'Confirmation CNPM',
    detail: 'En attente : le reçu sera émis après confirmation du CNPM.',
    state: 'blocked',
  },
] as const;

const CONTRIBUTIONS: readonly MemberPaymentContributionOption[] = [
  {
    id: 'demo-contribution-2026-01',
    reference: 'COT-2026-001',
    exercise: 2026,
    dueDate: '2026-09-30',
    outstandingAmountXof: 120000,
    currency: 'XOF',
  },
  {
    id: 'demo-contribution-2026-02',
    reference: 'COT-2026-002',
    exercise: 2026,
    dueDate: '2026-10-31',
    outstandingAmountXof: 95000,
    currency: 'XOF',
  },
  {
    id: 'demo-contribution-2025-01',
    reference: 'COT-2025-001',
    exercise: 2025,
    dueDate: '2025-06-30',
    outstandingAmountXof: 50000,
    currency: 'XOF',
  },
];

const DETAILS: readonly MemberPaymentDetail[] = [
  payment({
    id: 'demo-payment-prepared',
    reference: 'PAY-2026-0006',
    contributionId: 'demo-contribution-2026-01',
    contributionReference: 'COT-2026-001',
    amountXof: 120000,
    channel: 'MOBILE_MONEY_PREVIEW',
    status: 'PREPARED',
    createdAt: '2026-07-19T09:15:00Z',
    updatedAt: '2026-07-19T09:15:00Z',
    statusExplanation: 'Demande enregistrée. La transmission au canal reste à venir.',
  }),
  payment({
    id: 'demo-payment-processing',
    reference: 'PAY-2026-0005',
    contributionId: 'demo-contribution-2026-02',
    contributionReference: 'COT-2026-002',
    amountXof: 95000,
    channel: 'BANK_TRANSFER_PREVIEW',
    status: 'PROCESSING',
    createdAt: '2026-07-16T11:30:00Z',
    updatedAt: '2026-07-18T08:20:00Z',
    statusExplanation: 'En cours d’examen. Le virement correspondant n’est pas encore rapproché.',
  }),
  payment({
    id: 'demo-payment-review',
    reference: 'PAY-2026-0004',
    contributionId: 'demo-contribution-2025-01',
    contributionReference: 'COT-2025-001',
    amountXof: 50000,
    channel: 'CASH_DECLARATION_PREVIEW',
    status: 'NEEDS_REVIEW',
    createdAt: '2026-07-10T14:00:00Z',
    updatedAt: '2026-07-11T10:45:00Z',
    statusExplanation: 'Cette demande requiert une vérification manuelle.',
    failureExplanation:
      'La référence ne correspond à aucune opération rapprochée à ce jour.',
  }),
  payment({
    id: 'demo-payment-failed',
    reference: 'PAY-2026-0003',
    contributionId: 'demo-contribution-2026-01',
    contributionReference: 'COT-2026-001',
    amountXof: 60000,
    channel: 'MOBILE_MONEY_PREVIEW',
    status: 'FAILED',
    createdAt: '2026-07-06T09:25:00Z',
    updatedAt: '2026-07-06T09:25:00Z',
    statusExplanation: 'La demande a été interrompue avant transmission.',
    failureExplanation:
      'Aucun opérateur Mobile Money n’est configuré tant que DEC-002 reste ouverte.',
  }),
  payment({
    id: 'demo-payment-processing-2',
    reference: 'PAY-2026-0002',
    contributionId: 'demo-contribution-2026-02',
    contributionReference: 'COT-2026-002',
    amountXof: 47500,
    channel: 'BANK_TRANSFER_PREVIEW',
    status: 'PROCESSING',
    createdAt: '2026-07-03T16:10:00Z',
    updatedAt: '2026-07-04T07:50:00Z',
    statusExplanation: 'Règlement partiel en attente d’examen.',
  }),
  payment({
    id: 'demo-payment-prepared-2',
    reference: 'PAY-2026-0001',
    contributionId: 'demo-contribution-2025-01',
    contributionReference: 'COT-2025-001',
    amountXof: 25000,
    channel: 'CASH_DECLARATION_PREVIEW',
    status: 'PREPARED',
    createdAt: '2026-06-28T12:00:00Z',
    updatedAt: '2026-06-28T12:00:00Z',
    statusExplanation: 'Déclaration de caisse préparée, en attente de dépôt.',
  }),
];

interface DemoPaymentInput {
  readonly id: string;
  readonly reference: string;
  readonly contributionId: string;
  readonly contributionReference: string;
  readonly amountXof: number;
  readonly channel: MemberPaymentChannel;
  readonly status: MemberPaymentDetail['status'];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly statusExplanation: string;
  readonly failureExplanation?: string;
}

function payment(input: DemoPaymentInput): MemberPaymentDetail {
  return {
    ...input,
    currency: 'XOF',
    organizationLabel: 'Sahel Agro SA',
    officialConfirmation: false,
    receiptAvailable: false,
    lastCheckedAt: '2026-07-19T10:20:00Z',
    steps: BLOCKED_STEPS,
  };
}

@Injectable()
export class DemoMemberPaymentsGateway implements MemberPaymentsGateway {
  private createdDetail: MemberPaymentDetail | null = null;

  list(query: MemberPaymentQuery): Observable<MemberPaymentPage> {
    const needle = query.search?.trim().toLocaleLowerCase('fr') ?? '';
    const filtered = DETAILS.filter(
      (item) =>
        (!needle ||
          [item.reference, item.contributionReference]
            .join(' ')
            .toLocaleLowerCase('fr')
            .includes(needle)) &&
        (!query.status || item.status === query.status) &&
        (!query.channel || item.channel === query.channel),
    );
    const ordered = [...filtered].sort((left, right) => {
      const leftValue = this.sortValue(left, query);
      const rightValue = this.sortValue(right, query);
      const comparison = leftValue.localeCompare(rightValue, 'fr', { numeric: true });
      return query.direction === 'asc' ? comparison : -comparison;
    });
    const start = (query.page - 1) * query.size;
    const items = ordered.slice(start, start + query.size);
    return of({
      items,
      page: query.page,
      size: query.size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / query.size),
      summary: {
        displayedAmountXof: filtered.reduce((sum, item) => sum + item.amountXof, 0),
        processingCount: filtered.filter((item) => item.status === 'PROCESSING').length,
        attentionCount: filtered.filter((item) =>
          ['NEEDS_REVIEW', 'FAILED'].includes(item.status),
        ).length,
      },
    }).pipe(delay(0));
  }

  listContributionOptions(): Observable<readonly MemberPaymentContributionOption[]> {
    return of(CONTRIBUTIONS).pipe(delay(0));
  }

  prepareDemo(input: PrepareMemberPaymentDemoInput): Observable<MemberPaymentDetail> {
    const contribution = CONTRIBUTIONS.find((item) => item.id === input.contributionId);
    if (!contribution) {
      return throwError(() => new MemberPaymentNotFoundError(input.contributionId));
    }
    this.createdDetail = payment({
        id: 'demo-payment-created',
        reference: 'PAY-2026-LOCAL',
        contributionId: contribution.id,
        contributionReference: contribution.reference,
        amountXof: contribution.outstandingAmountXof,
        channel: input.channel,
        status: 'PREPARED',
        createdAt: '2026-07-19T12:00:00Z',
        updatedAt: '2026-07-19T12:00:00Z',
        statusExplanation:
          'Demande enregistrée. La transmission au canal reste à venir.',
      });
    return of(this.createdDetail).pipe(delay(0));
  }

  initiatePayment(input: InitiateMemberPaymentInput): Observable<PaymentInitiationResult> {
    const contribution = CONTRIBUTIONS.find((item) => item.id === input.contributionId);
    if (!contribution) {
      return throwError(() => new MemberPaymentNotFoundError(input.contributionId));
    }
    // Parcours complet, mais AUCUN débit : la passerelle opérateur n'est pas branchée.
    // Latence simulée pour éprouver l'état « traitement en cours ».
    return of<PaymentInitiationResult>({
      outcome: 'GATEWAY_NOT_CONFIGURED',
      operator: input.operator,
      reference: 'PAY-2026-LOCAL',
      amountXof: contribution.outstandingAmountXof,
      contributionReference: contribution.reference,
      nextStep: OPERATOR_NEXT_STEP[input.operator](input),
    }).pipe(delay(1100));
  }

  loadStatus(id: string): Observable<MemberPaymentDetail> {
    if (id === 'demo-payment-created') {
      return this.createdDetail
        ? of(this.createdDetail).pipe(delay(0))
        : this.prepareDemo({
            contributionId: 'demo-contribution-2026-01',
            channel: 'MOBILE_MONEY_PREVIEW',
            simulationAcknowledged: true,
          });
    }
    const detail = DETAILS.find((item) => item.id === id);
    return detail
      ? of(detail).pipe(delay(0))
      : throwError(() => new MemberPaymentNotFoundError(id));
  }

  private sortValue(paymentItem: MemberPaymentDetail, query: MemberPaymentQuery): string {
    switch (query.sort) {
      case 'reference':
        return paymentItem.reference;
      case 'amountXof':
        return paymentItem.amountXof.toString().padStart(12, '0');
      case 'status':
        return paymentItem.status;
      default:
        return paymentItem.updatedAt;
    }
  }
}
