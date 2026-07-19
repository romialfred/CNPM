import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type { MemberReceiptStatus } from './member-receipts-gateway';

export function memberReceiptStatusLabel(status: MemberReceiptStatus): string {
  return status === 'DEMONSTRATION_AVAILABLE' ? 'Disponible' : 'Annulé';
}

export function memberReceiptStatusTone(status: MemberReceiptStatus): CnpmBadgeTone {
  return status === 'DEMONSTRATION_AVAILABLE' ? 'info' : 'warning';
}
