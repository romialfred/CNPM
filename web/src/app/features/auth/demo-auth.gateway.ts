import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import type {
  AuthGateway,
  CredentialsRequest,
  CredentialsResult,
  VerificationResult,
} from './auth-gateway';

/**
 * Adaptateur de démonstration déterministe pour l'écran pilote AUTH-001.
 *
 * NON destiné à la production : il ne contient AUCUNE règle métier réelle et ne parle
 * à aucun fournisseur d'identité. Il permet d'exercer visuellement et par test tous
 * les états (chargement, erreur neutre, succès, code invalide) de façon reproductible,
 * avant le câblage réel à Keycloak. Les identifiants ci-dessous sont fictifs et
 * publics, jamais des données de membre réelles.
 */
@Injectable()
export class DemoAuthGateway implements AuthGateway {
  /** Identifiants fictifs acceptés par la démo. */
  private static readonly DEMO_EMAIL = 'demo.agent@cnpm.example';
  private static readonly DEMO_PASSWORD = 'demo-pass';
  /** Identifiant fictif permettant d'exercer l'état « accès interdit ». */
  private static readonly DEMO_SUSPENDED_EMAIL = 'demo.suspendu@cnpm.example';
  private static readonly DEMO_CODE = '123456';
  private static readonly CHALLENGE_ID = 'demo-challenge';
  private static readonly LATENCY_MS = 400;

  submitCredentials(request: CredentialsRequest): Observable<CredentialsResult> {
    const email = request.email.trim().toLowerCase();
    const passwordMatches = request.password === DemoAuthGateway.DEMO_PASSWORD;
    let result: CredentialsResult;
    if (email === DemoAuthGateway.DEMO_SUSPENDED_EMAIL && passwordMatches) {
      result = { outcome: 'forbidden' };
    } else if (email === DemoAuthGateway.DEMO_EMAIL && passwordMatches) {
      result = { outcome: 'mfa-required', challengeId: DemoAuthGateway.CHALLENGE_ID };
    } else {
      result = { outcome: 'invalid' };
    }
    return of(result).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  verifyCode(challengeId: string, code: string): Observable<VerificationResult> {
    const valid =
      challengeId === DemoAuthGateway.CHALLENGE_ID && code === DemoAuthGateway.DEMO_CODE;
    const result: VerificationResult = valid
      ? { outcome: 'authenticated', redirectTo: '/' }
      : { outcome: 'invalid-code' };
    return of(result).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  resendCode(): Observable<void> {
    return of(undefined).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }
}
