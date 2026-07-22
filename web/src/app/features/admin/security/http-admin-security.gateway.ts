import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, type Observable, throwError } from 'rxjs';
import { buildCnpmApiUrl, CNPM_API_BASE_URL } from '../../../core/api/api.config';
import { CnpmApiError } from '../../../core/api/api-problem';
import {
  type AccountStatus,
  AdminSecurityAccessError,
  type AdminSecurityGateway,
  type AdminSecurityQuery,
  type AdminSecuritySnapshot,
  type NewAccountInput,
  type PermissionRow,
  type SecurityAccount,
} from './admin-security-gateway';

/**
 * Adaptateur HTTP de l'écran « Administration et sécurité » (BO-030).
 *
 * <p>La lecture ({@code load}) provient de {@code GET /admin/security/snapshot} : le service
 * assemble comptes, rôles et matrice de permissions depuis {@code iam}. La recherche filtre
 * l'instantané côté client (les compteurs restent ceux d'avant recherche). Les mutations
 * (création de compte, statut, réinitialisation 2FA, matrice) ne sont pas raccordées à ce
 * stade : elles échouent explicitement plutôt que de simuler une écriture.
 */
@Injectable()
export class HttpAdminSecurityGateway implements AdminSecurityGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(CNPM_API_BASE_URL);

  load(query: AdminSecurityQuery): Observable<AdminSecuritySnapshot> {
    return this.http
      .get<AdminSecuritySnapshot>(buildCnpmApiUrl(this.baseUrl, 'admin/security/snapshot'))
      .pipe(
        map((snapshot) => this.filter(snapshot, query.search)),
        catchError((error: unknown) =>
          throwError(() =>
            error instanceof CnpmApiError && error.category === 'authorization'
              ? new AdminSecurityAccessError()
              : error,
          ),
        ),
      );
  }

  createAccount(input: NewAccountInput): Observable<SecurityAccount> {
    return this.unavailable(`la création du compte « ${input.email} »`);
  }

  changeAccountStatus(accountId: string, status: AccountStatus): Observable<SecurityAccount> {
    return this.unavailable(`le passage du compte ${accountId} au statut ${status}`);
  }

  resetTwoFactor(accountId: string, reason: string): Observable<SecurityAccount> {
    return this.unavailable(`la réinitialisation du second facteur du compte ${accountId} (${reason})`);
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
   * Les écritures ne sont pas raccordées à ce stade : on échoue explicitement (en nommant
   * l'action tentée) plutôt que de simuler une mutation.
   */
  private unavailable<T>(action: string): Observable<T> {
    return throwError(
      () => new Error(`Action indisponible (${action}) : la gestion des comptes est en lecture seule.`),
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
