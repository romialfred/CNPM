import { describe, expect, it } from 'vitest';
import { PublicEnrollmentSession } from './public-enrollment-session';

describe('PublicEnrollmentSession', () => {
  it('ne conserve que le libellé fictif utile à la confirmation locale', () => {
    const session = new PublicEnrollmentSession();
    const result = session.create({
      legalName: ' Entreprise Démo Sahel ',
      tradeName: 'Démo Sahel',
      legalForm: 'Forme fictive',
      rccm: 'DEMO-RCCM-001',
      nif: 'DEMO-NIF-001',
      contactName: 'Awa Démo',
      contactEmail: 'contact@demo.invalid',
      contactPhone: 'DEMO-TELEPHONE',
    });

    expect(result).toEqual({
      reference: 'DEMO-ADH-2026-001',
      organizationLabel: 'Entreprise Démo Sahel',
      channelLabel: 'Démonstration locale',
      officialCaseCreated: false,
    });
    expect(JSON.stringify(result)).not.toContain('contact@demo.invalid');
    expect(JSON.stringify(result)).not.toContain('DEMO-RCCM-001');
  });
});
