import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type { MemberContributionStatus } from './member-contributions-gateway';

const LABELS: Readonly<Record<MemberContributionStatus, string>> = {
  A_ECHOIR: 'À échoir',
  EN_RETARD: 'En retard',
  PARTIELLE: 'Partiellement réglée',
  REGLEE: 'Réglée',
};

const TONES: Readonly<Record<MemberContributionStatus, CnpmBadgeTone>> = {
  A_ECHOIR: 'info',
  EN_RETARD: 'error',
  PARTIELLE: 'warning',
  REGLEE: 'success',
};

export function contributionStatusLabel(status: MemberContributionStatus): string {
  return LABELS[status];
}

export function contributionStatusTone(status: MemberContributionStatus): CnpmBadgeTone {
  return TONES[status];
}
