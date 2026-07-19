import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type {
  MemberPaymentChannel,
  MemberPaymentStatus,
} from './member-payments-gateway';

const STATUS_LABELS: Readonly<Record<MemberPaymentStatus, string>> = {
  PREPARED: 'Préparé localement',
  PROCESSING: 'Scénario en examen',
  NEEDS_REVIEW: 'À examiner',
  FAILED: 'Simulation interrompue',
};

const STATUS_TONES: Readonly<Record<MemberPaymentStatus, CnpmBadgeTone>> = {
  PREPARED: 'neutral',
  PROCESSING: 'info',
  NEEDS_REVIEW: 'warning',
  FAILED: 'error',
};

const CHANNEL_LABELS: Readonly<Record<MemberPaymentChannel, string>> = {
  MOBILE_MONEY_PREVIEW: 'Aperçu Mobile Money non raccordé',
  BANK_TRANSFER_PREVIEW: 'Aperçu virement non raccordé',
  CASH_DECLARATION_PREVIEW: 'Déclaration de caisse fictive',
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
