import { Injectable } from '@angular/core';
import { type Observable, of } from 'rxjs';
import type { SessionGateway, SessionIdentity } from './session-gateway';

/**
 * Adaptateur de démonstration du port `SESSION_GATEWAY`.
 *
 * Identité du propriétaire de la plateforme pour la démonstration : profil à accès
 * complet portant l'intégralité du catalogue de permissions (66 permissions métier +
 * `SHOWCASE.MODERATION.READ`, front-only). Toutes les rubriques de navigation et tous
 * les écrans sont ainsi accessibles en mode démo, sans backend. L'adaptateur réel
 * (`GET /auth/me`) projette les permissions effectives du compte ; seul le point
 * d'assemblage des routes change.
 */
@Injectable()
export class DemoSessionGateway implements SessionGateway {
  readonly identity: Observable<SessionIdentity | null> = of({
    displayName: 'TIEGNAN Romuald',
    roleLabel: 'Propriétaire',
    exerciseLabel: '2024',
    notificationCount: 8,
    demoMode: true,
    permissions: [
      'ADMIN.PARAMETER.READ',
      'ADMIN.PARAMETER.WRITE',
      'ADMIN.REFERENTIAL.APPROVE',
      'ADMIN.REFERENTIAL.READ',
      'ADMIN.REFERENTIAL.WRITE',
      'AUDIT.EXPORT',
      'AUDIT.READ',
      'CONTRIBUTION.ADJUST',
      'CONTRIBUTION.GENERATE',
      'CONTRIBUTION.READ',
      'CONTRIBUTION.RULE.APPROVE',
      'CONTRIBUTION.RULE.WRITE',
      'DATA.EXPORT.ALL',
      'DATA.RESTORE',
      'DOCUMENT.READ',
      'DOCUMENT.SENSITIVE.READ',
      'DOCUMENT.WRITE',
      'ENROLLMENT.APPROVE',
      'ENROLLMENT.CREATE',
      'ENROLLMENT.REVIEW',
      'EVENT.WRITE',
      'GOVERNANCE.WRITE',
      'GROUP.READ',
      'GROUP.WRITE',
      'IAM.ACCESS.REVIEW',
      'IAM.MFA.RESET',
      'IAM.ROLE.ASSIGN',
      'IAM.USER.READ',
      'IAM.USER.WRITE',
      'INCENTIVE.APPROVE',
      'INCENTIVE.CALCULATE',
      'INCENTIVE.READ',
      'INCENTIVE.RULE.WRITE',
      'INTEGRATION.CONFIG.WRITE',
      'INTEGRATION.REPLAY',
      'MEMBER.EXPORT',
      'MEMBER.READ',
      'MEMBER.SENSITIVE.WRITE',
      'MEMBER.WRITE',
      'NOTIFICATION.SEND',
      'NOTIFICATION.TEMPLATE.WRITE',
      'OPS.DEPLOY',
      'OPS.MONITOR.READ',
      'PAYMENT.CANCEL',
      'PAYMENT.CONFIRM',
      'PAYMENT.READ',
      'PAYMENT.RECORD',
      'RECEIPT.CANCEL',
      'RECEIPT.ISSUE',
      'RECEIPT.READ',
      'RECONCILIATION.APPROVE',
      'RECONCILIATION.OVERRIDE',
      'RECONCILIATION.RUN',
      'RECOVERY.ACTION.WRITE',
      'RECOVERY.CAMPAIGN.WRITE',
      'RECOVERY.EXPORT',
      'RECOVERY.READ',
      'REPORT.DESIGN',
      'REPORT.EXECUTIVE.READ',
      'REPORT.EXPORT',
      'REPORT.OPERATIONAL.READ',
      'REQUEST.CLOSE',
      'REQUEST.READ',
      'REQUEST.WRITE',
      'SECURITY.EVENT.READ',
      'SECURITY.INCIDENT.WRITE',
      'SHOWCASE.MODERATION.READ',
    ],
  });
}
