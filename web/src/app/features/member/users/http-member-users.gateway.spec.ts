import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberUsersGateway } from './http-member-users.gateway';
import { MemberUsersNoMembershipError } from './member-users-gateway';

describe('HttpMemberUsersGateway', () => {
  let gateway: HttpMemberUsersGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberUsersGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberUsersGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('liste les utilisateurs de l’organisation', async () => {
    const result = firstValueFrom(gateway.list());
    const request = http.expectOne((c) => c.url.includes('/portal/users'));
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [
        {
          id: 'u1',
          displayName: 'Awa Traoré',
          email: 'awa@example.test',
          roleLabel: 'Administrateur de l’entreprise membre',
          status: 'ACTIVE',
          lastActivityAt: '2026-07-24T10:00:00Z',
        },
      ],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });
    const users = await result;
    expect(users[0].displayName).toBe('Awa Traoré');
    expect(users[0].status).toBe('ACTIVE');
  });

  it('traduit un 404 en « aucune adhésion rattachée »', async () => {
    const result = firstValueFrom(gateway.list());
    http.expectOne((c) => c.url.includes('/portal/users')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Aucune adhésion.',
        correlationId: '40000000-0000-4000-8000-000000000006',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(result).rejects.toBeInstanceOf(MemberUsersNoMembershipError);
  });
});
