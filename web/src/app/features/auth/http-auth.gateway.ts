import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, from, map, type Observable, of, switchMap, throwError } from 'rxjs';
import { CNPM_API_BASE_URL, buildCnpmApiUrl } from '../../core/api/api.config';
import { CnpmApiError } from '../../core/api/api-problem';
import { NativeSessionStore } from '../../core/auth/native-session.store';
import { renderOtpauthQr } from '../../core/auth/qr';
import { formatManualKey } from '../../core/auth/totp';
import type {
  AuthGateway,
  AuthSpace,
  CredentialsRequest,
  CredentialsResult,
  TotpActivationResult,
  TotpEnrollment,
  VerificationResult,
} from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';

interface EnrollStartResponse {
  readonly manualKey: string;
  readonly otpAuthUri: string;
}

interface TokenResponse {
  readonly status?: string;
  readonly accessToken?: string;
  readonly recoveryCodes?: readonly string[];
}

/** Extrait statut, code d'erreur et challenge d'une erreur, qu'elle soit brute ou mappée. */
function readAuthError(error: unknown): {
  readonly status: number;
  readonly errorCode?: string;
  readonly challenge?: string;
} {
  const fromBody = (body: unknown, status: number) => {
    const record = (body ?? {}) as Record<string, unknown>;
    return {
      status,
      errorCode: typeof record['errorCode'] === 'string' ? record['errorCode'] : undefined,
      challenge: typeof record['challenge'] === 'string' ? record['challenge'] : undefined,
    };
  };
  if (error instanceof CnpmApiError) {
    // L'intercepteur `apiProblem` mappe la réponse ; le corps brut reste dans `cause`.
    const cause = error.cause as HttpErrorResponse | undefined;
    return fromBody(cause?.error, error.status);
  }
  if (error instanceof HttpErrorResponse) {
    return fromBody(error.error, error.status);
  }
  return { status: 0 };
}

/** Libellé de compte de l'URI otpauth (`otpauth://totp/CNPM:<login>?...`), pour l'alt du QR. */
function accountFromUri(otpAuthUri: string): string {
  const label = decodeURIComponent(/totp\/([^?]+)/u.exec(otpAuthUri)?.[1] ?? '');
  const account = label.split(':').slice(1).join(':').trim();
  return account || 'votre compte';
}

/**
 * Adaptateur HTTP de l'authentification NATIVE (AUTH-DEC-020).
 *
 * Parle au backend applicatif : `/auth/login` (mot de passe → challenge de second facteur),
 * `/auth/mfa/enroll/*` (enrôlement + codes de secours) et `/auth/mfa/verify`. Le jeton émis
 * après un second facteur validé est rangé dans {@link NativeSessionStore} pour l'intercepteur
 * Bearer. Aucun mot de passe n'est jamais journalisé ni mis en cache.
 */
@Injectable()
export class HttpAuthGateway implements AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly flow = inject(AuthFlowStore);
  private readonly session = inject(NativeSessionStore);

  private url(path: string): string {
    return buildCnpmApiUrl(this.baseUrl, path);
  }

  submitCredentials(request: CredentialsRequest): Observable<CredentialsResult> {
    return this.http
      .post(this.url('auth/login'), { email: request.email, password: request.password })
      .pipe(
        // Sous 2FA universel, `/auth/login` répond toujours 428 : un 2xx est inattendu.
        map((): CredentialsResult => {
          throw new Error('LOGIN_UNEXPECTED_SUCCESS');
        }),
        catchError((error: unknown): Observable<CredentialsResult> => {
          const { status, errorCode, challenge } = readAuthError(error);
          if (status === 428 && errorCode === 'MFA_REQUIRED' && challenge) {
            return of({ outcome: 'mfa-required', challengeId: challenge });
          }
          if (status === 428 && errorCode === 'MFA_ENROLLMENT_REQUIRED' && challenge) {
            return of({ outcome: 'enrollment-required', challengeId: challenge });
          }
          if (status === 401) {
            return of({ outcome: 'invalid' });
          }
          if (status === 403) {
            return of({ outcome: 'forbidden' });
          }
          // Réseau / serveur : on laisse remonter, la page annonce l'indisponibilité.
          return throwError(() => error);
        }),
      );
  }

  verifyCode(challengeId: string, code: string, space: AuthSpace): Observable<VerificationResult> {
    return this.http
      .post<TokenResponse>(this.url('auth/mfa/verify'), { challenge: challengeId, code })
      .pipe(
        map((body): VerificationResult => {
          if (body.accessToken) {
            this.session.set(body.accessToken);
          }
          return { outcome: 'authenticated', redirectTo: space === 'admin' ? '/admin' : '/member' };
        }),
        catchError((): Observable<VerificationResult> => of({ outcome: 'invalid-code' })),
      );
  }

  resendCode(): Observable<void> {
    // TOTP : le code est basé sur le temps, il n'y a rien à renvoyer.
    return of(undefined);
  }

  beginTotpEnrollment(): Observable<TotpEnrollment> {
    const challenge = this.flow.activeChallenge()?.id ?? '';
    return this.http
      .post<EnrollStartResponse>(this.url('auth/mfa/enroll/start'), { challenge })
      .pipe(
        switchMap((body) =>
          from(renderOtpauthQr(body.otpAuthUri)).pipe(
            map(
              (qrImage): TotpEnrollment => ({
                enrollmentId: challenge,
                qrImage,
                manualKey: formatManualKey(body.manualKey),
                issuer: 'CNPM',
                account: accountFromUri(body.otpAuthUri),
              }),
            ),
          ),
        ),
      );
  }

  activateTotp(
    enrollmentId: string,
    code: string,
    space: AuthSpace,
  ): Observable<TotpActivationResult> {
    const challenge = this.flow.activeChallenge()?.id ?? enrollmentId;
    return this.http
      .post<TokenResponse>(this.url('auth/mfa/enroll/confirm'), { challenge, code })
      .pipe(
        map((body): TotpActivationResult => {
          if (body.accessToken) {
            this.session.set(body.accessToken);
          }
          return {
            outcome: 'activated',
            redirectTo: space === 'admin' ? '/admin' : '/member',
            recoveryCodes: body.recoveryCodes,
          };
        }),
        catchError((): Observable<TotpActivationResult> => of({ outcome: 'invalid-code' })),
      );
  }
}
