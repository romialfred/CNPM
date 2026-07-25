import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type { MemberRequestStatus, MemberRequestType } from './member-requests-gateway';

/** Libellés et tons partagés par la liste et le détail — une seule source de vérité. */

export const REQUEST_TYPE_LABELS: Readonly<Record<MemberRequestType, string>> = {
  INFORMATION: 'Demande d’information',
  DOCUMENT: 'Demande de document',
  CLAIM: 'Réclamation',
  OTHER: 'Autre',
};

export const REQUEST_STATUS_LABELS: Readonly<Record<MemberRequestStatus, string>> = {
  SUBMITTED: 'Soumise',
  IN_PROGRESS: 'En cours',
  WAITING_MEMBER: 'En attente de votre réponse',
  RESOLVED: 'Résolue',
  CLOSED: 'Clôturée',
};

export const REQUEST_STATUS_TONES: Readonly<Record<MemberRequestStatus, CnpmBadgeTone>> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'info',
  WAITING_MEMBER: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};
