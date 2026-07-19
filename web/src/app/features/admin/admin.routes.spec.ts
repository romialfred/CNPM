import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { adminRoutes } from './admin.routes';

function child(path: string): Route | undefined {
  return adminRoutes[0]?.children?.find((route) => route.path === path);
}

describe('adminRoutes', () => {
  it('déclare les routes canoniques des écrans livrés', () => {
    expect(adminRoutes[0]?.path).toBe('admin');
    expect(adminRoutes[0]?.canActivate).toHaveLength(1);
    expect(child('dashboard')?.loadComponent).toBeTypeOf('function');
    expect(child('members')?.loadComponent).toBeTypeOf('function');
    expect(child('members/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id/edit')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id/edit')?.canDeactivate).toHaveLength(1);
    expect(child('enrollments')?.loadComponent).toBeTypeOf('function');
    expect(child('enrollments/new')?.loadComponent).toBeTypeOf('function');
    expect(child('enrollments/new')?.canDeactivate).toHaveLength(1);
    expect(child('enrollments/:id/review')?.loadComponent).toBeTypeOf('function');
    expect(child('contributions')?.loadComponent).toBeTypeOf('function');
    expect(child('payments/reconciliation')?.loadComponent).toBeTypeOf('function');
    expect(child('recovery/campaigns')?.loadComponent).toBeTypeOf('function');
    expect(child('reporting')?.loadComponent).toBeTypeOf('function');
    expect(child('security/users')?.loadComponent).toBeTypeOf('function');
  });

  it('redirige les anciens chemins courts vers les routes canoniques', () => {
    expect(child('payments')).toMatchObject({
      pathMatch: 'full',
      redirectTo: 'payments/reconciliation',
    });
    expect(child('recovery')).toMatchObject({
      pathMatch: 'full',
      redirectTo: 'recovery/campaigns',
    });
    expect(child('security')).toMatchObject({
      pathMatch: 'full',
      redirectTo: 'security/users',
    });
  });
});
