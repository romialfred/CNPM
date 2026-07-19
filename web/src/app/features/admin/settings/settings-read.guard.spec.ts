import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, type Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SESSION_GATEWAY,
  type SessionGateway,
  type SessionIdentity,
} from '../../../layout/admin-shell/session-gateway';
import { settingsReadGuard } from './settings-read.guard';

const IDENTITY: SessionIdentity = {
  displayName: 'Agent fictif',
  roleLabel: 'ADMIN_FONCTIONNEL',
  exerciseLabel: null,
  notificationCount: null,
  demoMode: false,
  permissions: [],
};

function evaluate(identity: SessionGateway['identity']): boolean | Observable<boolean | UrlTree> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SESSION_GATEWAY, useValue: { identity } satisfies SessionGateway },
    ],
  });
  return TestBed.runInInjectionContext(
    () => settingsReadGuard({} as never, {} as never) as boolean | Observable<boolean | UrlTree>,
  );
}

async function resolve(result: boolean | Observable<boolean | UrlTree>) {
  return isObservable(result) ? firstValueFrom(result) : result;
}

describe('settingsReadGuard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('autorise ADMIN.REFERENTIAL.READ', async () => {
    await expect(
      resolve(evaluate(of({ ...IDENTITY, permissions: ['ADMIN.REFERENTIAL.READ'] }))),
    ).resolves.toBe(true);
  });

  it('redirige une session sans permission vers le tableau de bord', async () => {
    const result = await resolve(evaluate(of(IDENTITY)));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('laisse le backend trancher si la projection de session est indisponible', async () => {
    await expect(resolve(evaluate(throwError(() => new Error('panne'))))).resolves.toBe(true);
  });
});
