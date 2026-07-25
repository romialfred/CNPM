import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { CNPM_UUID_FACTORY } from '../../../core/api/request-id';
import {
  AdminSecurityAccessError,
  type NewAccountInput,
  type SecurityAccount,
} from './admin-security-gateway';
import { HttpAdminSecurityGateway } from './http-admin-security.gateway';

const ACCOUNT_ID = '10000000-0000-4000-8000-000000000001';
const ROLE_ID = '20000000-0000-4000-8000-000000000001';
const KEY_ONE = '30000000-0000-4000-8000-000000000001';
const KEY_TWO = '30000000-0000-4000-8000-000000000002';

const ACCOUNT: SecurityAccount = {
  id: ACCOUNT_ID,
  fullName: 'Aminata Coulibaly',
  email: 'aminata.coulibaly@example.test',
  roleId: ROLE_ID,
  roleLabel: 'Administrateur sécurité',
  status: 'INVITED',
  twoFactor: 'PENDING',
  lastLoginAt: null,
  lastLoginLabel: null,
  activeSessions: 0,
};

const INPUT: NewAccountInput = {
  accountType: 'PROFESSIONAL',
  firstName: 'Aminata',
  lastName: 'Coulibaly',
  email: 'Aminata.Coulibaly@example.test',
  roleId: ROLE_ID,
};

function problem(status: number) {
  return {
    timestamp: '2026-07-23T08:00:00Z',
    status,
    code: status === 403 ? 'FORBIDDEN' : 'STATE_CONFLICT',
    message: status === 403 ? 'Accès refusé' : 'Conflit',
    correlationId: '40000000-0000-4000-8000-000000000001',
  };
}

describe('HttpAdminSecurityGateway — écritures sur les comptes', () => {
  let gateway: HttpAdminSecurityGateway;
  let http: HttpTestingController;
  let keyIndex: number;

  beforeEach(() => {
    keyIndex = 0;
    const keys = [KEY_ONE, KEY_TWO];
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        { provide: CNPM_UUID_FACTORY, useValue: () => keys[keyIndex++] ?? KEY_TWO },
        HttpAdminSecurityGateway,
      ],
    });
    gateway = TestBed.inject(HttpAdminSecurityGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('crée un compte avec une clé d’idempotence', async () => {
    const result = firstValueFrom(gateway.createAccount(INPUT));

    const request = http.expectOne('/v1/admin/security/accounts');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    // Aucun mot de passe ne part du navigateur : le corps ne porte que l'identité.
    expect(Object.keys(request.request.body as object)).not.toContain('password');
    request.flush(ACCOUNT);

    expect((await result).id).toBe(ACCOUNT_ID);
  });

  it('rejoue la même commande avec la même clé après une panne réseau', async () => {
    const first = firstValueFrom(gateway.createAccount(INPUT));
    http
      .expectOne('/v1/admin/security/accounts')
      .error(new ProgressEvent('offline'), { status: 0 });
    await first.catch(() => undefined);

    const retry = firstValueFrom(gateway.createAccount(INPUT));
    const retried = http.expectOne('/v1/admin/security/accounts');
    // Même intention, même clé : le rejeu ne peut pas ouvrir un second compte.
    expect(retried.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    retried.flush(ACCOUNT);
    await retry;
  });

  it('libère la clé après un refus définitif — une nouvelle demande est une nouvelle commande', async () => {
    const first = firstValueFrom(gateway.createAccount(INPUT));
    http.expectOne('/v1/admin/security/accounts').flush(problem(409), {
      status: 409,
      statusText: 'Conflict',
    });
    await first.catch(() => undefined);

    const second = firstValueFrom(gateway.createAccount(INPUT));
    const retried = http.expectOne('/v1/admin/security/accounts');
    expect(retried.request.headers.get('Idempotency-Key')).toBe(KEY_TWO);
    retried.flush(ACCOUNT);
    await second;
  });

  it('suspend un compte en transmettant le motif', async () => {
    const result = firstValueFrom(
      gateway.changeAccountStatus(ACCOUNT_ID, 'SUSPENDED', 'Départ de l’organisation'),
    );

    const request = http.expectOne(`/v1/admin/security/accounts/${ACCOUNT_ID}/status`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      status: 'SUSPENDED',
      reason: 'Départ de l’organisation',
    });
    request.flush({ ...ACCOUNT, status: 'SUSPENDED' });

    expect((await result).status).toBe('SUSPENDED');
  });

  it('réinitialise le second facteur en transmettant le motif', async () => {
    const result = firstValueFrom(gateway.resetTwoFactor(ACCOUNT_ID, 'Téléphone perdu'));

    const request = http.expectOne(`/v1/admin/security/accounts/${ACCOUNT_ID}/two-factor/reset`);
    expect(request.request.body).toEqual({ reason: 'Téléphone perdu' });
    request.flush({ ...ACCOUNT, twoFactor: 'PENDING' });

    expect((await result).twoFactor).toBe('PENDING');
  });

  it('traduit un refus d’habilitation dans le vocabulaire de l’écran', async () => {
    const result = firstValueFrom(gateway.resetTwoFactor(ACCOUNT_ID, 'Téléphone perdu'));
    http
      .expectOne(`/v1/admin/security/accounts/${ACCOUNT_ID}/two-factor/reset`)
      .flush(problem(403), { status: 403, statusText: 'Forbidden' });

    await expect(result).rejects.toBeInstanceOf(AdminSecurityAccessError);
  });

  it('émet un lien d’accès et rend le jeton une seule fois', async () => {
    const result = firstValueFrom(gateway.issueCredentialToken(ACCOUNT_ID));

    const request = http.expectOne(`/v1/admin/security/accounts/${ACCOUNT_ID}/password-reset`);
    expect(request.request.method).toBe('POST');
    request.flush({ token: 'jeton-unique', expiresAt: '2026-07-25T10:00:00Z', activation: true });

    const issued = await result;
    expect(issued.token).toBe('jeton-unique');
    expect(issued.activation).toBe(true);
  });

  it('traduit un refus d’habilitation lors de l’émission d’un lien', async () => {
    const result = firstValueFrom(gateway.issueCredentialToken(ACCOUNT_ID));
    http
      .expectOne(`/v1/admin/security/accounts/${ACCOUNT_ID}/password-reset`)
      .flush(problem(403), { status: 403, statusText: 'Forbidden' });

    await expect(result).rejects.toBeInstanceOf(AdminSecurityAccessError);
  });

  it('échoue explicitement sur la matrice, qu’aucun endpoint ne modifie encore', async () => {
    await expect(
      firstValueFrom(gateway.setPermissionGrant('perm-1', ROLE_ID, true)),
    ).rejects.toThrow(/lecture seule/);
    http.expectNone(() => true);
  });
});
