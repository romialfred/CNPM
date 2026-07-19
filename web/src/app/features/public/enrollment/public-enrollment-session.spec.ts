import { describe, expect, it } from 'vitest';
import { PublicEnrollmentSession } from './public-enrollment-session';

describe('PublicEnrollmentSession', () => {
  it('ne conserve que le libellé utile au récapitulatif local', () => {
    const session = new PublicEnrollmentSession();
    const result = session.create({
      legalName: ' Sahel Agro SA ',
      tradeName: 'Sahel Agro',
      legalForm: 'Société anonyme',
      rccm: 'RCCM-2026-001',
      nif: 'NIF-2026-001',
      contactName: 'Contact Sahel Agro',
      contactEmail: 'contact@sahel-agro.invalid',
      contactPhone: '+223 00 00 00 00',
    });

    expect(result).toEqual({
      reference: 'ADH-2026-001',
      organizationLabel: 'Sahel Agro SA',
      channelLabel: 'Préparation en ligne',
      officialCaseCreated: false,
    });
    expect(JSON.stringify(result)).not.toContain('contact@sahel-agro.invalid');
    expect(JSON.stringify(result)).not.toContain('RCCM-2026-001');
  });
});
