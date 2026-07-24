import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberContributionsGateway } from './http-member-contributions.gateway';
import { MemberContributionNotFoundError } from './member-contributions-gateway';

const CALL_ID = '10000000-0000-4000-8000-000000000001';

const PAGE_RESPONSE = {
  items: [
    {
      id: CALL_ID,
      reference: 'APP-2026-0001',
      exercise: 2026,
      dueDate: '2026-03-31',
      calledAmount: '1250000.00',
      paidAmount: '250000.00',
      outstandingAmount: '1000000.00',
      currency: 'XOF',
      status: 'PARTIELLE',
    },
  ],
  page: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
  availableExercises: [2026, 2025],
};

describe('HttpMemberContributionsGateway', () => {
  let gateway: HttpMemberContributionsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberContributionsGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberContributionsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('n’envoie jamais d’identifiant d’adhésion : le périmètre vient du compte connecté', async () => {
    const result = firstValueFrom(
      gateway.list({ sort: 'dueDate', direction: 'asc', page: 1, size: 20 }),
    );

    const request = http.expectOne((candidate) => candidate.url.endsWith('/portal/contributions'));
    const keys = request.request.params.keys();
    expect(keys).not.toContain('membershipId');
    expect(keys).not.toContain('memberId');
    expect(keys).not.toContain('organizationId');
    request.flush(PAGE_RESPONSE);
    await result;
  });

  it('traduit la page lisible vers la pagination du contrat, indexée à zéro', async () => {
    const result = firstValueFrom(
      gateway.list({ sort: 'reference', direction: 'desc', page: 3, size: 10 }),
    );

    const request = http.expectOne(
      '/v1/portal/contributions?sort=reference&direction=desc&page=2&size=10',
    );
    request.flush({ ...PAGE_RESPONSE, page: 2, size: 10 });

    // L'écran compte à partir de un : la page rendue doit revenir dans son vocabulaire.
    expect((await result).page).toBe(3);
  });

  it('n’ajoute les filtres que lorsqu’ils sont posés', async () => {
    const result = firstValueFrom(
      gateway.list({
        status: 'EN_RETARD',
        exercise: 2025,
        sort: 'dueDate',
        direction: 'asc',
        page: 1,
        size: 20,
      }),
    );

    const request = http.expectOne((candidate) => candidate.url.endsWith('/portal/contributions'));
    expect(request.request.params.get('status')).toBe('EN_RETARD');
    expect(request.request.params.get('exercise')).toBe('2025');
    request.flush(PAGE_RESPONSE);
    await result;
  });

  it('convertit les montants décimaux du contrat sans les faire transiter par une chaîne', async () => {
    const result = firstValueFrom(
      gateway.list({ sort: 'dueDate', direction: 'asc', page: 1, size: 20 }),
    );
    http
      .expectOne((candidate) => candidate.url.endsWith('/portal/contributions'))
      .flush(PAGE_RESPONSE);

    const first = (await result).items[0];
    expect(first.calledAmount).toBe(1250000);
    expect(first.outstandingAmount).toBe(1000000);
    expect(first.currency).toBe('XOF');
    expect(first.status).toBe('PARTIELLE');
  });

  it('remonte le détail avec son échéancier et ses ajustements', async () => {
    const result = firstValueFrom(gateway.loadDetail(CALL_ID));

    http.expectOne(`/v1/portal/contributions/${CALL_ID}`).flush({
      ...PAGE_RESPONSE.items[0],
      issuedOn: '2026-01-15',
      amountOriginNote: 'Appel APP-2026-0001 de l’exercice 2026.',
      adjustments: [
        {
          reference: 'AJU-2026-0001',
          direction: 'CREDIT',
          amount: '50000.00',
          currency: 'XOF',
          reason: 'REMISE_EXCEPTIONNELLE',
          recordedOn: '2026-02-01',
        },
      ],
      schedule: [
        {
          id: '20000000-0000-4000-8000-000000000001',
          label: 'Échéance 1',
          dueDate: '2026-03-31',
          expectedAmount: '625000.00',
          paidAmount: '250000.00',
          outstandingAmount: '375000.00',
          currency: 'XOF',
          status: 'PARTIELLE',
        },
      ],
    });

    const detail = await result;
    expect(detail.adjustments[0].amount).toBe(50000);
    expect(detail.schedule[0].outstandingAmount).toBe(375000);
  });

  it('ne distingue pas une cotisation absente d’une cotisation d’un autre membre', async () => {
    const result = firstValueFrom(gateway.loadDetail(CALL_ID));
    http.expectOne(`/v1/portal/contributions/${CALL_ID}`).flush(
      {
        timestamp: '2026-07-23T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Cotisation introuvable.',
        correlationId: '40000000-0000-4000-8000-000000000001',
      },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(result).rejects.toBeInstanceOf(MemberContributionNotFoundError);
  });
});
