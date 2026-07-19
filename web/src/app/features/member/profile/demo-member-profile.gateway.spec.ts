import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { UNAVAILABLE_MEMBER_PROFILE_GATEWAY } from '../unavailable-member-gateways';
import { DemoMemberProfileGateway } from './demo-member-profile.gateway';

describe('DemoMemberProfileGateway — MP-013', () => {
  it('sert une projection locale déterministe alignée sur MOB-016', async () => {
    const profile = await firstValueFrom(new DemoMemberProfileGateway().load());
    expect(profile).toMatchObject({
      displayLabel: 'Responsable adhésion',
      organizationName: 'Sahel Agro SA',
      memberReference: 'CNPM-2026-0001',
      membershipSince: '2024-03-18',
    });
    expect(profile.disclosure).toContain('lecture seule');
  });

  it('n’expose ni contact, ni frontière IAM, ni justificatif membre', async () => {
    const profile = await firstValueFrom(new DemoMemberProfileGateway().load());
    expect(Object.keys(profile)).not.toEqual(
      expect.arrayContaining([
        'email',
        'phone',
        'address',
        'photo',
        'keycloakSubject',
        'mfaCredential',
        'permissions',
        'kyc',
        'taxId',
        'registrationNumber',
      ]),
    );
  });

  it('ferme le profil HTTP faute de projection MP-013 auto-scopée', async () => {
    await expect(firstValueFrom(UNAVAILABLE_MEMBER_PROFILE_GATEWAY.load())).rejects.toMatchObject({
      feature: 'MP-013',
    });
  });
});
