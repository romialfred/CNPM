import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { DemoMemberContributionsGateway } from './contributions/demo-member-contributions.gateway';
import { MEMBER_CONTRIBUTIONS_GATEWAY } from './contributions/member-contributions-gateway';
import { DemoMemberHomeGateway } from './home/demo-member-home.gateway';
import { MEMBER_HOME_GATEWAY } from './home/member-home-gateway';
import {
  UNAVAILABLE_MEMBER_CONTRIBUTIONS_GATEWAY,
  UNAVAILABLE_MEMBER_HOME_GATEWAY,
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
  // Alias temporaire pour ne pas casser les liens de démonstration déjà partagés.
];
