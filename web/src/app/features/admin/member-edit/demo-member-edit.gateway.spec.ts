import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoMemberEditGateway } from './demo-member-edit.gateway';
import {
  MemberEditAccessError,
  MemberEditConflictError,
  MemberEditNotFoundError,
} from './member-edit-gateway';

describe('DemoMemberEditGateway', () => {
  it('sert des données synthétiques sans identifiant officiel ni contact', async () => {
    const member = await firstValueFrom(new DemoMemberEditGateway().load('MEM-0001'));
    expect(member).toMatchObject({
      id: 'MEM-0001',
      legalName: 'SOMACOP SA',
      status: 'ACTIVE',
    });
    expect(Object.keys(member)).not.toContain('nif');
    expect(Object.keys(member)).not.toContain('rccm');
    expect(Object.keys(member)).not.toContain('contact');
  });

  it('applique le verrou optimiste et incrémente la version', async () => {
    const gateway = new DemoMemberEditGateway();
    const updated = await firstValueFrom(
      gateway.update('MEM-0001', 1, {
        legalName: '  SOMACOP Industries  ',
        tradeName: '',
        organizationType: 'Entreprise membre',
        sectorCode: '',
      }),
    );
    expect(updated).toMatchObject({
      legalName: 'SOMACOP Industries',
      tradeName: null,
      version: 2,
    });
    await expect(
      firstValueFrom(
        gateway.update('MEM-0001', 1, {
          legalName: updated.legalName,
          tradeName: '',
          organizationType: updated.organizationType,
          sectorCode: updated.sectorCode ?? '',
        }),
      ),
    ).rejects.toBeInstanceOf(MemberEditConflictError);
  });

  it('distingue les états 403 et 404', async () => {
    const gateway = new DemoMemberEditGateway();
    await expect(firstValueFrom(gateway.load('MEM-INTERDIT'))).rejects.toBeInstanceOf(
      MemberEditAccessError,
    );
    await expect(firstValueFrom(gateway.load('MEM-INCONNU'))).rejects.toBeInstanceOf(
      MemberEditNotFoundError,
    );
  });
});
