import { Routes } from '@angular/router';
import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';
import { publicRoutes } from './features/public/public.routes';

export const routes: Routes = [
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  { path: '**', redirectTo: '' },
];
