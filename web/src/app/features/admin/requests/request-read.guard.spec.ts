import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE, type CnpmDataMode } from '../../../core/api/api.config';
import {
  SESSION_GATEWAY,
  type SessionGateway,
  type SessionIdentity,
} from '../../../layout/admin-shell/session-gateway';
import { requestReadGuard } from './request-read.guard';

const IDENTITY: SessionIdentity = {
  displayName: 'Agent test fictif',
  roleLabel: 'SUPPORT',
  exerciseLabel: null,
  notificationCount: null,
  demoMode: false,
  permissions: [],
};

async function evaluate(mode: CnpmDataMode, identity: SessionGateway['identity']) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: CNPM_DATA_MODE, useValue: mode },
      { provide: SESSION_GATEWAY, useValue: { identity } satisfies SessionGateway },
    ],
  });
  const result = TestBed.runInInjectionContext(() => requestReadGuard({} as never, {} as never));
  return isObservable(result) ? firstValueFrom(result) : await Promise.resolve(result);
}

describe('requestReadGuard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('autorise le bac à sable démo sans en faire une permission serveur', async () => {
    await expect(evaluate('demo', of(IDENTITY))).resolves.toBe(true);
  });

  it('exige REQUEST.READ en mode HTTP', async () => {
    await expect(
      evaluate('http', of({ ...IDENTITY, permissions: ['REQUEST.READ'] })),
    ).resolves.toBe(true);

    const result = await evaluate('http', of(IDENTITY));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('refuse l’accès si la projection de session est en panne', async () => {
    const result = await evaluate(
      'http',
      throwError(() => new Error('panne')),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });
});
