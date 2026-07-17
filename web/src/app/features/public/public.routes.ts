import type { Routes } from '@angular/router';
import { DemoHomeGateway } from './home/demo-home.gateway';
import { HOME_GATEWAY } from './home/home-gateway';
import { DemoShowcaseGateway } from './showcase/demo-showcase.gateway';
import { SHOWCASE_GATEWAY } from './showcase/showcase-gateway';

/**
 * Routes publiques, chargées à la demande.
 *
 * Le port `SHOWCASE_GATEWAY` est fourni ici avec l'adaptateur de démonstration :
 * l'API R4 n'étant pas promue dans le contrat canonique, seul ce point d'assemblage
 * changera lorsqu'elle le sera.
 */
export const publicRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    providers: [{ provide: HOME_GATEWAY, useClass: DemoHomeGateway }],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    title: 'Conseil National du Patronat du Mali',
  },
  {
    path: 'membres/:slug',
    providers: [{ provide: SHOWCASE_GATEWAY, useClass: DemoShowcaseGateway }],
    loadComponent: () => import('./showcase/showcase.page').then((m) => m.ShowcasePage),
    // Le titre définitif est posé par la page à partir des données SEO de la vitrine.
    title: 'Vitrine membre — CNPM',
  },
];
