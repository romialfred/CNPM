import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import { firstValueFrom, type Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  SESSION_GATEWAY,
  type SessionGateway,
  type SessionIdentity,
} from '../../../layout/admin-shell/session-gateway';
import { integrationsReadGuard } from './integrations-read.guard';

const IDENTITY: SessionIdentity = {
  displayName: 'Profil technique',
  roleLabel: 'ADMIN_TECHNIQUE',
  exerciseLabel: null,
  notificationCount: null,
  demoMode: false,
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
    () => integrationsReadGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
  );
}

describe('integrationsReadGuard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('autorise uniquement la consultation avec OPS.MONITOR.READ', async () => {
    await expect(
      firstValueFrom(evaluate(of({ ...IDENTITY, permissions: ['OPS.MONITOR.READ'] }))),
    ).resolves.toBe(true);
  });

  it('redirige un accès direct sans permission vers le tableau de bord', async () => {
    const result = await firstValueFrom(evaluate(of(IDENTITY)));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('ne transforme pas une permission d’écriture en droit de supervision', async () => {
    const result = await firstValueFrom(
      evaluate(of({ ...IDENTITY, permissions: ['INTEGRATION.WRITE', 'INTEGRATION.REPLAY'] })),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('échoue fermé lorsque la projection de session est indisponible', async () => {
    const result = await firstValueFrom(evaluate(throwError(() => new Error('panne'))));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });
});
