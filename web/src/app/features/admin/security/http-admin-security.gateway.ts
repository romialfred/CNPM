import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, defer, map, type Observable, tap, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import {
  type AccountStatus,
  AdminSecurityAccessError,
  type AdminSecurityGateway,
  type AdminSecurityQuery,
  type AdminSecuritySnapshot,
  type CredentialTokenResult,
  type NewAccountInput,
  type PermissionRow,
  type SecurityAccount,
} from './admin-security-gateway';

/**
 * Adaptateur HTTP de l'écran « Administration et sécurité » (BO-030).
 *
 * <p>La lecture ({@code load}) provient de {@code GET /admin/security/snapshot} : le service
 * assemble comptes, rôles et matrice de permissions depuis {@code iam}. La recherche filtre
 * l'instantané côté client (les compteurs restent ceux d'avant recherche).
 *
 * <p>Les écritures sur les comptes — création, suspension/réactivation, réinitialisation
 * du second facteur — sont raccordées aux endpoints dédiés, qui portent l'habilitation,
 * la transaction et l'audit. La matrice des permissions reste en lecture : aucun endpoint
 * ne la modifie encore, et l'adaptateur échoue explicitement plutôt que de simuler une
 * écriture qui n'aurait pas lieu.
 */
@Injectable()
export class HttpAdminSecurityGateway implements AdminSecurityGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);
  private readonly idempotencyKeys = inject(IdempotencyKeyService);

  load(query: AdminSecurityQuery): Observable<AdminSecuritySnapshot> {
    return this.http
      .get<AdminSecuritySnapshot>(buildCnpmApiUrl(this.baseUrl, 'admin/security/snapshot'))
      .pipe(
        // Le backend n'expose pas encore les membres sans compte : défaut vide pour un
        // contrat stable (le sélecteur affichera alors son état « aucun membre »).
        map((snapshot) =>
          this.filter(
            { ...snapshot, membersWithoutAccount: snapshot.membersWithoutAccount ?? [] },
            query.search,
          ),
        ),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof CnpmApiError && error.category === 'authorization'
              ? new AdminSecurityAccessError()
              : error,
          ),
        ),
      );
  }

  /**
   * `POST /admin/security/accounts`. La création est protégée par une clé d'idempotence
   * portée par l'adresse de connexion : une panne réseau suivie d'un nouvel envoi rejoue
   * la même commande au lieu d'ouvrir un second compte. Le serveur reste l'autorité —
   * l'unicité réelle tient à l'adresse, en base.
   */
  createAccount(input: NewAccountInput): Observable<SecurityAccount> {
    return defer(() => {
      const commandId = `admin-security:create-account:${input.email.trim().toLowerCase()}`;
      const idempotencyKey = this.idempotencyKeys.getOrCreate(commandId);
      const headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);

      return this.http
        .post<SecurityAccount>(buildCnpmApiUrl(this.baseUrl, 'admin/security/accounts'), input, {
          headers,
        })
        .pipe(
          tap(() => this.idempotencyKeys.release(commandId)),
          catchError((error: unknown) => {
            // Une panne temporaire conserve la clé pour un vrai rejeu ; une réponse
            // terminale (refus, conflit) libère l'intention.
            if (!(error instanceof CnpmApiError) || !error.retryable) {
              this.idempotencyKeys.release(commandId);
            }
            return throwError(() => this.mapError(error));
          }),
        );
    });
  }

  changeAccountStatus(
    accountId: string,
    status: AccountStatus,
    reason: string,
  ): Observable<SecurityAccount> {
    return this.action(`${accountId}/status`, { status, reason });
  }

  resetTwoFactor(accountId: string, reason: string): Observable<SecurityAccount> {
    return this.action(`${accountId}/two-factor/reset`, { reason });
  }

  deleteAccount(accountId: string, reason: string): Observable<void> {
    return this.http
      .delete<void>(buildCnpmApiUrl(this.baseUrl, `admin/security/accounts/${accountId}`), {
        body: { reason },
      })
      .pipe(catchError((error: unknown) => throwError(() => this.mapError(error))));
  }

  issueCredentialToken(accountId: string): Observable<CredentialTokenResult> {
    return this.http
      .post<CredentialTokenResult>(
        buildCnpmApiUrl(this.baseUrl, `admin/security/accounts/${accountId}/password-reset`),
        {},
      )
      .pipe(catchError((error: unknown) => throwError(() => this.mapError(error))));
  }

  /**
   * Action sur un compte existant. Ces opérations sont idempotentes par nature côté
   * serveur — suspendre un compte déjà suspendu ne produit ni changement ni trace — donc
   * aucune clé d'en-tête n'est nécessaire pour les protéger d'un rejeu.
   */
  private action(path: string, body: object): Observable<SecurityAccount> {
    return this.http
      .post<SecurityAccount>(buildCnpmApiUrl(this.baseUrl, `admin/security/accounts/${path}`), body)
      .pipe(catchError((error: unknown) => throwError(() => this.mapError(error))));
  }

  /** Un refus d'habilitation se dit dans le vocabulaire de l'écran, pas en HTTP brut. */
  private mapError(error: unknown): unknown {
    return error instanceof CnpmApiError && error.category === 'authorization'
      ? new AdminSecurityAccessError()
      : error;
  }

  setPermissionGrant(
    permissionId: string,
    roleId: string,
    granted: boolean,
  ): Observable<PermissionRow> {
    return this.unavailable(
      `la mise à jour de la matrice (permission ${permissionId}, rôle ${roleId}, accordé=${granted})`,
    );
  }

  /**
   * Aucun endpoint ne modifie encore la matrice des permissions : on échoue explicitement
   * (en nommant l'action tentée) plutôt que de simuler une mutation qui n'aurait pas lieu.
   */
  private unavailable<T>(action: string): Observable<T> {
    return throwError(
      () =>
        new Error(`Action indisponible (${action}) : la matrice des droits est en lecture seule.`),
    );
  }

  /** Filtre l'instantané par la recherche ; les compteurs (avant recherche) sont conservés. */
  private filter(snapshot: AdminSecuritySnapshot, search: string): AdminSecuritySnapshot {
    const term = search.trim().toLowerCase();
    if (!term) {
      return snapshot;
    }
    const has = (...values: readonly (string | null | undefined)[]): boolean =>
      values.some((value) => (value ?? '').toLowerCase().includes(term));
    return {
      ...snapshot,
      accounts: snapshot.accounts.filter((account) =>
        has(account.fullName, account.email, account.roleLabel, account.organization),
      ),
      roles: snapshot.roles.filter((role) => has(role.label, role.description)),
      permissions: snapshot.permissions.filter((row) => has(row.label, row.domain)),
    };
  }
}
