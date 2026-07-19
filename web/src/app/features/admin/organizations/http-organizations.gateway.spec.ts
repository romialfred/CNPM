import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi } from '../../../core/api/api.config';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { OrganizationConflictError } from './organizations-gateway';
import type { OrganizationQuery } from './organizations-gateway';
import { HttpOrganizationsGateway } from './http-organizations.gateway';

const QUERY: OrganizationQuery = {
  search: '  atelier  ',
  status: 'ACTIVE',
  organizationType: 'Société anonyme',
  sectorCode: 'FABRICATION',
  sort: { key: 'legalName', direction: 'desc' },
  page: 2,
  pageSize: 25,
};

const RESPONSE = {
  id: '10000000-0000-4000-8000-000000000001',
  legalName: 'Atelier',
  tradeName: null,
  organizationType: 'Société anonyme',
  sectorCode: 'FABRICATION',
  status: 'ACTIVE',
  riskLevel: 'NORMAL',
  version: 4,
};

describe('HttpOrganizationsGateway', () => {
  let gateway: HttpOrganizationsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpOrganizationsGateway,
      ],
    });
    gateway = TestBed.inject(HttpOrganizationsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('traduit filtres, tri et pagination vers GET /organizations', async () => {
    const resultPromise = firstValueFrom(gateway.search(QUERY));
    const request = http.expectOne((candidate) => candidate.url === '/v1/organizations');

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('25');
    expect(request.request.params.get('search')).toBe('atelier');
    expect(request.request.params.get('status')).toBe('ACTIVE');
    expect(request.request.params.get('organizationType')).toBe('Société anonyme');
    expect(request.request.params.get('sectorCode')).toBe('FABRICATION');
    expect(request.request.params.get('sort')).toBe('legalName,desc');

    request.flush({ items: [RESPONSE], page: 1, size: 25, totalElements: 1, totalPages: 1 });
    await expect(resultPromise).resolves.toEqual({ rows: [RESPONSE], totalItems: 1 });
  });

  it('charge la fiche cœur sur GET /organizations/{id}', async () => {
    const resultPromise = firstValueFrom(gateway.get(RESPONSE.id));
    http.expectOne(`/v1/organizations/${RESPONSE.id}`).flush(RESPONSE);
    await expect(resultPromise).resolves.toEqual(RESPONSE);
  });

  it('envoie PATCH avec la version dans If-Match', async () => {
    const changes = {
      legalName: 'Atelier révisé',
      tradeName: '',
      organizationType: 'Société anonyme',
      sectorCode: 'FABRICATION',
    };
    const resultPromise = firstValueFrom(gateway.update(RESPONSE.id, 4, changes));
    const request = http.expectOne(`/v1/organizations/${RESPONSE.id}`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('If-Match')).toBe('4');
    expect(request.request.body).toEqual(changes);
    request.flush({ ...RESPONSE, ...changes, tradeName: null, version: 5 });
    await expect(resultPromise).resolves.toMatchObject({
      legalName: changes.legalName,
      version: 5,
    });
  });

  it('transforme un 409 en conflit de verrou optimiste', async () => {
    const resultPromise = firstValueFrom(
      gateway.update(RESPONSE.id, 3, {
        legalName: RESPONSE.legalName,
        tradeName: '',
        organizationType: RESPONSE.organizationType,
        sectorCode: RESPONSE.sectorCode,
      }),
    );
    http.expectOne(`/v1/organizations/${RESPONSE.id}`).flush(
      {
        timestamp: '2026-07-19T08:00:00Z',
        status: 409,
        code: 'STATE_CONFLICT',
        message: 'Version obsolète',
        correlationId: '30000000-0000-4000-8000-000000000001',
      },
      { status: 409, statusText: 'Conflict' },
    );
    await expect(resultPromise).rejects.toBeInstanceOf(OrganizationConflictError);
  });
});
