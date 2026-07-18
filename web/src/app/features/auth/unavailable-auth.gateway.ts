import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { unavailableFeature$ } from '../../core/api/unavailable-feature';
import type {
  AuthGateway,
  CredentialsResult,
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
}
