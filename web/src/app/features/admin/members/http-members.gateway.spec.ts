import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import type { MemberQuery } from './members-gateway';
import { MembersAccessError } from './members-gateway';
import {
  HttpMembersGateway,
  UnknownMembershipStatusError,
  UnsupportedMembersSortError,
} from './http-members.gateway';

const QUERY: MemberQuery = {
  search: '  mali  ',
  status: 'ACTIVE',
  category: 'CAT-A',
  group: 'GROUPE-1',
  sort: { key: 'organization', direction: 'desc' },
  page: 2,
  pageSize: 25,
};

describe('HttpMembersGateway', () => {
  let gateway: HttpMembersGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMembersGateway,
      ],
    });
    gateway = TestBed.inject(HttpMembersGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('traduit la pagination, les filtres et le tri vers le contrat R0', async () => {
    const resultPromise = firstValueFrom(gateway.search(QUERY));
    const request = http.expectOne((candidate) => candidate.url === '/v1/memberships');

    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('25');
    expect(request.request.params.get('search')).toBe('mali');
    expect(request.request.params.get('status')).toBe('ACTIVE');
    expect(request.request.params.get('categoryCode')).toBe('CAT-A');
    expect(request.request.params.get('groupCode')).toBe('GROUPE-1');
    expect(request.request.params.get('sort')).toBe('organizationLegalName,desc');

    request.flush({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          membershipNumber: 'CNPM-2026-001',
          organizationId: '22222222-2222-4222-8222-222222222222',
          organizationLegalName: 'Mali Industrie SA',
          categoryCode: 'CAT-A',
          status: 'ACTIVE',
          joinedAt: '2026-01-15',
          version: 3,
          primaryGroupCode: 'GROUPE-1',
          primaryGroupName: 'Industries',
          primaryContactName: null,
          primaryContactEmail: null,
          primaryContactPhone: null,
        },
      ],
      page: 1,
      size: 25,
      totalElements: 1,
      totalPages: 1,
    });

    // La synthèse (volet, facettes, financiers) vient du read-model reporting.
    http.expectOne('/v1/reporting/member-overview').flush({
      overview: {
        membersTotal: 12,
        active: 9,
        dormant: 3,
        prospects: 2,
        largeContributors: 4,
        expected: 27000000,
        collected: 15300000,
        recoveryRate: 57,
      },
      categories: ['GRANDE_ENTREPRISE', 'PME', 'TPE'],
      groups: ['Industries'],
      financials: [
        { organizationId: '22222222-2222-4222-8222-222222222222', due: 5000000, paid: 3000000 },
      ],
    });

    const result = await resultPromise;
    expect(result.rows[0]).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      organization: 'Mali Industrie SA',
      due: 5000000,
      paid: 3000000,
      lastActivity: null,
      isLargeContributor: false,
    });
    expect(result.overview?.recoveryRate).toBe(57);
    expect(result.categories).toEqual(['GRANDE_ENTREPRISE', 'PME', 'TPE']);
    expect(result.groups).toEqual(['Industries']);
    expect(result.supportedSortKeys).toEqual(['code', 'organization', 'status', 'group']);
  });

  it('refuse dans le flux un tri non livré au lieu de le reproduire sur la page', async () => {
    const result = firstValueFrom(
      gateway.search({ ...QUERY, sort: { key: 'due', direction: 'asc' } }),
    );
    await expect(result).rejects.toBeInstanceOf(UnsupportedMembersSortError);
    http.expectNone('/v1/memberships');
  });

  it('transforme un 403 normalisé en erreur d accès BO-002', async () => {
    const resultPromise = firstValueFrom(gateway.search({ ...QUERY, sort: null }));
    const request = http.expectOne((candidate) => candidate.url === '/v1/memberships');
    http.expectOne('/v1/reporting/member-overview').flush({
      overview: null,
      categories: [],
      groups: [],
      financials: [],
    });
    request.flush(
      {
        timestamp: '2026-07-18T12:00:00Z',
        status: 403,
        code: 'FORBIDDEN',
        message: 'Accès refusé',
        correlationId: '33333333-3333-4333-8333-333333333333',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    await expect(resultPromise).rejects.toBeInstanceOf(MembersAccessError);
  });

  it('refuse un nouveau statut backend non pris en charge par la fiche', async () => {
    const resultPromise = firstValueFrom(gateway.search({ ...QUERY, sort: null }));
    const request = http.expectOne((candidate) => candidate.url === '/v1/memberships');
    http.expectOne('/v1/reporting/member-overview').flush({
      overview: null,
      categories: [],
      groups: [],
      financials: [],
    });
    request.flush({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          membershipNumber: 'CNPM-2026-001',
          organizationId: '22222222-2222-4222-8222-222222222222',
          organizationLegalName: 'Entreprise Sahel',
          categoryCode: 'CAT-A',
          status: 'SUSPENDED',
          version: 1,
        },
      ],
      page: 1,
      size: 25,
      totalElements: 1,
      totalPages: 1,
    });

    await expect(resultPromise).rejects.toBeInstanceOf(UnknownMembershipStatusError);
  });
});
