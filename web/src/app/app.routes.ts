import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/project-ready/project-ready.page').then(
        (module) => module.ProjectReadyPage,
      ),
    title: 'CNPM Digital Platform',
  },
  { path: '**', redirectTo: '' },
];
