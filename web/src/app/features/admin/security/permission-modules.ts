/**
 * Modèle d'octroi des droits par MODULE du sidebar (refonte RBAC, périmètre TDR).
 *
 * <p>Les 66 codes de permission du backend ne changent pas (ils sont câblés dans les
 * `@PreAuthorize`). On les REGROUPE ici sous les 6 modules du sidebar, avec deux niveaux —
 * `read` (Lecture) et `write` (Écriture / modifier / supprimer). Le niveau « Tous » d'un
 * module est l'union des deux : un simple confort d'octroi, pas un code supplémentaire.
 *
 * La grille de l'écran Sécurité s'appuie sur ce mapping : basculer une cellule accorde ou
 * retire, pour le rôle sélectionné, TOUS les codes du groupe (via `setPermissionGrant`).
 */

export type PermissionLevel = 'read' | 'write';

export interface PermissionModule {
  readonly key: string;
  readonly label: string;
  /** Codes de permission accordés par le niveau « Lecture ». */
  readonly read: readonly string[];
  /** Codes accordés par le niveau « Écriture / modifier / supprimer ». */
  readonly write: readonly string[];
}

export const PERMISSION_MODULES: readonly PermissionModule[] = [
  {
    key: 'members',
    label: 'Gestion des membres (Répertoire)',
    read: ['MEMBER.READ', 'GROUP.READ'],
    write: [
      'MEMBER.WRITE',
      'MEMBER.SENSITIVE.WRITE',
      'MEMBER.EXPORT',
      'GROUP.WRITE',
      'ENROLLMENT.CREATE',
      'ENROLLMENT.REVIEW',
      'ENROLLMENT.APPROVE',
    ],
  },
  {
    key: 'contributions',
    label: 'Cotisation et Recouvrement',
    read: ['CONTRIBUTION.READ', 'PAYMENT.READ', 'RECEIPT.READ', 'INCENTIVE.READ'],
    write: [
      'CONTRIBUTION.GENERATE',
      'CONTRIBUTION.ADJUST',
      'CONTRIBUTION.RULE.WRITE',
      'CONTRIBUTION.RULE.APPROVE',
      'PAYMENT.RECORD',
      'PAYMENT.CONFIRM',
      'PAYMENT.CANCEL',
      'RECEIPT.ISSUE',
      'RECEIPT.CANCEL',
      'RECONCILIATION.RUN',
      'RECONCILIATION.APPROVE',
      'RECONCILIATION.OVERRIDE',
      'INCENTIVE.CALCULATE',
      'INCENTIVE.APPROVE',
      'INCENTIVE.RULE.WRITE',
    ],
  },
  {
    key: 'recovery',
    label: 'Relance',
    read: ['RECOVERY.READ'],
    write: ['RECOVERY.CAMPAIGN.WRITE', 'RECOVERY.ACTION.WRITE', 'RECOVERY.EXPORT'],
  },
  {
    key: 'supervision',
    label: 'Supervision',
    read: ['REPORT.EXECUTIVE.READ', 'AUDIT.READ', 'OPS.MONITOR.READ'],
    write: [
      'REPORT.DESIGN',
      'REPORT.EXPORT',
      'AUDIT.EXPORT',
      'INTEGRATION.CONFIG.WRITE',
      'INTEGRATION.REPLAY',
      'OPS.DEPLOY',
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    read: ['IAM.USER.READ', 'IAM.ACCESS.REVIEW', 'DOCUMENT.READ'],
    write: [
      'IAM.USER.WRITE',
      'IAM.ROLE.ASSIGN',
      'IAM.MFA.RESET',
      'DOCUMENT.WRITE',
      'DOCUMENT.SENSITIVE.READ',
    ],
  },
  {
    key: 'settings',
    label: 'Paramètres (Données de référence)',
    read: ['ADMIN.PARAMETER.READ', 'ADMIN.REFERENTIAL.READ'],
    write: [
      'ADMIN.PARAMETER.WRITE',
      'ADMIN.REFERENTIAL.WRITE',
      'ADMIN.REFERENTIAL.APPROVE',
      'DATA.EXPORT.ALL',
      'DATA.RESTORE',
      'NOTIFICATION.SEND',
      'NOTIFICATION.TEMPLATE.WRITE',
      'GOVERNANCE.WRITE',
      'EVENT.WRITE',
    ],
  },
];

/** Codes d'un module pour un niveau donné (« Tous » = read ∪ write). */
export function moduleCodes(
  module: PermissionModule,
  level: PermissionLevel | 'all',
): readonly string[] {
  if (level === 'read') {
    return module.read;
  }
  if (level === 'write') {
    return module.write;
  }
  return [...module.read, ...module.write];
}
