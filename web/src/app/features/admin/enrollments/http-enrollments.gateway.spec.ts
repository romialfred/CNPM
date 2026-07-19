import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { CNPM_UUID_FACTORY } from '../../../core/api/request-id';
import {
  EnrollmentAccessError,
  EnrollmentNotFoundError,
  type EnrollmentApproval,
} from './enrollments-gateway';
import { HttpEnrollmentsGateway, UnknownEnrollmentStatusError } from './http-enrollments.gateway';

const ENROLLMENT_ID = '10000000-0000-4000-8000-000000000001';
const ORGANIZATION_ID = '20000000-0000-4000-8000-000000000001';
const KEY_ONE = '30000000-0000-4000-8000-000000000001';
const KEY_TWO = '30000000-0000-4000-8000-000000000002';

function response(status = 'UNDER_REVIEW') {
  return {
    id: ENROLLMENT_ID,
    caseNumber: 'ENR-DEMO-0001',
    organizationId: ORGANIZATION_ID,
    channel: 'DEMO_ASSISTE',
    status,
    submittedAt: '2026-07-18T08:15:00Z',
    assignedTo: '90000000-0000-4000-8000-000000000001',
    version: 2,
  };
}

function problem(status: number) {
  return {
    timestamp: '2026-07-19T08:00:00Z',
    status,
    code: status === 403 ? 'FORBIDDEN' : 'RESOURCE_NOT_FOUND',
    message: status === 403 ? 'Accès refusé' : 'Dossier introuvable',
    correlationId: '40000000-0000-4000-8000-000000000001',
  };
}

describe('HttpEnrollmentsGateway', () => {
  let gateway: HttpEnrollmentsGateway;
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
        HttpEnrollmentsGateway,
      ],
    });
    gateway = TestBed.inject(HttpEnrollmentsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('traduit la page lisible vers la pagination OpenAPI indexée à zéro', async () => {
    const resultPromise = firstValueFrom(gateway.list({ page: 3, pageSize: 20 }));
    const request = http.expectOne('/v1/enrollment-applications?page=2&size=20');
    request.flush({
      items: [response('SUBMITTED')],
      page: 2,
      size: 20,
      totalElements: 41,
      totalPages: 3,
    });

    const result = await resultPromise;
    expect(result.totalItems).toBe(41);
    expect(result.totalPages).toBe(3);
    expect(result.rows[0]).toMatchObject({
      id: ENROLLMENT_ID,
      status: 'SUBMITTED',
      organizationId: ORGANIZATION_ID,
    });
  });

  it('raccorde la lecture et les trois transitions sans corps inventé', async () => {
    const detailPromise = firstValueFrom(gateway.get(ENROLLMENT_ID));
    http.expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}`).flush(response('SUBMITTED'));
    await expect(detailPromise).resolves.toMatchObject({ status: 'SUBMITTED' });

    const reviewPromise = firstValueFrom(gateway.startReview(ENROLLMENT_ID));
    const reviewRequest = http.expectOne(
      `/v1/enrollment-applications/${ENROLLMENT_ID}/start-review`,
    );
    expect(reviewRequest.request.body).toBeNull();
    reviewRequest.flush(response());
    await expect(reviewPromise).resolves.toMatchObject({ status: 'UNDER_REVIEW' });

    const complementPromise = firstValueFrom(
      gateway.requestComplement(ENROLLMENT_ID, 'Compléter le dossier de démonstration.'),
    );
    const complementRequest = http.expectOne(
      `/v1/enrollment-applications/${ENROLLMENT_ID}/request-complement`,
    );
    expect(complementRequest.request.body).toEqual({
      comment: 'Compléter le dossier de démonstration.',
    });
    complementRequest.flush(response('COMPLEMENT_REQUIRED'));
    await expect(complementPromise).resolves.toMatchObject({ status: 'COMPLEMENT_REQUIRED' });

    const rejectPromise = firstValueFrom(
      gateway.reject(ENROLLMENT_ID, { comment: 'Motif explicite.', reasonCode: 'LIBRE' }),
    );
    const rejectRequest = http.expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}/reject`);
    expect(rejectRequest.request.body).toEqual({
      comment: 'Motif explicite.',
      reasonCode: 'LIBRE',
    });
    rejectRequest.flush(response('REJECTED'));
    await expect(rejectPromise).resolves.toMatchObject({ status: 'REJECTED' });
  });

  it('réemploie la clé d idempotence d une approbation après une panne temporaire', async () => {
    const input: EnrollmentApproval = {
      membershipNumber: 'CNPM-DEMO-0001',
      categoryCode: 'CAT-DEMO',
      comment: 'Décision de démonstration.',
    };

    const first = firstValueFrom(gateway.approve(ENROLLMENT_ID, input));
    const firstRequest = http.expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}/approve`);
    expect(firstRequest.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    firstRequest.flush(problem(503), { status: 503, statusText: 'Service Unavailable' });
    await expect(first).rejects.toBeDefined();

    const retry = firstValueFrom(gateway.approve(ENROLLMENT_ID, input));
    const retryRequest = http.expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}/approve`);
    expect(retryRequest.request.headers.get('Idempotency-Key')).toBe(KEY_ONE);
    retryRequest.flush(response('APPROVED'));
    await expect(retry).resolves.toMatchObject({ status: 'APPROVED' });

    const newIntent = firstValueFrom(gateway.approve(ENROLLMENT_ID, input));
    const newRequest = http.expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}/approve`);
    expect(newRequest.request.headers.get('Idempotency-Key')).toBe(KEY_TWO);
    newRequest.flush(response('APPROVED'));
    await newIntent;
  });

  it('distingue les refus 403 et les dossiers absents 404', async () => {
    const forbidden = firstValueFrom(gateway.get(ENROLLMENT_ID));
    http
      .expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}`)
      .flush(problem(403), { status: 403, statusText: 'Forbidden' });
    await expect(forbidden).rejects.toBeInstanceOf(EnrollmentAccessError);

    const notFound = firstValueFrom(gateway.get(ENROLLMENT_ID));
    http
      .expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}`)
      .flush(problem(404), { status: 404, statusText: 'Not Found' });
    await expect(notFound).rejects.toBeInstanceOf(EnrollmentNotFoundError);
  });

  it('refuse un statut backend absent de la machine à états', async () => {
    const result = firstValueFrom(gateway.get(ENROLLMENT_ID));
    http.expectOne(`/v1/enrollment-applications/${ENROLLMENT_ID}`).flush(response('ACTIVE'));
    await expect(result).rejects.toBeInstanceOf(UnknownEnrollmentStatusError);
  });
});
