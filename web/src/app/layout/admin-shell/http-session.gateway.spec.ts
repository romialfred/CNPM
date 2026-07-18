import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../core/api/api.config';
import { CnpmApiError } from '../../core/api/api-problem';
import { HttpSessionGateway } from './http-session.gateway';

describe('HttpSessionGateway', () => {
  let gateway: HttpSessionGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpSessionGateway,
      ],
    });
    gateway = TestBed.inject(HttpSessionGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('projette le contrat courant sans inventer exercice ni notifications', async () => {
    const first = firstValueFrom(gateway.identity);
    const second = firstValueFrom(gateway.identity);
    const request = http.expectOne('/v1/auth/me');
    request.flush({
      subject: '11111111-1111-4111-8111-111111111111',
      username: 'agent.demo',
      email: 'agent@example.test',
      roles: ['GESTIONNAIRE_MEMBRES', 'AGENT_ENROLEMENT'],
      permissions: ['MEMBER.READ'],
    });

    await expect(first).resolves.toEqual({
      displayName: 'agent.demo',
      roleLabel: 'GESTIONNAIRE_MEMBRES · AGENT_ENROLEMENT',
      exerciseLabel: null,
      notificationCount: null,
      demoMode: false,
      permissions: ['MEMBER.READ'],
    });
    await expect(second).resolves.toEqual(await first);
    http.expectNone('/v1/auth/me');
  });

  it('utilise le sujet lorsque le jeton ne fournit ni username ni email', async () => {
    const result = firstValueFrom(gateway.identity);
    http.expectOne('/v1/auth/me').flush({
      subject: '11111111-1111-4111-8111-111111111111',
      username: null,
      email: null,
      roles: [],
      permissions: [],
    });
    await expect(result).resolves.toMatchObject({
      displayName: '11111111-1111-4111-8111-111111111111',
      roleLabel: 'Aucun rôle attribué',
    });
  });

  it('représente un 401 comme une absence de session', async () => {
    const result = firstValueFrom(gateway.identity);
    http.expectOne('/v1/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(result).resolves.toBeNull();
  });

  it('propage une panne serveur normalisée', async () => {
    const result = firstValueFrom(gateway.identity);
    http.expectOne('/v1/auth/me').flush(null, { status: 503, statusText: 'Unavailable' });
    await expect(result).rejects.toBeInstanceOf(CnpmApiError);
  });
});
