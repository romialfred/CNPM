import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CNPM_DATA_MODE, type CnpmDataMode } from '../../../core/api/api.config';
import {
  SESSION_GATEWAY,
  type SessionGateway,
  type SessionIdentity,
} from '../../../layout/admin-shell/session-gateway';
import { receiptReadGuard } from './receipt-read.guard';

const IDENTITY: SessionIdentity = {
  displayName: 'Agent finance',
  roleLabel: 'FINANCE',
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
  const result = TestBed.runInInjectionContext(() => receiptReadGuard({} as never, {} as never));
  return isObservable(result) ? firstValueFrom(result) : await Promise.resolve(result);
}

describe('receiptReadGuard', () => {
  it('autorise uniquement le registre local en mode démo', async () => {
    await expect(evaluate('demo', of(IDENTITY))).resolves.toBe(true);
  });

  it('exige RECEIPT.READ en mode HTTP', async () => {
    await expect(
      evaluate('http', of({ ...IDENTITY, permissions: ['RECEIPT.READ'] })),
    ).resolves.toBe(true);

    const denied = await evaluate('http', of(IDENTITY));
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/admin/dashboard');
  });

  it('échoue fermé si la projection de session HTTP est indisponible', async () => {
    const result = await evaluate(
      'http',
      throwError(() => new Error('panne session')),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/dashboard');
  });
});
