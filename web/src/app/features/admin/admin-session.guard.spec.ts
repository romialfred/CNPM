import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import { type Observable, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { SESSION_GATEWAY, type SessionGateway } from '../../layout/admin-shell/session-gateway';
import { adminSessionGuard } from './admin-session.guard';

const IDENTITY = {
  displayName: 'Agent test',
  roleLabel: 'GESTIONNAIRE',
  exerciseLabel: null,
  notificationCount: null,
  demoMode: false,
  permissions: ['MEMBER.READ'],
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
    () =>
      adminSessionGuard(
        {} as never,
        { url: '/admin/members?statut=ACTIVE' } as never,
      ) as Observable<boolean | UrlTree>,
  );
}

describe('adminSessionGuard', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('autorise une session authentifiée', () => {
    evaluate(of(IDENTITY)).subscribe((result) => expect(result).toBe(true));
  });

  it('redirige une session absente en conservant la destination', () => {
    evaluate(of(null)).subscribe((result) => {
      const router = TestBed.inject(Router);
      expect(router.serializeUrl(result as never)).toBe(
        '/auth/login?retour=%2Fadmin%2Fmembers%3Fstatut%3DACTIVE',
      );
    });
  });

  it('ne transforme pas une panne de session en fausse expiration', () => {
    evaluate(throwError(() => new Error('panne'))).subscribe((result) => expect(result).toBe(true));
  });
});
