import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import { firstValueFrom, of, throwError, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SESSION_GATEWAY,
  type SessionGateway,
  type SessionIdentity,
} from '../../../../layout/admin-shell/session-gateway';
import { organizationContactsReadGuard } from './organization-contacts-read.guard';

const IDENTITY: SessionIdentity = {
  displayName: 'Gestionnaire fictif',
  roleLabel: 'GESTIONNAIRE',
  exerciseLabel: null,
  notificationCount: null,
  demoMode: true,
  permissions: [],
};

function evaluate(identity: SessionGateway['identity']): Observable<boolean | UrlTree> {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SESSION_GATEWAY, useValue: { identity } satisfies SessionGateway },
    ],
  });
  return TestBed.runInInjectionContext(
    () => organizationContactsReadGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
  );
}

describe('organizationContactsReadGuard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('autorise MEMBER.READ', async () => {
    await expect(
      firstValueFrom(evaluate(of({ ...IDENTITY, permissions: ['MEMBER.READ'] }))),
    ).resolves.toBe(true);
  });

  it('redirige sans permission', async () => {
    const result = await firstValueFrom(evaluate(of(IDENTITY)));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('échoue fermé si la projection de session est indisponible', async () => {
    const result = await firstValueFrom(evaluate(throwError(() => new Error('panne'))));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });
});
