import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { DemoSessionGateway } from '../../layout/admin-shell/demo-session.gateway';
import { HttpSessionGateway } from '../../layout/admin-shell/http-session.gateway';
import { SESSION_GATEWAY } from '../../layout/admin-shell/session-gateway';
import { CONTRIBUTIONS_GATEWAY } from './contributions/contributions-gateway';
import { DemoContributionsGateway } from './contributions/demo-contributions.gateway';
import { DASHBOARD_GATEWAY } from './dashboard/dashboard-gateway';
import { DemoDashboardGateway } from './dashboard/demo-dashboard.gateway';
import { DemoEnrollmentGateway } from './enrollment-form/demo-enrollment.gateway';
import { ENROLLMENT_GATEWAY } from './enrollment-form/enrollment-gateway';
import { pendingEnrollmentChangesGuard } from './enrollment-form/pending-enrollment-changes.guard';
import { DemoEnrollmentsGateway } from './enrollments/demo-enrollments.gateway';
import { ENROLLMENTS_GATEWAY } from './enrollments/enrollments-gateway';
import { HttpEnrollmentsGateway } from './enrollments/http-enrollments.gateway';
import { DemoGroupsGateway } from './groups/demo-groups.gateway';
import { groupReadGuard } from './groups/group-read.guard';
import { GROUPS_GATEWAY } from './groups/groups-gateway';
import { HttpGroupsGateway } from './groups/http-groups.gateway';
import { DemoMemberDetailGateway } from './member-detail/demo-member-detail.gateway';
import { MEMBER_DETAIL_GATEWAY } from './member-detail/member-detail-gateway';
import { DemoMemberEditGateway } from './member-edit/demo-member-edit.gateway';
import { HttpMemberEditGateway } from './member-edit/http-member-edit.gateway';
import { MEMBER_EDIT_GATEWAY } from './member-edit/member-edit-gateway';
import { pendingMemberEditChangesGuard } from './member-edit/pending-member-edit-changes.guard';
import { DemoMembersGateway } from './members/demo-members.gateway';
import { HttpMembersGateway } from './members/http-members.gateway';
import { MEMBERS_GATEWAY } from './members/members-gateway';
import { DemoOrganizationsGateway } from './organizations/demo-organizations.gateway';
import { HttpOrganizationsGateway } from './organizations/http-organizations.gateway';
import { ORGANIZATIONS_GATEWAY } from './organizations/organizations-gateway';
import { pendingOrganizationChangesGuard } from './organizations/pending-organization-changes.guard';
import { DemoPaymentsGateway } from './payments/demo-payments.gateway';
import { PAYMENTS_GATEWAY } from './payments/payments-gateway';
import { DemoRecoveryGateway } from './recovery/demo-recovery.gateway';
import { RECOVERY_GATEWAY } from './recovery/recovery-gateway';
import { DemoReportingGateway } from './reporting/demo-reporting.gateway';
import { REPORTING_GATEWAY } from './reporting/reporting-gateway';
import { ADMIN_SECURITY_GATEWAY } from './security/admin-security-gateway';
import { DemoAdminSecurityGateway } from './security/demo-admin-security.gateway';
import { adminSessionGuard } from './admin-session.guard';
import {
  UNAVAILABLE_ADMIN_SECURITY_GATEWAY,
  UNAVAILABLE_CONTRIBUTIONS_GATEWAY,
  UNAVAILABLE_DASHBOARD_GATEWAY,
  UNAVAILABLE_ENROLLMENT_GATEWAY,
  UNAVAILABLE_MEMBER_DETAIL_GATEWAY,
  UNAVAILABLE_PAYMENTS_GATEWAY,
  UNAVAILABLE_RECOVERY_GATEWAY,
  UNAVAILABLE_REPORTING_GATEWAY,
} from './unavailable-admin-gateways';

/**
 * Routes d'administration, chargées à la demande.
 *
 * Les ports sont composés ici selon `CNPM_DATA_MODE`. En HTTP, une feature non
 * raccordée devient explicitement indisponible et ne retombe jamais sur ses fixtures.
 *
 * Le garde de session améliore uniquement l'expérience en cas de 401. Il ne remplace
 * jamais la vérification des permissions et du périmètre côté backend (ADR-008).
 */
export const adminRoutes: Routes = [
  {
    path: '',
    providers: [
      DemoSessionGateway,
      HttpSessionGateway,
      {
        provide: SESSION_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoSessionGateway)
            : inject(HttpSessionGateway),
      },
      DemoMembersGateway,
      HttpMembersGateway,
      {
        provide: MEMBERS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMembersGateway)
            : inject(HttpMembersGateway),
      },
      DemoOrganizationsGateway,
      HttpOrganizationsGateway,
      {
        provide: ORGANIZATIONS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoOrganizationsGateway)
            : inject(HttpOrganizationsGateway),
      },
      DemoGroupsGateway,
      HttpGroupsGateway,
      {
        provide: GROUPS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo' ? inject(DemoGroupsGateway) : inject(HttpGroupsGateway),
      },
      {
        provide: DASHBOARD_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoDashboardGateway)
            : UNAVAILABLE_DASHBOARD_GATEWAY,
      },
      {
        provide: MEMBER_DETAIL_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberDetailGateway)
            : UNAVAILABLE_MEMBER_DETAIL_GATEWAY,
      },
      DemoMemberEditGateway,
      HttpMemberEditGateway,
      {
        provide: MEMBER_EDIT_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberEditGateway)
            : inject(HttpMemberEditGateway),
      },
      {
        provide: ENROLLMENT_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoEnrollmentGateway)
            : UNAVAILABLE_ENROLLMENT_GATEWAY,
      },
      DemoEnrollmentsGateway,
      HttpEnrollmentsGateway,
      {
        provide: ENROLLMENTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoEnrollmentsGateway)
            : inject(HttpEnrollmentsGateway),
      },
      {
        provide: CONTRIBUTIONS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoContributionsGateway)
            : UNAVAILABLE_CONTRIBUTIONS_GATEWAY,
      },
      {
        provide: PAYMENTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoPaymentsGateway)
            : UNAVAILABLE_PAYMENTS_GATEWAY,
      },
      {
        provide: RECOVERY_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoRecoveryGateway)
            : UNAVAILABLE_RECOVERY_GATEWAY,
      },
      {
        provide: REPORTING_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoReportingGateway)
            : UNAVAILABLE_REPORTING_GATEWAY,
      },
      {
        provide: ADMIN_SECURITY_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoAdminSecurityGateway)
            : UNAVAILABLE_ADMIN_SECURITY_GATEWAY,
      },
      DemoDashboardGateway,
      DemoMemberDetailGateway,
      DemoEnrollmentGateway,
      DemoContributionsGateway,
      DemoPaymentsGateway,
      DemoRecoveryGateway,
      DemoReportingGateway,
      DemoAdminSecurityGateway,
    ],
    canActivate: [adminSessionGuard],
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
        path: 'organizations',
        loadComponent: () =>
          import('./organizations/organizations.page').then((m) => m.OrganizationsPage),
        title: 'Entreprises — Administration CNPM',
      },
      {
        // La route d'édition précède la fiche paramétrée et ne propose aucune création.
        path: 'organizations/:id/edit',
        canDeactivate: [pendingOrganizationChangesGuard],
        loadComponent: () =>
          import('./organizations/organization-edit.page').then((m) => m.OrganizationEditPage),
        title: 'Modifier une entreprise — Administration CNPM',
      },
      {
        path: 'organizations/:id',
        loadComponent: () =>
          import('./organizations/organization-detail.page').then((m) => m.OrganizationDetailPage),
        title: 'Fiche entreprise — Administration CNPM',
      },
      {
        path: 'groups',
        canActivate: [groupReadGuard],
        loadComponent: () => import('./groups/groups.page').then((m) => m.GroupsPage),
        title: 'Groupements professionnels — Administration CNPM',
      },
      {
        path: 'groups/:id',
        canActivate: [groupReadGuard],
        loadComponent: () => import('./groups/group-detail.page').then((m) => m.GroupDetailPage),
        title: 'Fiche groupement — Administration CNPM',
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('./enrollments/enrollments.page').then((m) => m.EnrollmentsPage),
        title: 'Enrôlements — Administration CNPM',
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
        path: 'enrollments/:id/review',
        loadComponent: () =>
          import('./enrollments/enrollment-review.page').then((m) => m.EnrollmentReviewPage),
        title: 'Validation d’un enrôlement — Administration CNPM',
      },
      {
        path: 'members/:id/edit',
        canDeactivate: [pendingMemberEditChangesGuard],
        loadComponent: () => import('./member-edit/member-edit.page').then((m) => m.MemberEditPage),
        title: 'Modifier un dossier membre — Administration CNPM',
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
