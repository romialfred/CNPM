import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberDirectoryGateway } from './http-member-directory.gateway';

describe('HttpMemberDirectoryGateway', () => {
  let gateway: HttpMemberDirectoryGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberDirectoryGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberDirectoryGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('liste les organisations membres actives', async () => {
    const result = firstValueFrom(gateway.list(''));
    const request = http.expectOne((c) => c.url.includes('/portal/directory'));
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [
        {
          id: 'o1',
          name: 'Sahel Agro',
          sector: 'AGRI',
          category: 'ENTREPRISE',
          memberSince: '2021-03-15',
        },
      ],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
    });
    const organizations = await result;
    expect(organizations[0].name).toBe('Sahel Agro');
    expect(organizations[0].memberSince).toBe('2021-03-15');
  });

  it('transmet le filtre de recherche', async () => {
    const result = firstValueFrom(gateway.list('agro'));
    const request = http.expectOne((c) => c.url.includes('/portal/directory'));
    expect(request.request.url).toContain('search=agro');
    request.flush({ items: [], page: 0, size: 100, totalElements: 0, totalPages: 0 });
    expect(await result).toEqual([]);
  });
});
