import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { GroupAccessError, GroupNotFoundError } from './groups-gateway';
import { HttpGroupsGateway } from './http-groups.gateway';

const GROUP = {
  id: '20000000-0000-4000-8000-000000000001',
  code: 'GRP-AGRI',
  name: 'Groupement agricole',
  status: 'ACTIVE',
  version: 0,
};

function problem(status: 403 | 404) {
  return {
    timestamp: '2026-07-19T08:00:00Z',
    status,
    code: status === 403 ? 'FORBIDDEN' : 'RESOURCE_NOT_FOUND',
    message: status === 403 ? 'Accès refusé' : 'Groupement introuvable',
    correlationId: '40000000-0000-4000-8000-000000000001',
  };
}

describe('HttpGroupsGateway', () => {
  let gateway: HttpGroupsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpGroupsGateway,
      ],
    });
    gateway = TestBed.inject(HttpGroupsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('convertit la page lisible vers GET /professional-groups', async () => {
    const resultPromise = firstValueFrom(gateway.list({ page: 2, pageSize: 25 }));
    const request = http.expectOne('/v1/professional-groups?page=1&size=25');

    expect(request.request.method).toBe('GET');
    request.flush({
      items: [GROUP],
      page: 1,
      size: 25,
      totalElements: 39,
      totalPages: 2,
    });

    await expect(resultPromise).resolves.toEqual({
      rows: [{ ...GROUP, sectorCode: null }],
      totalItems: 39,
    });
  });

  it('charge la fiche typée et conserve un secteur nullable', async () => {
    const resultPromise = firstValueFrom(gateway.get(GROUP.id));
    http.expectOne(`/v1/professional-groups/${GROUP.id}`).flush(GROUP);
    await expect(resultPromise).resolves.toEqual({ ...GROUP, sectorCode: null });
  });

  it('traduit les réponses 403 et 404 en erreurs de domaine', async () => {
    const forbidden = firstValueFrom(gateway.list({ page: 1, pageSize: 10 }));
    http
      .expectOne('/v1/professional-groups?page=0&size=10')
      .flush(problem(403), { status: 403, statusText: 'Forbidden' });
    await expect(forbidden).rejects.toBeInstanceOf(GroupAccessError);

    const missing = firstValueFrom(gateway.get(GROUP.id));
    http
      .expectOne(`/v1/professional-groups/${GROUP.id}`)
      .flush(problem(404), { status: 404, statusText: 'Not Found' });
    await expect(missing).rejects.toBeInstanceOf(GroupNotFoundError);
  });
});
