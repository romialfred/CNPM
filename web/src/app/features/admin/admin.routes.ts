import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { DemoSessionGateway } from '../../layout/admin-shell/demo-session.gateway';
import { HttpSessionGateway } from '../../layout/admin-shell/http-session.gateway';
import { SESSION_GATEWAY } from '../../layout/admin-shell/session-gateway';
import { AUDIT_GATEWAY } from './audit/audit-gateway';
import { auditReadGuard } from './audit/audit-read.guard';
import { DemoAuditGateway } from './audit/demo-audit.gateway';
import { HttpAuditGateway } from './audit/http-audit.gateway';
import { CONTRIBUTIONS_GATEWAY } from './contributions/contributions-gateway';
import { CONTRIBUTION_CALL_GENERATION_GATEWAY } from './contributions/generation/contribution-call-generation-gateway';
import { contributionGenerateGuard } from './contributions/generation/contribution-generate.guard';
import { DemoContributionCallGenerationGateway } from './contributions/generation/demo-contribution-call-generation.gateway';
import { DemoContributionsGateway } from './contributions/demo-contributions.gateway';
import { DASHBOARD_GATEWAY } from './dashboard/dashboard-gateway';
import { DemoDashboardGateway } from './dashboard/demo-dashboard.gateway';
import { DemoDocumentsGateway } from './documents/demo-documents.gateway';
import { documentReadGuard } from './documents/document-read.guard';
import { DOCUMENTS_GATEWAY } from './documents/documents-gateway';
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
import { DemoIntegrationsGateway } from './integrations/demo-integrations.gateway';
import { INTEGRATIONS_GATEWAY } from './integrations/integrations-gateway';
import { integrationsReadGuard } from './integrations/integrations-read.guard';
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
import { organizationContactsReadGuard } from './organizations/contacts/organization-contacts-read.guard';
import { pendingOrganizationChangesGuard } from './organizations/pending-organization-changes.guard';
import { DemoPaymentsGateway } from './payments/demo-payments.gateway';
import { BANK_STATEMENT_IMPORT_GATEWAY } from './payments/import/bank-statement-import-gateway';
import { bankStatementImportGuard } from './payments/import/bank-statement-import.guard';
import { DemoBankStatementImportGateway } from './payments/import/demo-bank-statement-import.gateway';
import { PAYMENTS_GATEWAY } from './payments/payments-gateway';
import { DemoReceiptsGateway } from './receipts/demo-receipts.gateway';
import { receiptReadGuard } from './receipts/receipt-read.guard';
import { RECEIPTS_GATEWAY } from './receipts/receipts-gateway';
import { DemoRecoveryGateway } from './recovery/demo-recovery.gateway';
import { RECOVERY_GATEWAY } from './recovery/recovery-gateway';
import { DemoReportingGateway } from './reporting/demo-reporting.gateway';
import { REPORTING_GATEWAY } from './reporting/reporting-gateway';
import { DemoRequestsGateway } from './requests/demo-requests.gateway';
import { requestReadGuard } from './requests/request-read.guard';
import { REQUESTS_GATEWAY } from './requests/requests-gateway';
import { ADMIN_SECURITY_GATEWAY } from './security/admin-security-gateway';
import { DemoAdminSecurityGateway } from './security/demo-admin-security.gateway';
import { DemoSettingsGateway } from './settings/demo-settings.gateway';
import { HttpSettingsGateway } from './settings/http-settings.gateway';
import { pendingSettingsChangesGuard } from './settings/pending-settings-changes.guard';
import { SETTINGS_GATEWAY } from './settings/settings-gateway';
import { settingsReadGuard } from './settings/settings-read.guard';
import { DemoShowcaseModerationGateway } from './showcase-moderation/demo-showcase-moderation.gateway';
import {
  SHOWCASE_MODERATION_GATEWAY,
  UNAVAILABLE_SHOWCASE_MODERATION_GATEWAY,
} from './showcase-moderation/showcase-moderation-gateway';
import { adminSessionGuard } from './admin-session.guard';
import {
  UNAVAILABLE_ADMIN_SECURITY_GATEWAY,
  UNAVAILABLE_BANK_STATEMENT_IMPORT_GATEWAY,
  UNAVAILABLE_CONTRIBUTIONS_GATEWAY,
  UNAVAILABLE_CONTRIBUTION_CALL_GENERATION_GATEWAY,
  UNAVAILABLE_DASHBOARD_GATEWAY,
  UNAVAILABLE_DOCUMENTS_GATEWAY,
  UNAVAILABLE_ENROLLMENT_GATEWAY,
  UNAVAILABLE_INTEGRATIONS_GATEWAY,
  UNAVAILABLE_MEMBER_DETAIL_GATEWAY,
  UNAVAILABLE_PAYMENTS_GATEWAY,
  UNAVAILABLE_RECEIPTS_GATEWAY,
  UNAVAILABLE_RECOVERY_GATEWAY,
  UNAVAILABLE_REPORTING_GATEWAY,
  UNAVAILABLE_REQUESTS_GATEWAY,
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
      DemoAuditGateway,
      HttpAuditGateway,
      {
        provide: AUDIT_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo' ? inject(DemoAuditGateway) : inject(HttpAuditGateway),
      },
      DemoSettingsGateway,
      HttpSettingsGateway,
      {
        provide: SETTINGS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoSettingsGateway)
            : inject(HttpSettingsGateway),
      },
      {
        provide: DASHBOARD_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoDashboardGateway)
            : UNAVAILABLE_DASHBOARD_GATEWAY,
      },
      DemoContributionCallGenerationGateway,
      {
        provide: CONTRIBUTION_CALL_GENERATION_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoContributionCallGenerationGateway)
            : UNAVAILABLE_CONTRIBUTION_CALL_GENERATION_GATEWAY,
      },
      DemoBankStatementImportGateway,
      {
        provide: BANK_STATEMENT_IMPORT_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoBankStatementImportGateway)
            : UNAVAILABLE_BANK_STATEMENT_IMPORT_GATEWAY,
      },
      {
        provide: DOCUMENTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoDocumentsGateway)
            : UNAVAILABLE_DOCUMENTS_GATEWAY,
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
        provide: RECEIPTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoReceiptsGateway)
            : UNAVAILABLE_RECEIPTS_GATEWAY,
      },
      {
        provide: REPORTING_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoReportingGateway)
            : UNAVAILABLE_REPORTING_GATEWAY,
      },
      {
        provide: REQUESTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoRequestsGateway)
            : UNAVAILABLE_REQUESTS_GATEWAY,
      },
      DemoShowcaseModerationGateway,
      {
        provide: SHOWCASE_MODERATION_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoShowcaseModerationGateway)
            : UNAVAILABLE_SHOWCASE_MODERATION_GATEWAY,
      },
      {
        provide: ADMIN_SECURITY_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoAdminSecurityGateway)
            : UNAVAILABLE_ADMIN_SECURITY_GATEWAY,
      },
      {
        provide: INTEGRATIONS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoIntegrationsGateway)
            : UNAVAILABLE_INTEGRATIONS_GATEWAY,
      },
      DemoDashboardGateway,
      DemoDocumentsGateway,
      DemoMemberDetailGateway,
      DemoEnrollmentGateway,
      DemoContributionsGateway,
      DemoPaymentsGateway,
      DemoReceiptsGateway,
      DemoRecoveryGateway,
      DemoReportingGateway,
      DemoRequestsGateway,
      DemoAdminSecurityGateway,
      DemoIntegrationsGateway,
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
        path: 'organizations/:id/contacts',
        canActivate: [organizationContactsReadGuard],
        loadComponent: () =>
          import('./organizations/contacts/organization-contacts.page').then(
            (m) => m.OrganizationContactsPage,
          ),
        title: 'Contacts de l’entreprise — Administration CNPM',
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
        // Précède impérativement `contributions/:id` : sinon le segment littéral
        // « generation » est capté comme identifiant et rend l'écran introuvable.
        path: 'contributions/generation',
        canActivate: [contributionGenerateGuard],
        loadComponent: () =>
          import('./contributions/generation/contribution-call-generation.page').then(
            (m) => m.ContributionCallGenerationPage,
          ),
        title: 'Générer des appels de cotisation — Administration CNPM',
      },
      {
        path: 'contributions/:id',
        loadComponent: () =>
          import('./contributions/contribution-detail.page').then((m) => m.ContributionDetailPage),
        title: 'Détail d’une cotisation — Administration CNPM',
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
        path: 'payments/import',
        canActivate: [bankStatementImportGuard],
        loadComponent: () =>
          import('./payments/import/bank-statement-import.page').then(
            (m) => m.BankStatementImportPage,
          ),
        title: 'Import de relevé bancaire — Administration CNPM',
      },
      {
        path: 'receipts',
        canActivate: [receiptReadGuard],
        loadComponent: () => import('./receipts/receipts.page').then((m) => m.ReceiptsPage),
        title: 'Registre des reçus — Administration CNPM',
      },
      {
        path: 'recovery/campaigns/:id',
        loadComponent: () =>
          import('./recovery/recovery-campaign-detail.page').then(
            (m) => m.RecoveryCampaignDetailPage,
          ),
        title: 'Détail d’une campagne — Administration CNPM',
      },
      {
        path: 'recovery/campaigns',
        loadComponent: () =>
          import('./recovery/recovery-campaigns.page').then((m) => m.RecoveryCampaignsPage),
        title: 'Campagnes de relance — Administration CNPM',
      },
      {
        path: 'recovery/actions',
        loadComponent: () =>
          import('./recovery/actions/recovery-actions.page').then((m) => m.RecoveryActionsPage),
        title: 'File des actions de relance — Administration CNPM',
      },
      {
        path: 'recovery/portfolio',
        loadComponent: () =>
          import('./recovery/portfolio/recovery-portfolio.page').then(
            (m) => m.RecoveryPortfolioPage,
          ),
        title: 'Portefeuille agent de recouvrement — Administration CNPM',
      },
      {
        path: 'reporting',
        loadComponent: () => import('./reporting/reporting.page').then((m) => m.ReportingPage),
        title: 'Reporting — Administration CNPM',
      },
      {
        path: 'requests',
        canActivate: [requestReadGuard],
        loadComponent: () => import('./requests/requests.page').then((m) => m.RequestsPage),
        title: 'Requêtes et réclamations — Administration CNPM',
      },
      {
        path: 'requests/:id',
        canActivate: [requestReadGuard],
        loadComponent: () =>
          import('./requests/request-detail.page').then((m) => m.RequestDetailPage),
        title: 'Traitement d’un dossier — Administration CNPM',
      },
      {
        path: 'documents',
        canActivate: [documentReadGuard],
        loadComponent: () => import('./documents/documents.page').then((m) => m.DocumentsPage),
        title: 'GED et documents — Administration CNPM',
      },
      {
        path: 'showcases/moderation',
        loadComponent: () =>
          import('./showcase-moderation/showcase-moderation.page').then(
            (m) => m.ShowcaseModerationPage,
          ),
        title: 'Modération des vitrines membres — Administration CNPM',
      },
      {
        path: 'integrations',
        canActivate: [integrationsReadGuard],
        loadComponent: () =>
          import('./integrations/integrations.page').then((m) => m.IntegrationsPage),
        title: 'Supervision des intégrations — Administration CNPM',
      },
      {
        path: 'security/roles',
        data: { defaultTab: 'roles' },
        loadComponent: () =>
          import('./security/admin-security.page').then((m) => m.AdminSecurityPage),
        title: 'Rôles et permissions — Administration CNPM',
      },
      {
        path: 'security/users',
        loadComponent: () =>
          import('./security/admin-security.page').then((m) => m.AdminSecurityPage),
        title: 'Sécurité — Administration CNPM',
      },
      {
        // Création d'un compte : écran plein, hors modale (BO-030).
        path: 'security/accounts/new',
        loadComponent: () =>
          import('./security/new-account.page').then((m) => m.NewAccountPage),
        title: 'Nouveau compte — Administration CNPM',
      },
      {
        path: 'security/audit',
        canActivate: [auditReadGuard],
        loadComponent: () => import('./audit/audit.page').then((m) => m.AuditPage),
        title: 'Journal d’audit — Administration CNPM',
      },
      {
        path: 'settings',
        canActivate: [settingsReadGuard],
        canDeactivate: [pendingSettingsChangesGuard],
        loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
        title: 'Paramétrage fonctionnel — Administration CNPM',
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
