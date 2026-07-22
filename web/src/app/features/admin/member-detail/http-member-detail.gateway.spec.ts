import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { MemberDetailAccessError, MemberDetailNotFoundError } from './member-detail-gateway';
import { HttpMemberDetailGateway } from './http-member-detail.gateway';

const ORG = 'a1111111-0000-4000-8000-000000000001';

describe('HttpMemberDetailGateway', () => {
  let gateway: HttpMemberDetailGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberDetailGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberDetailGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('lit GET /organizations/{id}/member-detail par identifiant d’organisation', async () => {
    const promise = firstValueFrom(gateway.load(ORG));
    const request = http.expectOne(`/v1/organizations/${ORG}/member-detail`);
    expect(request.request.method).toBe('GET');
    request.flush({ identity: { code: 'CNPM-2022-0001', organization: 'SOMADIS' } });
    const detail = await promise;
    expect(detail.identity.code).toBe('CNPM-2022-0001');
  });

  it('traduit 403 en MemberDetailAccessError', async () => {
    const promise = firstValueFrom(gateway.load(ORG));
    http.expectOne(`/v1/organizations/${ORG}/member-detail`).flush(
      { code: 'FORBIDDEN', message: 'Accès refusé' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(promise).rejects.toBeInstanceOf(MemberDetailAccessError);
  });

  it('traduit 404 en MemberDetailNotFoundError', async () => {
    const promise = firstValueFrom(gateway.load(ORG));
    http.expectOne(`/v1/organizations/${ORG}/member-detail`).flush(
      { code: 'NOT_FOUND', message: 'Introuvable' },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(promise).rejects.toBeInstanceOf(MemberDetailNotFoundError);
  });
});
