import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((module) => module.authRoutes),
  },
  {
    path: 'member',
    loadChildren: () =>
      import('./features/member/member.routes').then((module) => module.memberRoutes),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((module) => module.adminRoutes),
  },
  { path: 'espace-membre', pathMatch: 'full', redirectTo: 'member/home' },
  {
    path: 'membres',
    loadChildren: () =>
      import('./features/public/public.routes').then((module) => module.showcaseRoutes),
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/public/public.routes').then((module) => module.publicRoutes),
  },
  { path: '**', redirectTo: '' },
];
