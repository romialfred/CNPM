import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
  type ParamMap,
} from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  RECEIPT_VERIFICATION_GATEWAY,
  type PublicReceiptVerificationResult,
  type ReceiptVerificationGateway,
} from './receipt-verification-gateway';
import { ReceiptVerificationPage } from './receipt-verification.page';

class ControllableVerificationGateway implements ReceiptVerificationGateway {
  readonly calls: { code: string; result: Subject<PublicReceiptVerificationResult> }[] = [];

  verify(code: string): Observable<PublicReceiptVerificationResult> {
    const result = new Subject<PublicReceiptVerificationResult>();
    this.calls.push({ code, result });
    return result;
  }
}

async function setup(code = 'DEMO-VERIF-2026-001') {
  const gateway = new ControllableVerificationGateway();
  const paramMap = new BehaviorSubject<ParamMap>(convertToParamMap({ code }));
  await TestBed.configureTestingModule({
    imports: [ReceiptVerificationPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
        { path: 'membres', children: [] },
        { path: 'actualites', children: [] },
        { path: 'agenda', children: [] },
        { path: 'verification/:code', children: [] },
      ]),
      { provide: ActivatedRoute, useValue: { paramMap } },
      { provide: RECEIPT_VERIFICATION_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ReceiptVerificationPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('ReceiptVerificationPage (PUB-015 / REC-006)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche un chargement et annonce le périmètre limité du contrôle', async () => {
    const { gateway, host } = await setup();
    expect(gateway.calls[0].code).toBe('DEMO-VERIF-2026-001');
    expect(host.querySelectorAll('.cnpm-skeleton')).toHaveLength(3);
    expect(host.textContent).toContain('Contrôle public limité');
    expect(host.textContent).toContain('sans identité de');
  });

  it('limite strictement les données rendues dans un résultat', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.calls[0].result.next({
      outcome: 'found',
      verification: {
        verificationCode: 'DEMO-VERIF-2026-001',
        receiptReference: 'DEMO-APERCU-2026-001',
        statusLabel: 'Aperçu valide',
        amountXof: 150000,
        scenarioDate: '2026-06-18',
        fictionalDemo: true,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Aperçu valide');
    expect(host.textContent).toContain('Non exposée');
    expect(host.querySelector('.verification-result')?.textContent).not.toContain('signature');
    expect(host.querySelector('.verification-result img, .verification-result canvas')).toBeNull();
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content).toBe(
      'noindex,nofollow',
    );
  });

  it('ne révèle rien pour un code inconnu', async () => {
    const { fixture, gateway, host } = await setup('INCONNU');
    gateway.calls[0].result.next({ outcome: 'not-found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Aucun aperçu correspondant');
    expect(host.querySelector('.verification-facts')).toBeNull();
  });

  it('normalise le code saisi avant de naviguer', async () => {
    const { fixture, host } = await setup();
    const input = host.querySelector<HTMLInputElement>('#verification-code')!;
    input.value = ' demo-autre-001 ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    host.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/verification/DEMO-AUTRE-001');
  });
});
