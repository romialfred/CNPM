import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi } from '../../../core/api/api.config';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { AuditAccessError, AuditAuthenticationError, type AuditEventPage } from './audit-gateway';
import { HttpAuditGateway } from './http-audit.gateway';

const RESPONSE: AuditEventPage = {
  items: [
    {
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: '2026-07-19T09:42:00Z',
      actorUserId: '10000000-0000-4000-8000-000000000001',
      actorType: 'USER',
      actionCode: 'AUDIT_VIEWED',
      entityType: 'AUDIT_LOG',
      entityId: null,
      beforeHash: null,
      afterHash: 'a'.repeat(64),
      correlationId: '20000000-0000-4000-8000-000000000001',
    },
  ],
  page: 1,
  size: 25,
  totalElements: 26,
  totalPages: 2,
};

describe('HttpAuditGateway — contrat BO-032', () => {
  let gateway: HttpAuditGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpAuditGateway,
      ],
    });
    gateway = TestBed.inject(HttpAuditGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('appelle uniquement GET /audit-events avec page zéro-indexée et size', async () => {
    const resultPromise = firstValueFrom(gateway.search({ page: 2, size: 25 }));
    const request = http.expectOne((candidate) => candidate.url === '/v1/audit-events');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual(['page', 'size']);
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('25');
    request.flush(RESPONSE);

    await expect(resultPromise).resolves.toEqual(RESPONSE);
  });

  it('traduit le 403 normalisé en refus AUDIT.READ non réessayable', async () => {
    const resultPromise = firstValueFrom(gateway.search({ page: 1, size: 10 }));
    const request = http.expectOne('/v1/audit-events?page=0&size=10');
    request.flush(
      {
        timestamp: '2026-07-19T10:00:00Z',
        status: 403,
        code: 'FORBIDDEN',
        message: 'Permission PERM_AUDIT.READ requise',
        correlationId: '20000000-0000-4000-8000-000000000099',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(resultPromise).rejects.toBeInstanceOf(AuditAccessError);
  });

  it('traduit le 401 normalisé en expiration de session', async () => {
    const resultPromise = firstValueFrom(gateway.search({ page: 1, size: 10 }));
    const request = http.expectOne('/v1/audit-events?page=0&size=10');
    request.flush(
      {
        timestamp: '2026-07-19T10:00:00Z',
        status: 401,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Session expirée',
        correlationId: '20000000-0000-4000-8000-000000000098',
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(resultPromise).rejects.toBeInstanceOf(AuditAuthenticationError);
  });
});
