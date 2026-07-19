import type { CnpmBadgeTone } from '../../../design-system/badge/badge.component';
import type { MemberDocumentStatus, MemberDocumentType } from './member-documents-gateway';

export function memberDocumentStatusLabel(status: MemberDocumentStatus): string {
  switch (status) {
    case 'CATALOGUED':
      return 'Répertorié';
    case 'PROCESSING':
      return 'En traitement';
    case 'EXPIRED':
      return 'Expiré';
  }
}

export function memberDocumentStatusTone(status: MemberDocumentStatus): CnpmBadgeTone {
  switch (status) {
    case 'CATALOGUED':
      return 'info';
    case 'PROCESSING':
      return 'warning';
    case 'EXPIRED':
      return 'neutral';
  }
}

export function memberDocumentTypeLabel(type: MemberDocumentType): string {
  switch (type) {
    case 'ATTESTATION':
      return 'Attestation';
    case 'MEMBER_CARD':
      return 'Carte membre';
  }
}
