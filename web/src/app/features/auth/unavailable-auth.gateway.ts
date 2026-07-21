import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type {
  AuthGateway,
  CredentialsResult,
  TotpActivationResult,
  TotpEnrollment,
  VerificationResult,
} from './auth-gateway';

/** Profil fermé tant que le client OIDC/PKCE Keycloak n'est pas livré. */
@Injectable()
export class UnavailableAuthGateway implements AuthGateway {
  submitCredentials(): Observable<CredentialsResult> {
    return unavailableFeature$('AUTH-001');
  }

  verifyCode(): Observable<VerificationResult> {
    return unavailableFeature$('AUTH-001');
  }

  resendCode(): Observable<void> {
    return unavailableFeature$('AUTH-001');
  }

  beginTotpEnrollment(): Observable<TotpEnrollment> {
    return unavailableFeature$('AUTH-007');
  }

  activateTotp(): Observable<TotpActivationResult> {
    return unavailableFeature$('AUTH-007');
  }
}
