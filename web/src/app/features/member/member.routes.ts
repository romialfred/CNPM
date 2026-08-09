import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { DemoMemberContributionsGateway } from './contributions/demo-member-contributions.gateway';
import { HttpMemberContributionsGateway } from './contributions/http-member-contributions.gateway';
import { MEMBER_CONTRIBUTIONS_GATEWAY } from './contributions/member-contributions-gateway';
import { HttpMemberEventsGateway } from './cnpm/http-member-events.gateway';
import { MEMBER_EVENTS_GATEWAY } from './cnpm/member-events.gateway';
import { HttpMemberDirectoryGateway } from './directory/http-member-directory.gateway';
import { MEMBER_DIRECTORY_GATEWAY } from './directory/member-directory.gateway';
import { DemoMemberDocumentsGateway } from './documents/demo-member-documents.gateway';
import { MEMBER_DOCUMENTS_GATEWAY } from './documents/member-documents-gateway';
import { HttpMemberHomeGateway } from './home/http-member-home.gateway';
import { MEMBER_HOME_GATEWAY } from './home/member-home-gateway';
import { HttpMemberPaymentsGateway } from './payments/http-member-payments.gateway';
import { MEMBER_PAYMENTS_GATEWAY } from './payments/member-payments-gateway';
import { PAYMENT_INSTRUCTIONS_GATEWAY } from './payments/payment-instructions-gateway';
import { HttpPaymentInstructionsGateway } from './payments/http-payment-instructions.gateway';
import { HttpMemberProfileGateway } from './profile/http-member-profile.gateway';
import { MEMBER_PROFILE_GATEWAY } from './profile/member-profile-gateway';
import { HttpMemberReceiptsGateway } from './receipts/http-member-receipts.gateway';
import { MEMBER_RECEIPTS_GATEWAY } from './receipts/member-receipts-gateway';
import { HttpMemberRequestsGateway } from './requests/http-member-requests.gateway';
import { MEMBER_REQUESTS_GATEWAY } from './requests/member-requests-gateway';
import { pendingMemberRequestChangesGuard } from './requests/pending-member-request-changes.guard';
import { DemoMemberShowcaseGateway } from './showcase/demo-member-showcase.gateway';
import { MEMBER_SHOWCASE_GATEWAY } from './showcase/member-showcase-gateway';
import { DemoMemberShowcaseAnalyticsGateway } from './showcase-analytics/demo-member-showcase-analytics.gateway';
import { MEMBER_SHOWCASE_ANALYTICS_GATEWAY } from './showcase-analytics/member-showcase-analytics.gateway';
import { HttpMemberUsersGateway } from './users/http-member-users.gateway';
import { MEMBER_USERS_GATEWAY } from './users/member-users-gateway';
import {
  UNAVAILABLE_MEMBER_DOCUMENTS_GATEWAY,
  UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY,
  UNAVAILABLE_MEMBER_SHOWCASE_ANALYTICS_GATEWAY,
} from './unavailable-member-gateways';

/**
 * Routes de l'espace membre (côté adhérent), chargées à la demande.
 *
 * Le port est composé ici selon `CNPM_DATA_MODE`. Tant que le dashboard auto-scopé
 * n'existe pas, le profil HTTP est indisponible et n'expose aucune fixture membre.
 */
export const memberRoutes: Routes = [
  {
    path: 'home',
    providers: [
      // Refonte « zéro démo » : le tableau de bord vient de `GET /portal/dashboard`,
      // borné à l'adhésion du compte connecté.
      HttpMemberHomeGateway,
      { provide: MEMBER_HOME_GATEWAY, useExisting: HttpMemberHomeGateway },
    ],
    loadComponent: () => import('./home/member-home.page').then((m) => m.MemberHomePage),
    title: 'Mon espace membre — COGEF',
  },
  {
    path: 'contributions',
    providers: [
      DemoMemberContributionsGateway,
      HttpMemberContributionsGateway,
      {
        // Premier écran de l'espace membre raccordé au backend réel : hors démonstration,
        // les cotisations viennent de `GET /portal/contributions`, bornées au compte connecté.
        provide: MEMBER_CONTRIBUTIONS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberContributionsGateway)
            : inject(HttpMemberContributionsGateway),
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./contributions/member-contributions.page').then(
            (module) => module.MemberContributionsPage,
          ),
        title: 'Mes cotisations — COGEF',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./contributions/member-contribution-detail.page').then(
            (module) => module.MemberContributionDetailPage,
          ),
        title: 'Détail de la cotisation — COGEF',
      },
    ],
  },
  {
    path: 'payments',
    providers: [
      // Refonte « zéro démo » : historique réel et instructions de paiement, adaptateurs HTTP.
      HttpMemberPaymentsGateway,
      { provide: MEMBER_PAYMENTS_GATEWAY, useExisting: HttpMemberPaymentsGateway },
      HttpPaymentInstructionsGateway,
      { provide: PAYMENT_INSTRUCTIONS_GATEWAY, useExisting: HttpPaymentInstructionsGateway },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./payments/member-payments.page').then((module) => module.MemberPaymentsPage),
        title: 'Mes paiements — COGEF',
      },
      {
        path: 'instructions',
        loadComponent: () =>
          import('./payments/payment-instructions.page').then(
            (module) => module.PaymentInstructionsPage,
          ),
        title: 'Comment payer — COGEF',
      },
    ],
  },
  {
    path: 'receipts',
    providers: [
      // Refonte « zéro démo » : les reçus officiels viennent de `GET /portal/receipts`,
      // bornés à l'adhésion du compte connecté.
      HttpMemberReceiptsGateway,
      { provide: MEMBER_RECEIPTS_GATEWAY, useExisting: HttpMemberReceiptsGateway },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./receipts/member-receipts.page').then((module) => module.MemberReceiptsPage),
        title: 'Mes reçus — COGEF',
      },
    ],
  },
  {
    path: 'requests',
    providers: [
      // Refonte « zéro démo » : requêtes réelles via /portal/requests*, bornées à l'organisation.
      HttpMemberRequestsGateway,
      { provide: MEMBER_REQUESTS_GATEWAY, useExisting: HttpMemberRequestsGateway },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./requests/member-requests.page').then((module) => module.MemberRequestsPage),
        title: 'Mes requêtes — COGEF',
      },
      {
        path: 'new',
        canDeactivate: [pendingMemberRequestChangesGuard],
        loadComponent: () =>
          import('./requests/new-member-request.page').then(
            (module) => module.NewMemberRequestPage,
          ),
        title: 'Nouvelle requête — COGEF',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./requests/member-request-detail.page').then(
            (module) => module.MemberRequestDetailPage,
          ),
        title: 'Détail de la requête — COGEF',
      },
    ],
  },
  {
    path: 'documents',
    providers: [
      DemoMemberDocumentsGateway,
      {
        provide: MEMBER_DOCUMENTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberDocumentsGateway)
            : UNAVAILABLE_MEMBER_DOCUMENTS_GATEWAY,
      },
    ],
    loadComponent: () =>
      import('./documents/member-documents.page').then((module) => module.MemberDocumentsPage),
    title: 'Mes documents — COGEF',
  },
  {
    path: 'profile',
    providers: [
      // Refonte « zéro démo » : le profil membre n'a qu'un adaptateur HTTP réel.
      HttpMemberProfileGateway,
      { provide: MEMBER_PROFILE_GATEWAY, useExisting: HttpMemberProfileGateway },
    ],
    loadComponent: () =>
      import('./profile/member-profile.page').then((module) => module.MemberProfilePage),
    title: 'Profil entreprise — COGEF',
  },
  {
    path: 'users',
    providers: [
      // Refonte « zéro démo » : utilisateurs réels via /portal/users, bornés à l'organisation.
      HttpMemberUsersGateway,
      { provide: MEMBER_USERS_GATEWAY, useExisting: HttpMemberUsersGateway },
    ],
    loadComponent: () =>
      import('./users/member-users.page').then((module) => module.MemberUsersPage),
    title: 'Utilisateurs de l’entreprise — COGEF',
  },
  {
    path: 'showcase',
    providers: [
      DemoMemberShowcaseGateway,
      DemoMemberShowcaseAnalyticsGateway,
      {
        provide: MEMBER_SHOWCASE_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberShowcaseGateway)
            : UNAVAILABLE_MEMBER_SHOWCASE_GATEWAY,
      },
      {
        provide: MEMBER_SHOWCASE_ANALYTICS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberShowcaseAnalyticsGateway)
            : UNAVAILABLE_MEMBER_SHOWCASE_ANALYTICS_GATEWAY,
      },
    ],
    children: [
      // Même défaut que le catalogue : sans ce repli, /member/showcase rendait une page
      // blanche alors que ses trois écrans fonctionnent juste en dessous.
      { path: '', pathMatch: 'full', redirectTo: 'edit' },
      {
        path: 'edit',
        loadComponent: () =>
          import('./showcase/member-showcase-editor.page').then(
            (module) => module.MemberShowcaseEditorPage,
          ),
        title: 'Éditeur de vitrine — COGEF',
      },
      {
        path: 'preview',
        loadComponent: () =>
          import('./showcase/member-showcase-preview.page').then(
            (module) => module.MemberShowcasePreviewPage,
          ),
        title: 'Aperçu privé de la vitrine — COGEF',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./showcase-analytics/member-showcase-analytics.page').then(
            (module) => module.MemberShowcaseAnalyticsPage,
          ),
        title: 'Statistiques privées de la vitrine — COGEF',
      },
    ],
  },
  {
    // Point d'entrée institutionnel « Le CNPM » : les actualités sont les événements CNPM
    // réellement publiés (`GET /portal/events`), en état vide honnête tant qu'aucun n'est
    // publié ; s'y ajoutent des accès vers des écrans existants.
    path: 'cnpm',
    providers: [
      HttpMemberEventsGateway,
      { provide: MEMBER_EVENTS_GATEWAY, useExisting: HttpMemberEventsGateway },
    ],
    loadComponent: () => import('./cnpm/member-cnpm.page').then((module) => module.MemberCnpmPage),
    title: 'Le COGEF — actualités et informations',
  },
  {
    path: 'directory',
    providers: [
      // Refonte « zéro démo » : annuaire réel via /portal/directory (organisations actives).
      HttpMemberDirectoryGateway,
      { provide: MEMBER_DIRECTORY_GATEWAY, useExisting: HttpMemberDirectoryGateway },
    ],
    loadComponent: () =>
      import('./directory/member-directory.page').then((module) => module.MemberDirectoryPage),
    title: 'Annuaire privé et opportunités — COGEF',
  },
  // Alias temporaire pour ne pas casser les liens de démonstration déjà partagés.
  // Repli du catalogue : sans lui, /member ne correspond à aucune route et rend un
  // corps entièrement vide — ni coquille, ni message, ni redirection. Le '**' racine
  // ne rattrape pas ce cas, le préfixe 'member' ayant déjà été consommé.
  // `pathMatch: 'full'` est impératif : sans lui la route vide capterait tout le catalogue.
  { path: '', pathMatch: 'full', redirectTo: 'home' },
];
