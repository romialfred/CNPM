import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  buildOtpauthUri,
  generateRecoveryCodes,
  generateTotpCode,
  randomBase32Secret,
  validateTotp,
} from './totp';

/** Secret des vecteurs de test officiels RFC 6238 (SHA1) : ASCII « 12345678901234567890 ». */
const RFC_SECRET = base32Encode(new TextEncoder().encode('12345678901234567890'));

describe('TOTP natif (RFC 6238)', () => {
  it('reproduit les vecteurs de test officiels RFC 6238 (SHA1, 6 chiffres)', async () => {
    // Sans cette conformité, les codes de Microsoft Authenticator ne correspondraient pas.
    const cases: readonly [number, string][] = [
      [59, '287082'],
      [1111111109, '081804'],
      [1234567890, '005924'],
      [2000000000, '279037'],
    ];
    for (const [time, expected] of cases) {
      expect(await generateTotpCode(RFC_SECRET, Math.floor(time / 30))).toBe(expected);
    }
  });

  it('encode puis décode le Base32 sans perte', () => {
    const bytes = Uint8Array.from([0, 1, 2, 250, 255, 128, 64, 32, 16, 8]);
    expect(Array.from(base32Decode(base32Encode(bytes)))).toEqual(Array.from(bytes));
  });

  it('génère un secret Base32 de longueur attendue', () => {
    expect(randomBase32Secret()).toMatch(/^[A-Z2-7]{32}$/u);
  });

  it('accepte le code courant et refuse un code erroné (fenêtre ±1 pas)', async () => {
    const secret = randomBase32Secret();
    const now = 1_700_000_000;
    const code = await generateTotpCode(secret, Math.floor(now / 30));
    expect(await validateTotp(secret, code, now)).toBeGreaterThanOrEqual(0);
    // Un pas précédent reste toléré ; un code manifestement faux est rejeté.
    expect(await validateTotp(secret, '000000', now)).toBe(-1);
    expect(await validateTotp(secret, 'abc', now)).toBe(-1);
  });

  it('construit une URI otpauth conforme, scannable', () => {
    const uri = buildOtpauthUri({ issuer: 'CNPM', account: 'user@cnpm.ml', secret: RFC_SECRET });
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(uri).toContain(`secret=${RFC_SECRET}`);
    expect(uri).toContain('issuer=CNPM');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });

  it('délivre des codes de secours distincts au format attendu', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-7]{8}-[A-Z2-7]{4}$/u);
    }
  });
});
