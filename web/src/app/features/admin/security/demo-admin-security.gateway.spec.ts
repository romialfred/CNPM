import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoAdminSecurityGateway } from './demo-admin-security.gateway';

describe('DemoAdminSecurityGateway — composition BO-030', () => {
  it('n’accorde aucun droit financier au rôle d’administration technique', async () => {
    const snapshot = await firstValueFrom(
      new DemoAdminSecurityGateway().load({ tab: 'roles', search: '' }),
    );
    const technicalRole = snapshot.roles.find((role) => role.id === 'admin-technique');
    expect(technicalRole).toBeDefined();

    const financialPermissions = snapshot.permissions.filter(
      (permission) => permission.domain === 'Finance',
    );
    expect(financialPermissions.length).toBeGreaterThan(0);
    for (const permission of financialPermissions) {
      expect(permission.grants.find((grant) => grant.roleId === technicalRole?.id)?.granted).toBe(
        false,
      );
    }
  });

  it('ne fournit que des identités fictives et des corrélations de démonstration', async () => {
    const snapshot = await firstValueFrom(
      new DemoAdminSecurityGateway().load({ tab: 'comptes', search: '' }),
    );

    expect(snapshot.accounts.length).toBeGreaterThan(0);
    expect(snapshot.accounts.every((account) => account.email.endsWith('.example'))).toBe(true);
    expect(snapshot.audit.every((entry) => entry.correlationId.startsWith('DEMO-'))).toBe(true);
  });
});
