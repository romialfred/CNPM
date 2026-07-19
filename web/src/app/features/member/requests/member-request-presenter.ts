import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type {
  MemberRequestCategory,
  MemberRequestKind,
  MemberRequestSlaState,
  MemberRequestStatus,
} from './member-requests-gateway';

const STATUS_LABELS: Readonly<Record<MemberRequestStatus, string>> = {
  SUBMITTED: 'Soumise',
  IN_PROGRESS: 'En traitement',
  WAITING_MEMBER: 'Votre réponse est attendue',
  RESOLVED: 'Résolue',
  CLOSED: 'Clôturée',
};

const STATUS_TONES: Readonly<Record<MemberRequestStatus, CnpmBadgeTone>> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'info',
  WAITING_MEMBER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

const CATEGORY_LABELS: Readonly<Record<MemberRequestCategory, string>> = {
  DEMO_INFORMATION: 'Demande d’information',
  DEMO_DOCUMENT: 'Demande de document',
  DEMO_PORTAL: 'Assistance portail',
  DEMO_CLAIM: 'Réclamation',
};

export function memberRequestStatusLabel(status: MemberRequestStatus): string {
  return STATUS_LABELS[status];
}

export function memberRequestStatusTone(status: MemberRequestStatus): CnpmBadgeTone {
  return STATUS_TONES[status];
}

export function memberRequestKindLabel(kind: MemberRequestKind): string {
  return kind === 'CLAIM' ? 'Réclamation' : 'Requête';
}

export function memberRequestCategoryLabel(category: MemberRequestCategory): string {
  return CATEGORY_LABELS[category];
}

export function memberRequestSlaLabel(state: MemberRequestSlaState): string {
  const labels: Record<MemberRequestSlaState, string> = {
    ON_TRACK: 'Dans le délai',
    DUE_SOON: 'Échéance proche',
    OVERDUE: 'Délai dépassé',
    NOT_APPLICABLE: 'Sans délai cible',
  };
  return labels[state];
}

export function memberRequestSlaTone(state: MemberRequestSlaState): CnpmBadgeTone {
  if (state === 'OVERDUE') return 'error';
  if (state === 'DUE_SOON') return 'warning';
  if (state === 'ON_TRACK') return 'success';
  return 'neutral';
}
