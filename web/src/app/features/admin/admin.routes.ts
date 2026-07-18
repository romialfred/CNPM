import type { Routes } from '@angular/router';
import { DemoSessionGateway } from '../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../layout/admin-shell/session-gateway';
import { CONTRIBUTIONS_GATEWAY } from './contributions/contributions-gateway';
import { DemoContributionsGateway } from './contributions/demo-contributions.gateway';
import { DASHBOARD_GATEWAY } from './dashboard/dashboard-gateway';
import { DemoDashboardGateway } from './dashboard/demo-dashboard.gateway';
import { DemoEnrollmentGateway } from './enrollment-form/demo-enrollment.gateway';
import { ENROLLMENT_GATEWAY } from './enrollment-form/enrollment-gateway';
import { pendingEnrollmentChangesGuard } from './enrollment-form/pending-enrollment-changes.guard';
import { DemoMemberDetailGateway } from './member-detail/demo-member-detail.gateway';
import { MEMBER_DETAIL_GATEWAY } from './member-detail/member-detail-gateway';
import { DemoMembersGateway } from './members/demo-members.gateway';
import { MEMBERS_GATEWAY } from './members/members-gateway';
import { DemoPaymentsGateway } from './payments/demo-payments.gateway';
import { PAYMENTS_GATEWAY } from './payments/payments-gateway';
import { DemoRecoveryGateway } from './recovery/demo-recovery.gateway';
import { RECOVERY_GATEWAY } from './recovery/recovery-gateway';
import { DemoReportingGateway } from './reporting/demo-reporting.gateway';
import { REPORTING_GATEWAY } from './reporting/reporting-gateway';
import { ADMIN_SECURITY_GATEWAY } from './security/admin-security-gateway';
import { DemoAdminSecurityGateway } from './security/demo-admin-security.gateway';

/**
 * Routes d'administration, chargées à la demande.
 *
 * Les ports sont fournis ici avec leurs adaptateurs de démonstration. Les remplacer
 * par les adaptateurs HTTP réels ne touchera que ce point d'assemblage — aucune page.
 *
 * Aucun garde de route n'est posé : la permission se vérifie côté backend, et un
 * garde côté navigateur ne protégerait rien. Il améliorera l'expérience une fois la
 * session réelle câblée (ADR-008), sans jamais s'y substituer.
 */
export const adminRoutes: Routes = [
  {
    path: 'admin',
    providers: [
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: MEMBERS_GATEWAY, useClass: DemoMembersGateway },
      { provide: DASHBOARD_GATEWAY, useClass: DemoDashboardGateway },
      { provide: MEMBER_DETAIL_GATEWAY, useClass: DemoMemberDetailGateway },
      { provide: ENROLLMENT_GATEWAY, useClass: DemoEnrollmentGateway },
      { provide: CONTRIBUTIONS_GATEWAY, useClass: DemoContributionsGateway },
      { provide: PAYMENTS_GATEWAY, useClass: DemoPaymentsGateway },
      { provide: RECOVERY_GATEWAY, useClass: DemoRecoveryGateway },
      { provide: REPORTING_GATEWAY, useClass: DemoReportingGateway },
      { provide: ADMIN_SECURITY_GATEWAY, useClass: DemoAdminSecurityGateway },
    ],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
        title: 'Tableau de bord — Administration CNPM',
      },
      {
        path: 'members',
        loadComponent: () => import('./members/members.page').then((m) => m.MembersPage),
        title: 'Membres — Administration CNPM',
      },
      {
        // Chemin fixe déclaré avant la route paramétrée du même segment.
        path: 'enrollments/new',
        canDeactivate: [pendingEnrollmentChangesGuard],
        loadComponent: () =>
          import('./enrollment-form/enrollment-form.page').then((m) => m.EnrollmentFormPage),
        title: 'Nouvel enrôlement — Administration CNPM',
      },
      {
        path: 'members/:id',
        loadComponent: () =>
          import('./member-detail/member-detail.page').then((m) => m.MemberDetailPage),
        title: 'Fiche membre — Administration CNPM',
      },
      {
        path: 'contributions',
        loadComponent: () =>
          import('./contributions/contributions.page').then((m) => m.ContributionsPage),
        title: 'Cotisations — Administration CNPM',
      },
      {
        path: 'payments/reconciliation',
        loadComponent: () =>
          import('./payments/payments-reconciliation.page').then(
            (m) => m.PaymentsReconciliationPage,
          ),
        title: 'Rapprochement des paiements — Administration CNPM',
      },
      {
        path: 'recovery/campaigns',
        loadComponent: () =>
          import('./recovery/recovery-campaigns.page').then((m) => m.RecoveryCampaignsPage),
        title: 'Campagnes de relance — Administration CNPM',
      },
      {
        path: 'reporting',
        loadComponent: () => import('./reporting/reporting.page').then((m) => m.ReportingPage),
        title: 'Reporting — Administration CNPM',
      },
      {
        path: 'security/users',
        loadComponent: () =>
          import('./security/admin-security.page').then((m) => m.AdminSecurityPage),
        title: 'Sécurité — Administration CNPM',
      },
      // Compatibilité des favoris et captures antérieurs à l'alignement sur
      // l'inventaire UI. Les nouveaux liens utilisent exclusivement les routes canoniques.
      { path: 'payments', pathMatch: 'full', redirectTo: 'payments/reconciliation' },
      { path: 'recovery', pathMatch: 'full', redirectTo: 'recovery/campaigns' },
      { path: 'security', pathMatch: 'full', redirectTo: 'security/users' },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
];
