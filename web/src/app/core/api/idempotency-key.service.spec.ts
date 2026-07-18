import { TestBed } from '@angular/core/testing';

import { IdempotencyKeyService } from './idempotency-key.service';
import { CNPM_UUID_FACTORY } from './request-id';

const KEYS = [
  '30000000-0000-4000-8000-000000000003',
  '40000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000005',
];

describe('IdempotencyKeyService', () => {
  let nextKey: number;
  let service: IdempotencyKeyService;

  beforeEach(() => {
    nextKey = 0;
    TestBed.configureTestingModule({
      providers: [
        IdempotencyKeyService,
        { provide: CNPM_UUID_FACTORY, useValue: () => KEYS[nextKey++] },
      ],
    });
    service = TestBed.inject(IdempotencyKeyService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('réutilise la même clé pour les retries d’une commande', () => {
    expect(service.getOrCreate('enrollment:demo-001')).toBe(KEYS[0]);
    expect(service.getOrCreate('enrollment:demo-001')).toBe(KEYS[0]);
    expect(nextKey).toBe(1);
  });

  it('isole deux intentions de commande distinctes', () => {
    expect(service.getOrCreate('payment:line-001')).toBe(KEYS[0]);
    expect(service.getOrCreate('payment:line-002')).toBe(KEYS[1]);
  });

  it('crée une nouvelle clé après la réponse terminale', () => {
    expect(service.getOrCreate('payment:line-001')).toBe(KEYS[0]);
    service.release('payment:line-001');
    expect(service.getOrCreate('payment:line-001')).toBe(KEYS[1]);
  });

  it('refuse une identité de commande vide', () => {
    expect(() => service.getOrCreate('   ')).toThrow(/identifiant de commande/);
  });
});
