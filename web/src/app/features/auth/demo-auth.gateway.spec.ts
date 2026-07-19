import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { AuthSpace } from './auth-gateway';
import { DemoAuthGateway } from './demo-auth.gateway';

const EMAIL = 'demo.agent@cnpm.example';
const SUSPENDED_EMAIL = 'demo.suspendu@cnpm.example';
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
});
