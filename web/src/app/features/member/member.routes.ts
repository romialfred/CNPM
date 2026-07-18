import type { Routes } from '@angular/router';
import { DemoMemberHomeGateway } from './home/demo-member-home.gateway';
import { MEMBER_HOME_GATEWAY } from './home/member-home-gateway';

/**
 * Routes de l'espace membre (côté adhérent), chargées à la demande.
 *
 * Le port est fourni ici avec son adaptateur de démonstration : le remplacer par
 * l'adaptateur HTTP réel ne touchera que ce point d'assemblage, jamais les pages.
 */
export const memberRoutes: Routes = [
  {
    path: 'member/home',
    providers: [{ provide: MEMBER_HOME_GATEWAY, useClass: DemoMemberHomeGateway }],
    loadComponent: () => import('./home/member-home.page').then((m) => m.MemberHomePage),
    title: 'Mon espace membre — CNPM',
  },
  // Alias temporaire pour ne pas casser les liens de démonstration déjà partagés.
  { path: 'espace-membre', pathMatch: 'full', redirectTo: 'member/home' },
];
