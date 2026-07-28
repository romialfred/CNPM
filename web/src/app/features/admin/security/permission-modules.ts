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
    key: 'repertoire',
    label: 'Répertoire',
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
    key: 'recouvrement',
    label: 'Cotisations et recouvrement',
    read: ['CONTRIBUTION.READ', 'PAYMENT.READ', 'RECEIPT.READ', 'INCENTIVE.READ', 'RECOVERY.READ'],
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
      'RECOVERY.CAMPAIGN.WRITE',
      'RECOVERY.ACTION.WRITE',
      'RECOVERY.EXPORT',
    ],
  },
  {
    key: 'relation',
    label: 'Relation membre',
    read: ['REQUEST.READ', 'DOCUMENT.READ'],
    write: ['REQUEST.WRITE', 'REQUEST.CLOSE', 'DOCUMENT.WRITE', 'DOCUMENT.SENSITIVE.READ'],
  },
  {
    key: 'supervision',
    label: 'Supervision',
    read: ['REPORT.EXECUTIVE.READ', 'REPORT.OPERATIONAL.READ', 'OPS.MONITOR.READ'],
    write: [
      'REPORT.DESIGN',
      'REPORT.EXPORT',
      'INTEGRATION.CONFIG.WRITE',
      'INTEGRATION.REPLAY',
      'OPS.DEPLOY',
    ],
  },
  {
    key: 'parametre',
    label: 'Paramètre',
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
  {
    key: 'administration',
    label: 'Administration',
    read: ['IAM.USER.READ', 'IAM.ACCESS.REVIEW', 'AUDIT.READ', 'SECURITY.EVENT.READ'],
    write: [
      'IAM.USER.WRITE',
      'IAM.ROLE.ASSIGN',
      'IAM.MFA.RESET',
      'AUDIT.EXPORT',
      'SECURITY.INCIDENT.WRITE',
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
