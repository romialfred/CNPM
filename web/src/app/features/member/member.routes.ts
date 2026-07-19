import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { DemoMemberContributionsGateway } from './contributions/demo-member-contributions.gateway';
import { MEMBER_CONTRIBUTIONS_GATEWAY } from './contributions/member-contributions-gateway';
import { DemoMemberHomeGateway } from './home/demo-member-home.gateway';
import { MEMBER_HOME_GATEWAY } from './home/member-home-gateway';
import { DemoMemberReceiptsGateway } from './receipts/demo-member-receipts.gateway';
import { MEMBER_RECEIPTS_GATEWAY } from './receipts/member-receipts-gateway';
import { DemoMemberRequestsGateway } from './requests/demo-member-requests.gateway';
import { MEMBER_REQUESTS_GATEWAY } from './requests/member-requests-gateway';
import { pendingMemberRequestChangesGuard } from './requests/pending-member-request-changes.guard';
import {
  UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY,
  UNAVAILABLE_MEMBER_HOME_GATEWAY,
  UNAVAILABLE_MEMBER_RECEIPTS_GATEWAY,
  UNAVAILABLE_MEMBER_REQUESTS_GATEWAY,
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
      DemoMemberHomeGateway,
      {
        provide: MEMBER_HOME_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberHomeGateway)
            : UNAVAILABLE_MEMBER_HOME_GATEWAY,
      },
    ],
    loadComponent: () => import('./home/member-home.page').then((m) => m.MemberHomePage),
    title: 'Mon espace membre — CNPM',
  },
  {
    path: 'contributions',
    providers: [
      DemoMemberContributionsGateway,
      {
        provide: MEMBER_CONTRIBUTIONS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberContributionsGateway)
            : UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY,
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
        title: 'Mes cotisations — CNPM',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./contributions/member-contribution-detail.page').then(
            (module) => module.MemberContributionDetailPage,
          ),
        title: 'Détail de la cotisation — CNPM',
      },
    ],
  },
  {
    path: 'receipts',
    providers: [
      DemoMemberReceiptsGateway,
      {
        provide: MEMBER_RECEIPTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberReceiptsGateway)
            : UNAVAILABLE_MEMBER_RECEIPTS_GATEWAY,
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./receipts/member-receipts.page').then((module) => module.MemberReceiptsPage),
        title: 'Mes reçus — CNPM',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./receipts/member-receipt-detail.page').then(
            (module) => module.MemberReceiptDetailPage,
          ),
        title: 'Aperçu du reçu — CNPM',
      },
    ],
  },
  {
    path: 'requests',
    providers: [
      DemoMemberRequestsGateway,
      {
        provide: MEMBER_REQUESTS_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoMemberRequestsGateway)
            : UNAVAILABLE_MEMBER_REQUESTS_GATEWAY,
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./requests/member-requests.page').then((module) => module.MemberRequestsPage),
        title: 'Mes requêtes — CNPM',
      },
      {
        path: 'new',
        canDeactivate: [pendingMemberRequestChangesGuard],
        loadComponent: () =>
          import('./requests/new-member-request.page').then(
            (module) => module.NewMemberRequestPage,
          ),
        title: 'Nouvelle requête — CNPM',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./requests/member-request-detail.page').then(
            (module) => module.MemberRequestDetailPage,
          ),
        title: 'Détail de la requête — CNPM',
      },
    ],
  },
  // Alias temporaire pour ne pas casser les liens de démonstration déjà partagés.
];
