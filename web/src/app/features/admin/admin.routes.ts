import type { Routes } from '@angular/router';
import { DemoSessionGateway } from '../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../layout/admin-shell/session-gateway';
import { DemoMembersGateway } from './members/demo-members.gateway';
import { MEMBERS_GATEWAY } from './members/members-gateway';

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
    ],
    children: [
      {
        path: 'members',
        loadComponent: () => import('./members/members.page').then((m) => m.MembersPage),
        title: 'Membres — Administration CNPM',
      },
      { path: '', pathMatch: 'full', redirectTo: 'members' },
    ],
  },
];
