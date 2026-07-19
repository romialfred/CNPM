import { inject } from '@angular/core';
import type { Routes } from '@angular/router';
import { CNPM_DATA_MODE } from '../../core/api/api.config';
import { DemoHomeGateway } from './home/demo-home.gateway';
import { HOME_GATEWAY } from './home/home-gateway';
import { DemoEditorialGateway } from './editorial/demo-editorial.gateway';
import { EDITORIAL_GATEWAY } from './editorial/editorial-gateway';
import { DemoShowcaseGateway } from './showcase/demo-showcase.gateway';
import { SHOWCASE_GATEWAY } from './showcase/showcase-gateway';
import {
  UNAVAILABLE_HOME_GATEWAY,
  UNAVAILABLE_EDITORIAL_GATEWAY,
  UNAVAILABLE_SHOWCASE_GATEWAY,
} from './unavailable-public-gateways';

/**
 * Routes publiques, chargées à la demande.
 *
 * Les ports sont composés ici selon `CNPM_DATA_MODE`. L'API R4 de vitrine n'étant pas
 * promue, le profil HTTP expose son indisponibilité sans repli vers les fixtures.
 */
export const publicRoutes: Routes = [
  {
    path: 'le-cnpm',
    data: { mode: 'about' },
    loadComponent: () =>
      import('./institutional/institutional.page').then((m) => m.InstitutionalPage),
    title: 'Le CNPM — Présentation',
  },
  {
    path: 'services',
    data: { mode: 'services' },
    loadComponent: () =>
      import('./institutional/institutional.page').then((m) => m.InstitutionalPage),
    title: 'Services numériques — CNPM',
  },
  {
    path: 'actualites',
    providers: [
      DemoEditorialGateway,
      {
        provide: EDITORIAL_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoEditorialGateway)
            : UNAVAILABLE_EDITORIAL_GATEWAY,
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: { mode: 'news' },
        loadComponent: () =>
          import('./editorial/editorial.page').then((m) => m.EditorialPage),
        title: 'Actualités — CNPM',
      },
      {
        path: ':slug',
        data: { mode: 'article' },
        loadComponent: () =>
          import('./editorial/editorial.page').then((m) => m.EditorialPage),
        title: 'Actualité — CNPM',
      },
    ],
  },
  {
    path: 'agenda',
    providers: [
      DemoEditorialGateway,
      {
        provide: EDITORIAL_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoEditorialGateway)
            : UNAVAILABLE_EDITORIAL_GATEWAY,
      },
    ],
    data: { mode: 'agenda' },
    loadComponent: () => import('./editorial/editorial.page').then((m) => m.EditorialPage),
    title: 'Agenda — CNPM',
  },
  {
    path: '',
    pathMatch: 'full',
    providers: [
      DemoHomeGateway,
      {
        provide: HOME_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo' ? inject(DemoHomeGateway) : UNAVAILABLE_HOME_GATEWAY,
      },
    ],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    title: 'Conseil National du Patronat du Mali',
  },
];

export const showcaseRoutes: Routes = [
  {
    path: '',
    providers: [
      DemoShowcaseGateway,
      {
        provide: SHOWCASE_GATEWAY,
        useFactory: () =>
          inject(CNPM_DATA_MODE) === 'demo'
            ? inject(DemoShowcaseGateway)
            : UNAVAILABLE_SHOWCASE_GATEWAY,
      },
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: { mode: 'directory' },
        loadComponent: () => import('./directory/directory.page').then((m) => m.DirectoryPage),
        title: 'Annuaire des membres — CNPM',
      },
      {
        path: 'recherche',
        data: { mode: 'search' },
        loadComponent: () => import('./directory/directory.page').then((m) => m.DirectoryPage),
        title: 'Rechercher un membre — CNPM',
      },
      {
        path: ':slug/activites',
        data: { mode: 'activities' },
        loadComponent: () =>
          import('./showcase-detail/showcase-detail.page').then((m) => m.ShowcaseDetailPage),
        title: 'Activités et réalisations — CNPM',
      },
      {
        path: ':slug/realisations/:id',
        data: { mode: 'project' },
        loadComponent: () =>
          import('./showcase-detail/showcase-detail.page').then((m) => m.ShowcaseDetailPage),
        title: 'Détail d’une réalisation — CNPM',
      },
      {
        path: ':slug',
        loadComponent: () => import('./showcase/showcase.page').then((m) => m.ShowcasePage),
        // Le titre définitif est posé par la page à partir des données SEO de la vitrine.
        title: 'Vitrine membre — CNPM',
      },
    ],
  },
];
