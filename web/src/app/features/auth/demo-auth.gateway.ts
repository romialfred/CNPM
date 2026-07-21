import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
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
 * QR de DÉMONSTRATION, en SVG.
 *
 * Ce n'est pas un vrai QR encodant un secret : en production, l'image provient de
 * Keycloak. Le motif est purement décoratif et déterministe (aucune génération de QR
 * côté client), et l'écran l'annonce explicitement comme un aperçu de démonstration.
 * On évite `btoa` (unicode fragile) : le SVG est encodé par `encodeURIComponent`.
 */
function demoQrImage(): string {
  const modules = 21;
  const rects: string[] = [];
  const finder = (ox: number, oy: number): void => {
    rects.push(`<rect x="${ox}" y="${oy}" width="7" height="7" fill="#0B123B"/>`);
    rects.push(`<rect x="${ox + 1}" y="${oy + 1}" width="5" height="5" fill="#fff"/>`);
    rects.push(`<rect x="${ox + 2}" y="${oy + 2}" width="3" height="3" fill="#0B123B"/>`);
  };
  const inFinder = (x: number, y: number): boolean =>
    (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
  finder(0, 0);
  finder(14, 0);
  finder(0, 14);
  for (let y = 0; y < modules; y += 1) {
    for (let x = 0; x < modules; x += 1) {
      if (!inFinder(x, y) && (x * 7 + y * 13 + 3) % 5 === 0) {
        rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#0B123B"/>`);
      }
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${modules} ${modules}" ` +
    `shape-rendering="crispEdges"><rect width="${modules}" height="${modules}" fill="#fff"/>` +
    rects.join('') +
    '</svg>';
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
    // Clé de démonstration, manifestement fictive. En production, secret et QR viennent
    // de Keycloak ; ici, ils ne protègent rien et ne sont jamais persistés.
    const enrollment: TotpEnrollment = {
      enrollmentId: 'demo-enrollment',
      qrImage: demoQrImage(),
      manualKey: 'JBSW Y3DP EHPK 3PXP DEMO',
      issuer: 'CNPM',
      account: DemoAuthGateway.DEMO_EMAIL,
    };
    return of(enrollment).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }

  activateTotp(
    enrollmentId: string,
    code: string,
    space: AuthSpace,
  ): Observable<TotpActivationResult> {
    // Même code fictif que la vérification : un seul secret de démonstration à retenir.
    const valid = enrollmentId === 'demo-enrollment' && code === DemoAuthGateway.DEMO_CODE;
    const result: TotpActivationResult = valid
      ? { outcome: 'activated', redirectTo: space === 'admin' ? '/admin' : '/member' }
      : { outcome: 'invalid-code' };
    return of(result).pipe(delay(DemoAuthGateway.LATENCY_MS));
  }
}
