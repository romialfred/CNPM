import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_API_BASE_URL } from '../../core/api/api.config';
import { NativeSessionStore } from '../../core/auth/native-session.store';
import { AuthFlowStore } from './auth-flow.store';
import { HttpAuthGateway } from './http-auth.gateway';

const BASE = '/v1';
const url = (path: string) => `${BASE}/${path}`;

describe('HttpAuthGateway — authentification native', () => {
  let gateway: HttpAuthGateway;
  let httpMock: HttpTestingController;
  let flow: AuthFlowStore;
  let session: NativeSessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpAuthGateway,
        AuthFlowStore,
        NativeSessionStore,
        { provide: CNPM_API_BASE_URL, useValue: BASE },
      ],
    });
    gateway = TestBed.inject(HttpAuthGateway);
    httpMock = TestBed.inject(HttpTestingController);
    flow = TestBed.inject(AuthFlowStore);
    session = TestBed.inject(NativeSessionStore);
  });

  const credentials = () => ({
    space: 'member' as const,
    email: 'user@cnpm.ml',
    password: 'x',
    rememberDevice: false,
  });

  it('mappe 428 MFA_ENROLLMENT_REQUIRED vers un enrôlement forcé, challenge inclus', async () => {
    const promise = firstValueFrom(gateway.submitCredentials(credentials()));
    httpMock
      .expectOne(url('auth/login'))
      .flush(
        { errorCode: 'MFA_ENROLLMENT_REQUIRED', challenge: 'chal-1' },
        { status: 428, statusText: 'Precondition Required' },
      );
    await expect(promise).resolves.toEqual({ outcome: 'enrollment-required', challengeId: 'chal-1' });
  });

  it('mappe 428 MFA_REQUIRED vers la vérification, et 401/403 vers invalid/forbidden', async () => {
    const mfa = firstValueFrom(gateway.submitCredentials(credentials()));
    httpMock
      .expectOne(url('auth/login'))
      .flush({ errorCode: 'MFA_REQUIRED', challenge: 'chal-2' }, { status: 428, statusText: '' });
    await expect(mfa).resolves.toEqual({ outcome: 'mfa-required', challengeId: 'chal-2' });

    const invalid = firstValueFrom(gateway.submitCredentials(credentials()));
    httpMock
      .expectOne(url('auth/login'))
      .flush({ errorCode: 'INVALID_CREDENTIALS' }, { status: 401, statusText: '' });
    await expect(invalid).resolves.toEqual({ outcome: 'invalid' });

    const forbidden = firstValueFrom(gateway.submitCredentials(credentials()));
    httpMock
      .expectOne(url('auth/login'))
      .flush({ errorCode: 'NO_ROLE_ASSIGNED' }, { status: 403, statusText: '' });
    await expect(forbidden).resolves.toEqual({ outcome: 'forbidden' });
  });

  it('vérifie un code et range le jeton de session pour l’intercepteur Bearer', async () => {
    const promise = firstValueFrom(gateway.verifyCode('chal-3', '123456', 'admin'));
    httpMock.expectOne(url('auth/mfa/verify')).flush({ status: 'AUTHENTICATED', accessToken: 'JWT-1' });
    await expect(promise).resolves.toEqual({ outcome: 'authenticated', redirectTo: '/admin' });
    expect(session.current()).toBe('JWT-1');
  });

  it('démarre l’enrôlement à partir du challenge du flow et rend un QR scannable', async () => {
    flow.startChallenge('chal-4', 'member');
    const promise = firstValueFrom(gateway.beginTotpEnrollment());
    httpMock.expectOne(url('auth/mfa/enroll/start')).flush({
      manualKey: 'JBSWY3DPEHPK3PXP',
      otpAuthUri: 'otpauth://totp/CNPM%3Auser%40cnpm.ml?secret=JBSWY3DPEHPK3PXP&issuer=CNPM',
    });
    const enrollment = await promise;
    expect(enrollment.qrImage.startsWith('data:image/')).toBe(true);
    expect(enrollment.manualKey.replace(/\s/gu, '')).toBe('JBSWY3DPEHPK3PXP');
    expect(enrollment.account).toBe('user@cnpm.ml');
  });

  it('active le second facteur : range le jeton et remet les codes de secours', async () => {
    flow.startChallenge('chal-5', 'member');
    const promise = firstValueFrom(gateway.activateTotp('chal-5', '123456', 'member'));
    httpMock.expectOne(url('auth/mfa/enroll/confirm')).flush({
      status: 'AUTHENTICATED',
      accessToken: 'JWT-2',
      recoveryCodes: ['AAAA-1111', 'BBBB-2222'],
    });
    const result = await promise;
    expect(result.outcome).toBe('activated');
    if (result.outcome !== 'activated') throw new Error('activation attendue');
    expect(result.recoveryCodes).toHaveLength(2);
    expect(session.current()).toBe('JWT-2');
  });

  it('n’a rien à renvoyer pour un TOTP (resend est un no-op)', async () => {
    await expect(firstValueFrom(gateway.resendCode())).resolves.toBeUndefined();
    httpMock.expectNone(() => true);
  });
});
