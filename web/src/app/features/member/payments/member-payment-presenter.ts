import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type {
  MemberPaymentChannel,
  MemberPaymentStatus,
} from './member-payments-gateway';

const STATUS_LABELS: Readonly<Record<MemberPaymentStatus, string>> = {
  PREPARED: 'Préparé',
  PROCESSING: 'En cours d’examen',
  NEEDS_REVIEW: 'À examiner',
  FAILED: 'Demande interrompue',
};

const STATUS_TONES: Readonly<Record<MemberPaymentStatus, CnpmBadgeTone>> = {
  PREPARED: 'neutral',
  PROCESSING: 'info',
  NEEDS_REVIEW: 'warning',
  FAILED: 'error',
};

const CHANNEL_LABELS: Readonly<Record<MemberPaymentChannel, string>> = {
  MOBILE_MONEY_PREVIEW: 'Mobile Money — raccordement à venir',
  BANK_TRANSFER_PREVIEW: 'Virement bancaire — raccordement à venir',
  CASH_DECLARATION_PREVIEW: 'Déclaration de caisse',
};

export function memberPaymentStatusLabel(status: MemberPaymentStatus): string {
  return STATUS_LABELS[status];
}

export function memberPaymentStatusTone(status: MemberPaymentStatus): CnpmBadgeTone {
  return STATUS_TONES[status];
}

export function memberPaymentChannelLabel(channel: MemberPaymentChannel): string {
  return CHANNEL_LABELS[channel];
}
