import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi } from '../../../core/api/api.config';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import {
  MemberEditAccessError,
  MemberEditConflictError,
  MemberEditNotFoundError,
  MemberEditValidationError,
} from './member-edit-gateway';
import { HttpMemberEditGateway } from './http-member-edit.gateway';

const MEMBER_ID = '10000000-0000-4000-8000-000000000001';
const RESPONSE = {
  id: MEMBER_ID,
  legalName: 'Ateliers Nimba',
  tradeName: null,
  organizationType: 'Société anonyme',
  sectorCode: 'FABRICATION_01',
  status: 'ACTIVE',
  riskLevel: 'NORMAL',
  version: 4,
};

function problem(status: number) {
  return {
    timestamp: '2026-07-19T08:00:00Z',
    status,
    code: `ERR_${status}`,
    message: `Erreur technique ${status}`,
    correlationId: '30000000-0000-4000-8000-000000000001',
  };
}

describe('HttpMemberEditGateway', () => {
  let gateway: HttpMemberEditGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberEditGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberEditGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge le noyau membre depuis le contrat GET /organizations/{id}', async () => {
    const resultPromise = firstValueFrom(gateway.load(MEMBER_ID));
    const request = http.expectOne(`/v1/organizations/${MEMBER_ID}`);
    expect(request.request.method).toBe('GET');
    request.flush(RESPONSE);
    await expect(resultPromise).resolves.toEqual(RESPONSE);
  });

  it('envoie uniquement les quatre champs contractuels avec If-Match', async () => {
    const changes = {
      legalName: 'Ateliers Nimba révisés',
      tradeName: 'Nimba Atelier',
      organizationType: 'Société anonyme',
      sectorCode: 'FABRICATION_01',
    };
    const resultPromise = firstValueFrom(gateway.update(MEMBER_ID, 4, changes));
    const request = http.expectOne(`/v1/organizations/${MEMBER_ID}`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('If-Match')).toBe('4');
    expect(request.request.body).toEqual(changes);
    request.flush({ ...RESPONSE, ...changes, version: 5 });
    await expect(resultPromise).resolves.toMatchObject({
      legalName: changes.legalName,
      version: 5,
    });
  });

  it.each([
    [403, MemberEditAccessError],
    [404, MemberEditNotFoundError],
    [409, MemberEditConflictError],
    [422, MemberEditValidationError],
  ] as const)('traduit le statut %s vers une erreur du domaine', async (status, expectedType) => {
    const resultPromise =
      status === 403 || status === 404
        ? firstValueFrom(gateway.load(MEMBER_ID))
        : firstValueFrom(
            gateway.update(MEMBER_ID, 3, {
              legalName: RESPONSE.legalName,
              tradeName: '',
              organizationType: RESPONSE.organizationType,
              sectorCode: RESPONSE.sectorCode,
            }),
          );
    http.expectOne(`/v1/organizations/${MEMBER_ID}`).flush(problem(status), {
      status,
      statusText: 'Erreur technique',
    });
    await expect(resultPromise).rejects.toBeInstanceOf(expectedType);
  });
});
