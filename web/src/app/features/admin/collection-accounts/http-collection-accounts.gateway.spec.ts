import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpCollectionAccountsGateway } from './http-collection-accounts.gateway';
import {
  CollectionAccountConflictError,
  CollectionAccountsAccessError,
} from './collection-accounts-gateway';

const ACCOUNT = {
  id: '10000000-0000-4000-8000-000000000001',
  channel: 'ORANGE_MONEY',
  label: 'Compte principal CNPM',
  accountHolder: 'COGEF',
  accountIdentifier: '+22370111213',
  bankName: null,
  instructions: null,
  status: 'DRAFT',
  approvedAt: null,
  createdAt: '2026-07-24T00:00:00Z',
};

describe('HttpCollectionAccountsGateway', () => {
  let gateway: HttpCollectionAccountsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpCollectionAccountsGateway,
      ],
    });
    gateway = TestBed.inject(HttpCollectionAccountsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('liste les comptes depuis /collection-accounts', async () => {
    const result = firstValueFrom(gateway.list());
    const request = http.expectOne((candidate) => candidate.url.endsWith('/collection-accounts'));
    expect(request.request.method).toBe('GET');
    request.flush({ accounts: [ACCOUNT] });

    const accounts = await result;
    expect(accounts).toHaveLength(1);
    expect(accounts[0].status).toBe('DRAFT');
    expect(accounts[0].channel).toBe('ORANGE_MONEY');
  });

  it('crée un compte avec une clé d’idempotence', async () => {
    const result = firstValueFrom(
      gateway.create({
        channel: 'ORANGE_MONEY',
        label: 'Compte principal CNPM',
        accountHolder: 'COGEF',
        accountIdentifier: '+22370111213',
      }),
    );
    const request = http.expectOne((candidate) => candidate.url.endsWith('/collection-accounts'));
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    request.flush(ACCOUNT);
    await result;
  });

  it('traduit un 409 en conflit d’état lors d’une validation', async () => {
    const result = firstValueFrom(gateway.approve(ACCOUNT.id));
    http.expectOne((candidate) => candidate.url.endsWith(`/collection-accounts/${ACCOUNT.id}/approve`)).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 409,
        code: 'STATE_CONFLICT',
        message: 'La validation doit être prononcée par un autre agent que l’auteur.',
        correlationId: '40000000-0000-4000-8000-000000000001',
      },
      { status: 409, statusText: 'Conflict' },
    );
    await expect(result).rejects.toBeInstanceOf(CollectionAccountConflictError);
  });

  it('traduit un 403 en accès refusé lors d’une désactivation', async () => {
    const result = firstValueFrom(gateway.disable(ACCOUNT.id, 'Numéro changé'));
    http.expectOne((candidate) => candidate.url.endsWith(`/collection-accounts/${ACCOUNT.id}/disable`)).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 403,
        code: 'FORBIDDEN',
        message: 'Permission insuffisante.',
        correlationId: '40000000-0000-4000-8000-000000000002',
      },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(result).rejects.toBeInstanceOf(CollectionAccountsAccessError);
  });
});
