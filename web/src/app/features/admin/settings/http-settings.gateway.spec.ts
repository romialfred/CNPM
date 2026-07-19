import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi } from '../../../core/api/api.config';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { IdempotencyKeyService } from '../../../core/api/idempotency-key.service';
import { CNPM_UUID_FACTORY } from '../../../core/api/request-id';
import {
  ReferenceValueConflictError,
  ReferenceValueNotFoundError,
  ReferenceValuesAccessError,
  ReferenceValuesAuthenticationError,
  ReferenceValueValidationError,
} from './settings-gateway';
import { HttpSettingsGateway } from './http-settings.gateway';

const VALUE_ID = '33000000-0000-4000-8000-000000000001';
const KEY_ONE = '43000000-0000-4000-8000-000000000001';
const KEY_TWO = '43000000-0000-4000-8000-000000000002';

function response(version = 4) {
  return {
    id: VALUE_ID,
    domain: 'DEMO_CLASSE_INTERNE',
    code: 'DEMO_STANDARD',
    label: 'Valeur strictement fictive',
    sortOrder: 10,
    active: true,
    validFrom: null,
    validTo: null,
    version,
  };
}

function problem(status: number) {
  return {
    timestamp: '2026-07-19T08:00:00Z',
    status,
    code: status === 422 ? 'BUSINESS_RULE_VIOLATION' : 'ERROR',
    message: 'Requête refusée',
    fieldErrors:
      status === 422 ? [{ field: 'label', code: 'INVALID', message: 'Libellé refusé' }] : undefined,
    correlationId: '53000000-0000-4000-8000-000000000001',
  };
}

describe('HttpSettingsGateway', () => {
  let gateway: HttpSettingsGateway;
  let http: HttpTestingController;
  let keyIndex: number;

  beforeEach(() => {
    keyIndex = 0;
    const keys = [KEY_ONE, KEY_TWO];
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        { provide: CNPM_UUID_FACTORY, useValue: () => keys[keyIndex++] ?? KEY_TWO },
        IdempotencyKeyService,
        HttpSettingsGateway,
      ],
    });
    gateway = TestBed.inject(HttpSettingsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('traduit le filtre et la pagination vers GET /reference-values', async () => {
    const resultPromise = firstValueFrom(
      gateway.list({ domain: ' DEMO_CLASSE_INTERNE ', page: 3, pageSize: 20 }),
    );
    const request = http.expectOne(
      '/v1/reference-values?page=2&size=20&domain=DEMO_CLASSE_INTERNE',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [response()],
      page: 2,
      size: 20,
      totalElements: 41,
      totalPages: 3,
    });

    await expect(resultPromise).resolves.toEqual({
      rows: [response()],
      totalItems: 41,
      totalPages: 3,
    });
  });

  it('envoie uniquement ReferenceValueInput avec une clé d’idempotence stable sur retry', async () => {
    const input = {
      domain: 'DEMO_CLASSE_INTERNE',
      code: 'DEMO_STANDARD',
      label: 'Valeur strictement fictive',
      sortOrder: 10,
      active: true,
    };

    const firstPromise = firstValueFrom(gateway.create(input));
    const firstRequest = http.expectOne('/v1/reference-values');
    expect(firstRequest.request.method).toBe('POST');
    expect(firstRequest.request.body).toEqual(input);
    expect(firstRequest.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    firstRequest.error(new ProgressEvent('network'));
    await expect(firstPromise).rejects.toBeTruthy();

    const retryPromise = firstValueFrom(gateway.create(input));
    const retryRequest = http.expectOne('/v1/reference-values');
    expect(retryRequest.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    retryRequest.flush(response(), { status: 201, statusText: 'Created' });
    await expect(retryPromise).resolves.toEqual(response());

    const nextPromise = firstValueFrom(gateway.create({ ...input, label: 'Autre valeur fictive' }));
    const nextRequest = http.expectOne('/v1/reference-values');
    expect(nextRequest.request.headers.get('Idempotency-Key')).toBe(KEY_TWO);
    nextRequest.flush({ ...response(), label: 'Autre valeur fictive' });
    await nextPromise;
  });

  it('transmet la version dans If-Match et seulement les champs PATCH contractuels', async () => {
    const resultPromise = firstValueFrom(
      gateway.update(VALUE_ID, 4, { label: 'Libellé révisé', active: false }),
    );
    const request = http.expectOne(`/v1/reference-values/${VALUE_ID}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.headers.get('If-Match')).toBe('4');
    expect(request.request.body).toEqual({ label: 'Libellé révisé', active: false });
    request.flush({ ...response(5), label: 'Libellé révisé', active: false });

    await expect(resultPromise).resolves.toMatchObject({ version: 5, active: false });
  });

  it('ne confond pas deux commandes dont les champs contiennent des séparateurs', async () => {
    const firstPromise = firstValueFrom(
      gateway.create({ domain: 'A', code: 'B:C', label: 'D', sortOrder: 0, active: true }),
    );
    const firstRequest = http.expectOne('/v1/reference-values');
    expect(firstRequest.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    firstRequest.error(new ProgressEvent('network'));
    await expect(firstPromise).rejects.toBeTruthy();

    const secondPromise = firstValueFrom(
      gateway.create({ domain: 'A:B', code: 'C', label: 'D', sortOrder: 0, active: true }),
    );
    const secondRequest = http.expectOne('/v1/reference-values');
    expect(secondRequest.request.headers.get('Idempotency-Key')).toBe(KEY_TWO);
    secondRequest.flush({ ...response(), domain: 'A:B', code: 'C', label: 'D' });
    await secondPromise;
  });

  it.each([
    [401, ReferenceValuesAuthenticationError],
    [403, ReferenceValuesAccessError],
    [404, ReferenceValueNotFoundError],
    [409, ReferenceValueConflictError],
    [422, ReferenceValueValidationError],
  ])('normalise une réponse HTTP %i', async (status, expected) => {
    const resultPromise = firstValueFrom(gateway.update(VALUE_ID, 4, { label: 'Libellé révisé' }));
    http
      .expectOne(`/v1/reference-values/${VALUE_ID}`)
      .flush(problem(status), { status, statusText: 'Error' });
    await expect(resultPromise).rejects.toBeInstanceOf(expected);
  });

  it('conserve les erreurs de champ d’une réponse 422', async () => {
    const resultPromise = firstValueFrom(gateway.update(VALUE_ID, 4, { label: 'Libellé révisé' }));
    http
      .expectOne(`/v1/reference-values/${VALUE_ID}`)
      .flush(problem(422), { status: 422, statusText: 'Unprocessable Entity' });

    const error = await resultPromise.catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ReferenceValueValidationError);
    expect((error as ReferenceValueValidationError).fieldErrors).toEqual([
      { field: 'label', code: 'INVALID', message: 'Libellé refusé' },
    ]);
  });
});
