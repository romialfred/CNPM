import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { generateTotpCode } from '../../core/auth/totp';
import type { AuthSpace } from './auth-gateway';
import { DemoAuthGateway } from './demo-auth.gateway';

/** Code TOTP réellement valide pour le secret d'enrôlement, à l'instant présent. */
function currentCode(secret: string): Promise<string> {
  return generateTotpCode(secret, Math.floor(Date.now() / 1000 / 30));
}

const EMAIL = 'demo.agent@cnpm.example';
const SUSPENDED_EMAIL = 'demo.suspendu@cnpm.example';
const ENROLL_EMAIL = 'demo.nouveau@cnpm.example';
const PASSWORD = 'demo-pass';
const CODE = '123456';

describe('DemoAuthGateway', () => {
  const gateway = new DemoAuthGateway();

  function credentials(email: string, password: string, space: AuthSpace = 'admin') {
    return firstValueFrom(
      gateway.submitCredentials({ space, email, password, rememberDevice: false }),
    );
  }

  it('exige la 2FA pour l’identité fictive nominale', async () => {
    await expect(credentials(EMAIL, PASSWORD)).resolves.toMatchObject({
      outcome: 'mfa-required',
    });
  });

  it('expose l’état « accès interdit » sur l’identité fictive suspendue', async () => {
    await expect(credentials(SUSPENDED_EMAIL, PASSWORD)).resolves.toEqual({
      outcome: 'forbidden',
    });
  });

  it('exige l’enrôlement à la première connexion (2FA jamais activé)', async () => {
    // Identifiants valides mais aucun second facteur : on ne délivre PAS de défi 2FA,
    // on conduit à l'enrôlement forcé.
    await expect(credentials(ENROLL_EMAIL, PASSWORD)).resolves.toMatchObject({
      outcome: 'enrollment-required',
    });
    // Un mot de passe erroné reste indifférencié, pour ne pas trahir l'existence du compte.
    await expect(credentials(ENROLL_EMAIL, 'mauvais')).resolves.toEqual({ outcome: 'invalid' });
  });

  it('refuse un mot de passe erroné sans révéler l’existence de l’adresse', async () => {
    // Le résultat doit être identique pour une adresse connue et une inconnue,
    // sinon l'écran devient un oracle d'existence de compte.
    await expect(credentials(EMAIL, 'mauvais')).resolves.toEqual({ outcome: 'invalid' });
    await expect(credentials('inconnu@cnpm.example', PASSWORD)).resolves.toEqual({
      outcome: 'invalid',
    });
  });

  it('renvoie vers l’espace réellement choisi après vérification', async () => {
    // Défaut constaté en exécution : la destination était figée sur '/', si bien
    // qu'une connexion réussie déposait l'utilisateur sur la vitrine publique — on
    // croyait la connexion échouée. Les deux espaces doivent donc différer.
    const challenge = await credentials(EMAIL, PASSWORD);
    if (challenge.outcome !== 'mfa-required') throw new Error('défi 2FA attendu');

    await expect(
      firstValueFrom(gateway.verifyCode(challenge.challengeId, CODE, 'admin')),
    ).resolves.toEqual({ outcome: 'authenticated', redirectTo: '/admin' });

    await expect(
      firstValueFrom(gateway.verifyCode(challenge.challengeId, CODE, 'member')),
    ).resolves.toEqual({ outcome: 'authenticated', redirectTo: '/member' });
  });

  it('rejette un code erroné sans livrer de destination', async () => {
    const challenge = await credentials(EMAIL, PASSWORD);
    if (challenge.outcome !== 'mfa-required') throw new Error('défi 2FA attendu');

    await expect(
      firstValueFrom(gateway.verifyCode(challenge.challengeId, '000000', 'admin')),
    ).resolves.toEqual({ outcome: 'invalid-code' });
  });

  it('rejette un code valide présenté sur un défi inconnu', async () => {
    await expect(
      firstValueFrom(gateway.verifyCode('defi-inexistant', CODE, 'admin')),
    ).resolves.toEqual({ outcome: 'invalid-code' });
  });

  it('ouvre un enrôlement TOTP avec un vrai QR scannable et une clé, sans exposer de secret brut', async () => {
    const enrollment = await firstValueFrom(gateway.beginTotpEnrollment());

    expect(enrollment.enrollmentId).toBeTruthy();
    expect(enrollment.issuer).toBe('CNPM');
    // QR réel (PNG data URI) généré localement, scannable par Microsoft Authenticator.
    expect(enrollment.qrImage.startsWith('data:image/')).toBe(true);
    // La clé manuelle est le secret Base32 réel (regroupé par blocs pour la lisibilité).
    expect(enrollment.manualKey.replace(/\s/gu, '')).toMatch(/^[A-Z2-7]+$/u);
  });

  it('active le second facteur avec le vrai code TOTP, et conduit vers l’espace choisi', async () => {
    const enrollment = await firstValueFrom(gateway.beginTotpEnrollment());
    const code = await currentCode(enrollment.manualKey);
    const result = await firstValueFrom(gateway.activateTotp(enrollment.enrollmentId, code, 'member'));

    expect(result.outcome).toBe('activated');
    if (result.outcome !== 'activated') throw new Error('activation attendue');
    expect(result.redirectTo).toBe('/member');
    // Parité SafeX : des codes de secours mono-usage sont remis à l'activation.
    expect(result.recoveryCodes?.length).toBeGreaterThan(0);
  });

  it('refuse un code d’activation erroné, sans activer', async () => {
    const enrollment = await firstValueFrom(gateway.beginTotpEnrollment());
    await expect(
      firstValueFrom(gateway.activateTotp(enrollment.enrollmentId, '000000', 'admin')),
    ).resolves.toEqual({ outcome: 'invalid-code' });
  });
});
