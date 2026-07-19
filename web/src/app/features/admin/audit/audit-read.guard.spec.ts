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
import { auditReadGuard } from './audit-read.guard';

const IDENTITY: SessionIdentity = {
  displayName: 'Profil test fictif',
  roleLabel: 'AUDITEUR_INTERNE',
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
    () => auditReadGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
  );
}

describe('auditReadGuard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('autorise la permission UI AUDIT.READ', async () => {
    await expect(
      firstValueFrom(evaluate(of({ ...IDENTITY, permissions: ['AUDIT.READ'] }))),
    ).resolves.toBe(true);
  });

  it('redirige une session sans AUDIT.READ vers le tableau de bord', async () => {
    const result = await firstValueFrom(evaluate(of(IDENTITY)));
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });

  it('laisse PERM_AUDIT.READ backend trancher si la session projetée est indisponible', async () => {
    await expect(firstValueFrom(evaluate(throwError(() => new Error('panne'))))).resolves.toBe(
      true,
    );
  });
});
