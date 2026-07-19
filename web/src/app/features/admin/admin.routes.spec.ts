import type { Route } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { adminRoutes } from './admin.routes';

function child(path: string): Route | undefined {
  return adminRoutes[0]?.children?.find((route) => route.path === path);
}

describe('adminRoutes', () => {
  it('déclare les routes canoniques des écrans livrés', () => {
    expect(adminRoutes[0]?.path).toBe('');
    expect(adminRoutes[0]?.canActivate).toHaveLength(1);
    expect(child('dashboard')?.loadComponent).toBeTypeOf('function');
    expect(child('members')?.loadComponent).toBeTypeOf('function');
    expect(child('members/:id/edit')?.loadComponent).toBeTypeOf('function');
    expect(child('members/:id/edit')?.canDeactivate).toHaveLength(1);
    expect(child('members/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id/contacts')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id/contacts')?.canActivate).toHaveLength(1);
    expect(child('organizations/:id/edit')?.loadComponent).toBeTypeOf('function');
    expect(child('organizations/:id/edit')?.canDeactivate).toHaveLength(1);
    expect(child('groups')?.loadComponent).toBeTypeOf('function');
    expect(child('groups')?.canActivate).toHaveLength(1);
    expect(child('groups/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('groups/:id')?.canActivate).toHaveLength(1);
    expect(child('enrollments')?.loadComponent).toBeTypeOf('function');
    expect(child('enrollments/new')?.loadComponent).toBeTypeOf('function');
    expect(child('enrollments/new')?.canDeactivate).toHaveLength(1);
    expect(child('enrollments/:id/review')?.loadComponent).toBeTypeOf('function');
    expect(child('contributions')?.loadComponent).toBeTypeOf('function');
    expect(child('contributions/generation')?.loadComponent).toBeTypeOf('function');
    expect(child('contributions/generation')?.canActivate).toHaveLength(1);
    expect(child('payments/reconciliation')?.loadComponent).toBeTypeOf('function');
    expect(child('payments/import')?.loadComponent).toBeTypeOf('function');
    expect(child('payments/import')?.canActivate).toHaveLength(1);
    expect(child('receipts')?.loadComponent).toBeTypeOf('function');
    expect(child('receipts')?.canActivate).toHaveLength(1);
    expect(child('recovery/campaigns')?.loadComponent).toBeTypeOf('function');
    expect(child('recovery/campaigns/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('recovery/actions')?.loadComponent).toBeTypeOf('function');
    expect(child('recovery/portfolio')?.loadComponent).toBeTypeOf('function');
    expect(child('reporting')?.loadComponent).toBeTypeOf('function');
    expect(child('requests')?.loadComponent).toBeTypeOf('function');
    expect(child('documents')?.loadComponent).toBeTypeOf('function');
    expect(child('documents')?.canActivate).toHaveLength(1);
    expect(child('showcases/moderation')?.loadComponent).toBeTypeOf('function');
    expect(child('integrations')?.loadComponent).toBeTypeOf('function');
    expect(child('integrations')?.canActivate).toHaveLength(1);
    expect(child('requests')?.canActivate).toHaveLength(1);
    expect(child('requests/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('requests/:id')?.canActivate).toHaveLength(1);
    expect(child('security/users')?.loadComponent).toBeTypeOf('function');
    expect(child('security/roles')?.loadComponent).toBeTypeOf('function');
    expect(child('security/roles')?.data?.['defaultTab']).toBe('roles');
    expect(child('contributions/:id')?.loadComponent).toBeTypeOf('function');
    expect(child('security/audit')?.loadComponent).toBeTypeOf('function');
    expect(child('security/audit')?.canActivate).toHaveLength(1);
    expect(child('settings')?.loadComponent).toBeTypeOf('function');
    expect(child('settings')?.canActivate).toHaveLength(1);
    expect(child('settings')?.canDeactivate).toHaveLength(1);
  });

  it('déclare les segments littéraux avant les routes paramétrées qui les captureraient', () => {
    // Défaut constaté en exécution : « contributions/generation » déclaré après
    // « contributions/:id » était résolu comme un identifiant, et l'écran de
    // génération affichait « Cotisation introuvable » au lieu de son contenu.
    const paths = (adminRoutes[0]?.children ?? []).map((route) => route.path);
    const literalBeforeParameterized: readonly [string, string][] = [
      ['contributions/generation', 'contributions/:id'],
      ['organizations/:id/contacts', 'organizations/:id'],
      ['organizations/:id/edit', 'organizations/:id'],
      ['members/:id/edit', 'members/:id'],
    ];

    for (const [literal, parameterized] of literalBeforeParameterized) {
      expect(paths).toContain(literal);
      expect(paths).toContain(parameterized);
      expect(paths.indexOf(literal)).toBeLessThan(paths.indexOf(parameterized));
    }
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
