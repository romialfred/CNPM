import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpMemberProfileGateway } from './http-member-profile.gateway';
import { MemberProfileValidationError } from './member-profile-gateway';

const PROFILE = {
  displayName: 'Adhérent de test 1',
  email: 'membre1@cnpm-portail.test',
  organization: 'Société de test',
  jobTitle: 'Gérant',
  phone: null,
  avatarDataUri: null,
  avatarUpdatedAt: null,
};

describe('HttpMemberProfileGateway', () => {
  let gateway: HttpMemberProfileGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpMemberProfileGateway,
      ],
    });
    gateway = TestBed.inject(HttpMemberProfileGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge le profil depuis /portal/profile', async () => {
    const result = firstValueFrom(gateway.load());
    const request = http.expectOne((c) => c.url.endsWith('/portal/profile'));
    expect(request.request.method).toBe('GET');
    request.flush(PROFILE);
    expect((await result).displayName).toBe('Adhérent de test 1');
  });

  it('envoie la photo en PUT et récupère le profil mis à jour', async () => {
    const result = firstValueFrom(gateway.updateAvatar('image/png', 'AAAA'));
    const request = http.expectOne((c) => c.url.endsWith('/portal/profile/avatar'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ contentType: 'image/png', base64: 'AAAA' });
    request.flush({ ...PROFILE, avatarDataUri: 'data:image/png;base64,AAAA' });
    expect((await result).avatarDataUri).toBe('data:image/png;base64,AAAA');
  });

  it('traduit un 409 en erreur de validation de la photo', async () => {
    const result = firstValueFrom(gateway.updateAvatar('image/gif', 'AAAA'));
    http.expectOne((c) => c.url.endsWith('/portal/profile/avatar')).flush(
      {
        timestamp: '2026-07-24T08:00:00Z',
        status: 409,
        code: 'STATE_CONFLICT',
        message: 'Format d’image non accepté (PNG, JPEG ou WebP).',
        correlationId: '40000000-0000-4000-8000-000000000001',
      },
      { status: 409, statusText: 'Conflict' },
    );
    await expect(result).rejects.toBeInstanceOf(MemberProfileValidationError);
  });
});
