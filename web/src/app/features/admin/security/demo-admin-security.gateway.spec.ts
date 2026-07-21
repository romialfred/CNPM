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

  it('ne fournit que des identités du jeu fermé et des corrélations tracées', async () => {
    const snapshot = await firstValueFrom(
      new DemoAdminSecurityGateway().load({ tab: 'comptes', search: '' }),
    );

    expect(snapshot.accounts.length).toBeGreaterThan(0);
    expect(snapshot.accounts.every((account) => account.email.endsWith('.example'))).toBe(true);
    expect(snapshot.audit.every((entry) => entry.correlationId.startsWith('CNPM-AUD-'))).toBe(true);
  });

  it('crée un compte « invité » sans second facteur ni connexion, et le fait apparaître', async () => {
    const gateway = new DemoAdminSecurityGateway();
    const avant = await firstValueFrom(gateway.load({ tab: 'comptes', search: '' }));

    const cree = await firstValueFrom(
      gateway.createAccount({
        firstName: 'Awa',
        lastName: 'Touré',
        email: 'a.toure@cnpm-demo.example',
        roleId: 'auditeur',
      }),
    );

    // Un compte créé n'est pas actif : il naît invité, second facteur à enrôler, jamais
    // connecté. C'est l'état exact qui déclenchera la popup d'enrôlement.
    expect(cree.fullName).toBe('Awa Touré');
    expect(cree.status).toBe('INVITED');
    expect(cree.twoFactor).toBe('PENDING');
    expect(cree.lastLoginAt).toBeNull();
    expect(cree.roleLabel).toBe('Auditeur');
    expect(cree.email.endsWith('.example')).toBe(true);

    // Le rechargement suivant le voit, en tête de liste.
    const apres = await firstValueFrom(gateway.load({ tab: 'comptes', search: '' }));
    expect(apres.accounts.length).toBe(avant.accounts.length + 1);
    expect(apres.accounts[0].fullName).toBe('Awa Touré');
    // Il reste trouvable par la recherche, comme n'importe quel compte de la source.
    const recherche = await firstValueFrom(gateway.load({ tab: 'comptes', search: 'touré' }));
    expect(recherche.accounts.some((account) => account.fullName === 'Awa Touré')).toBe(true);
  });
});
