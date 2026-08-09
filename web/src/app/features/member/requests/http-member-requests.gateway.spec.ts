import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberRequestsGateway } from './http-member-requests.gateway';
import { MemberRequestNotFoundError } from './member-requests-gateway';

describe('HttpMemberRequestsGateway', () => {
  let gateway: HttpMemberRequestsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberRequestsGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberRequestsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('liste les requêtes bornées à l’organisation', async () => {
    const result = firstValueFrom(gateway.list(0, 50));
    const request = http.expectOne(
      (c) => c.url.includes('/portal/requests') && c.method === 'GET',
    );
    expect(request.request.url).toContain('page=0');
    expect(request.request.url).toContain('size=50');
    request.flush({
      items: [
        {
          id: 'r1',
          reference: 'COGEF-REQ-000001',
          type: 'INFORMATION',
          subject: 'Attestation',
          status: 'SUBMITTED',
          priority: 'NORMAL',
          createdAt: '2026-07-24T10:00:00Z',
          updatedAt: '2026-07-24T10:00:00Z',
        },
      ],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
    });
    const page = await result;
    expect(page.items[0].reference).toBe('COGEF-REQ-000001');
  });

  it('crée une requête avec une clé d’idempotence', async () => {
    const result = firstValueFrom(
      gateway.create({ type: 'CLAIM', subject: 'Réclamation', description: 'Contenu.' }),
    );
    const request = http.expectOne(
      (c) => c.url.endsWith('/portal/requests') && c.method === 'POST',
    );
    expect(request.request.headers.get('Idempotency-Key')).toBeTruthy();
    request.flush({
      id: 'r2',
      reference: 'COGEF-REQ-000002',
      type: 'CLAIM',
      subject: 'Réclamation',
      description: 'Contenu.',
      status: 'SUBMITTED',
      priority: 'NORMAL',
      createdAt: '2026-07-24T10:00:00Z',
      updatedAt: '2026-07-24T10:00:00Z',
      conversation: [],
    });
    const detail = await result;
    expect(detail.reference).toBe('COGEF-REQ-000002');
    expect(detail.conversation).toEqual([]);
  });

  it('ajoute un échange et renvoie la conversation à jour', async () => {
    const result = firstValueFrom(gateway.addMessage('r1', 'Merci.'));
    const request = http.expectOne((c) => c.url.endsWith('/portal/requests/r1/messages'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ body: 'Merci.' });
    request.flush({
      id: 'r1',
      reference: 'COGEF-REQ-000001',
      type: 'INFORMATION',
      subject: 'Attestation',
      description: 'Demande.',
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      createdAt: '2026-07-24T10:00:00Z',
      updatedAt: '2026-07-25T09:00:00Z',
      conversation: [
        { id: 'm1', sender: 'MEMBER', body: 'Merci.', createdAt: '2026-07-25T09:00:00Z' },
      ],
    });
    const detail = await result;
    expect(detail.conversation).toHaveLength(1);
    expect(detail.conversation[0].sender).toBe('MEMBER');
  });

  it('traduit un 404 en « requête introuvable »', async () => {
    const result = firstValueFrom(gateway.loadDetail('missing'));
    http.expectOne((c) => c.url.endsWith('/portal/requests/missing')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Requête introuvable.',
        correlationId: '40000000-0000-4000-8000-000000000005',
      },
      { status: 404, statusText: 'Not Found' },
    );
    await expect(result).rejects.toBeInstanceOf(MemberRequestNotFoundError);
  });
});
