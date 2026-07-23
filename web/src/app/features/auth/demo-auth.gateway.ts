import { Injectable } from '@angular/core';
import { delay, from, Observable, of } from 'rxjs';
import {
  buildOtpauthUri,
  formatManualKey,
  generateRecoveryCodes,
  randomBase32Secret,
  validateTotp,
} from '../../core/auth/totp';
import { renderOtpauthQr } from '../../core/auth/qr';
import type {
  AuthGateway,
  AuthSpace,
  CredentialsRequest,
  CredentialsResult,
  TotpActivationResult,
  TotpEnrollment,
  VerificationResult,
} from './auth-gateway';

/**
 * Adaptateur de démonstration pour l'écran pilote AUTH-001.
 *
 * NON destiné à la production, mais le 2FA y est RÉEL : le secret TOTP, l'URI `otpauth://`
 * et le QR sont générés côté client (module `core/auth/totp`), scannables par Microsoft
 * Authenticator, et les codes sont réellement vérifiés (RFC 6238). En production, cette
 * génération/vérification appartiendra au backend natif (portage du `MfaService` SafeX).
 * Les identifiants ci-dessous sont fictifs et publics, jamais des données réelles.
 */
@Injectable()
export class DemoAuthGateway implements AuthGateway {
  /** Identité fictive utilisée pour l'étiquette d'enrôlement TOTP. */
  private static readonly DEMO_EMAIL = 'demo.agent@cnpm.example';
  /** Identifiant fictif permettant d'exercer l'état « accès interdit ». */
  private static readonly DEMO_SUSPENDED_EMAIL = 'demo.suspendu@cnpm.example';
  /**
   * Compte fictif « première connexion » : identifiants valides mais 2FA jamais activé.
   * Il déclenche l'enrôlement forcé, pour démontrer le blocage tant que le second facteur
   * n'est pas configuré.
   */
  private static readonly DEMO_ENROLL_EMAIL = 'demo.nouveau@cnpm.example';
  private static readonly DEMO_CODE = '123456';
  private static readonly CHALLENGE_ID = 'demo-challenge';
  private static readonly ENROLLMENT_ID = 'demo-enrollment';
  private static readonly LATENCY_MS = 400;

  /**
   * Secret TOTP de l'enrôlement en cours. Il vit ici, en mémoire, le temps que
   * l'utilisateur scanne le QR et confirme le premier code — jamais persisté, jamais
   * journalisé. En production ce secret est détenu et vérifié par le backend.
   */
  private activeSecret: string | null = null;

  submitCredentials(request: CredentialsRequest): Observable<CredentialsResult> {
    const email = request.email.trim().toLowerCase();
    const password = request.password;
    let result: CredentialsResult;
    if (!email || !password) {
      // Le formulaire exige déjà les deux champs ; garde-fou de dernier recours.
      result = { outcome: 'invalid' };
    } else if (email === DemoAuthGateway.DEMO_SUSPENDED_EMAIL) {
      // Compte fictif suspendu : démontre l'état « accès interdit ».
      result = { outcome: 'forbidden' };
    } else if (email === DemoAuthGateway.DEMO_ENROLL_EMAIL) {
      // Compte fictif « première connexion » : impose l'enrôlement du second facteur.
      result = { outcome: 'enrollment-required', challengeId: DemoAuthGateway.CHALLENGE_ID };
    } else {
      // Démonstration accueillante : TOUT autre identifiant non vide mène à la vérification
      // 2FA. Le code de vérification (123456) reste le seul secret de la démo. En production,
      // l'authentification native du backend valide réellement l'identité et le mot de passe.
      result = { outcome: 'mfa-required', challengeId: DemoAuthGateway.CHALLENGE_ID };
    }
    return of(result).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  verifyCode(challengeId: string, code: string, space: AuthSpace): Observable<VerificationResult> {
    const valid =
      challengeId === DemoAuthGateway.CHALLENGE_ID && code === DemoAuthGateway.DEMO_CODE;
    // Racine de l'espace plutôt qu'un écran en dur : chacune porte déjà sa propre
    // destination par défaut, qui reste ainsi le seul endroit à maintenir.
    const result: VerificationResult = valid
      ? { outcome: 'authenticated', redirectTo: space === 'admin' ? '/admin' : '/member' }
      : { outcome: 'invalid-code' };
    return of(result).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  resendCode(): Observable<void> {
    return of(undefined).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  beginTotpEnrollment(): Observable<TotpEnrollment> {
    // Secret RÉEL généré localement : le QR est scannable par Microsoft Authenticator et
    // les codes seront vraiment vérifiés. Rien n'est persisté ni journalisé.
    const secret = randomBase32Secret();
    this.activeSecret = secret;
    const account = DemoAuthGateway.DEMO_EMAIL;
    const otpauthUri = buildOtpauthUri({ issuer: 'CNPM', account, secret });
    const enrollment$ = renderOtpauthQr(otpauthUri).then(
      (qrImage): TotpEnrollment => ({
        enrollmentId: DemoAuthGateway.ENROLLMENT_ID,
        qrImage,
        manualKey: formatManualKey(secret),
        issuer: 'CNPM',
        account,
      }),
    );
    return from(enrollment$).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  activateTotp(
    enrollmentId: string,
    code: string,
    space: AuthSpace,
  ): Observable<TotpActivationResult> {
    const secret = this.activeSecret;
    const activation$ = (async (): Promise<TotpActivationResult> => {
      if (enrollmentId !== DemoAuthGateway.ENROLLMENT_ID || secret === null) {
        return { outcome: 'invalid-code' };
      }
      const step = await validateTotp(secret, code);
      if (step < 0) {
        return { outcome: 'invalid-code' };
      }
      // Enrôlement confirmé : on remet le secret à zéro et on délivre des codes de secours
      // mono-usage, comme SafeX (à conserver hors de l'appareil d'authentification).
      this.activeSecret = null;
      return {
        outcome: 'activated',
        redirectTo: space === 'admin' ? '/admin' : '/member',
        recoveryCodes: generateRecoveryCodes(),
      };
    })();
    return from(activation$).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }
}
