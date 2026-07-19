import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import {
  DEMO_VERIFICATION_CODE,
  DemoReceiptVerificationGateway,
} from './demo-receipt-verification.gateway';

describe('DemoReceiptVerificationGateway', () => {
  const gateway = new DemoReceiptVerificationGateway();

  it('retourne une projection minimale et intrinsèquement fictive', async () => {
    const result = await firstValueFrom(gateway.verify(DEMO_VERIFICATION_CODE.toLowerCase()));
    expect(result.outcome).toBe('found');
    if (result.outcome === 'found') {
      expect(result.verification.fictionalDemo).toBe(true);
      expect(result.verification.receiptReference).toMatch(/^DEMO-/);
      expect(result.verification).not.toHaveProperty('memberName');
      expect(result.verification).not.toHaveProperty('signature');
      expect(result.verification).not.toHaveProperty('qrCode');
    }
  });

  it('ne révèle rien pour un code inconnu', async () => {
    await expect(firstValueFrom(gateway.verify('inconnu'))).resolves.toEqual({
      outcome: 'not-found',
    });
  });
});
