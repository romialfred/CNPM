import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type { MemberUserStatus } from './member-users-gateway';

export function memberUserStatusLabel(status: MemberUserStatus): string {
  return status === 'ACTIVE_DEMO' ? 'Actif — démonstration' : 'Inactif — scénario';
}

export function memberUserStatusTone(status: MemberUserStatus): CnpmBadgeTone {
  return status === 'ACTIVE_DEMO' ? 'success' : 'neutral';
}
