import { Routes } from '@angular/router';
import { authRoutes } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/project-ready/project-ready.page').then(
        (module) => module.ProjectReadyPage,
      ),
    title: 'CNPM Digital Platform',
  },
  ...authRoutes,
  { path: '**', redirectTo: '' },
];
