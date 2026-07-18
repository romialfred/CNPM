import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { provideCnpmApi } from './api.config';
import { CnpmApiError, type ApiErrorCategory, type ApiProblem } from './api-problem';
import { apiProblemInterceptor } from './api-problem.interceptor';
import { CORRELATION_ID_HEADER, correlationIdInterceptor } from './correlation-id.interceptor';
import { CNPM_UUID_FACTORY } from './request-id';

const REQUEST_ID = '10000000-0000-4000-8000-000000000001';
const RESPONSE_ID = '20000000-0000-4000-8000-000000000002';

describe('intercepteurs HTTP CNPM', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([correlationIdInterceptor, apiProblemInterceptor])),
        provideHttpClientTesting(),
        { provide: CNPM_UUID_FACTORY, useValue: () => REQUEST_ID },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    TestBed.resetTestingModule();
  });

  it('génère puis transmet un identifiant de corrélation aux appels CNPM', () => {
    http.get('/v1/members').subscribe();

    const request = controller.expectOne('/v1/members');
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(REQUEST_ID);
    request.flush({});
  });

  it('préserve un identifiant de corrélation explicitement fourni pour tout le retry', () => {
    http.get('/v1/members', { headers: { [CORRELATION_ID_HEADER]: RESPONSE_ID } }).subscribe();

    const request = controller.expectOne('/v1/members');
    expect(request.request.headers.get(CORRELATION_ID_HEADER)).toBe(RESPONSE_ID);
    request.flush({});
  });

  it('ne modifie pas une requête vers un service tiers', () => {
    http.get('https://identity.test/realms/cnpm').subscribe();

    const request = controller.expectOne('https://identity.test/realms/cnpm');
    expect(request.request.headers.has(CORRELATION_ID_HEADER)).toBe(false);
    request.flush({});
  });

  it('préserve le Problem contractuel et la corrélation renvoyée par le backend', async () => {
    const problem: ApiProblem = {
      timestamp: '2026-07-18T09:00:00Z',
      status: 422,
      code: 'BUSINESS_RULE_VIOLATION',
      message: 'Le dossier ne peut pas être soumis.',
      fieldErrors: [{ field: 'documents', code: 'REQUIRED', message: 'Pièce manquante.' }],
      correlationId: RESPONSE_ID,
    };
    const outcome = firstValueFrom(http.post('/v1/enrollments', {}));

    controller.expectOne('/v1/enrollments').flush(problem, {
      status: 422,
      statusText: 'Unprocessable Entity',
    });

    await expect(outcome).rejects.toMatchObject({
      category: 'business-rule',
      retryable: false,
      problem,
    });
  });

  it.each<[number, ApiErrorCategory, boolean]>([
    [400, 'validation', false],
    [401, 'authentication', false],
    [403, 'authorization', false],
    [404, 'not-found', false],
    [409, 'conflict', false],
    [422, 'business-rule', false],
    [429, 'rate-limit', true],
    [500, 'server', true],
    [503, 'server', true],
  ])('mappe HTTP %i vers %s (retryable=%s)', async (status, category, retryable) => {
    const outcome = firstValueFrom(http.get(`/v1/test-${status}`));

    controller.expectOne(`/v1/test-${status}`).flush('détail technique à ne pas exposer', {
      status,
      statusText: 'Erreur',
    });

    try {
      await outcome;
      throw new Error('La requête aurait dû échouer.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(CnpmApiError);
      expect(error).toMatchObject({ category, retryable, correlationId: REQUEST_ID, status });
      expect((error as CnpmApiError).message).not.toContain('détail technique');
    }
  });

  it('laisse inchangée une erreur HTTP provenant d’un service tiers', async () => {
    const outcome = firstValueFrom(http.get('https://identity.test/profile'));
    controller
      .expectOne('https://identity.test/profile')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    await expect(outcome).rejects.toBeInstanceOf(HttpErrorResponse);
  });
});
