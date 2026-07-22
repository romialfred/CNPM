import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { DemoMemberPaymentsGateway } from './demo-member-payments.gateway';
import { MEMBER_PAYMENTS_GATEWAY } from './member-payments-gateway';
import { NewMemberPaymentPage } from './new-member-payment.page';

/**
 * Le règlement par opérateur (Orange Money, Wave, MTN, Visa) est un parcours COMPLET
 * mais non fonctionnel : l'issue attendue est « passerelle non configurée », et aucun
 * montant n'est débité. On éprouve le parcours de bout en bout sur l'adaptateur démo.
 */
describe('NewMemberPaymentPage (règlement par opérateur)', () => {
  let fixture: ComponentFixture<NewMemberPaymentPage>;
  let host: HTMLElement;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const clickStartsWith = (text: string): void => {
    [...host.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim().startsWith(text))
      ?.click();
  };
  const setInput = (selector: string, value: string): void => {
    const input = host.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMemberPaymentPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: MEMBER_PAYMENTS_GATEWAY, useClass: DemoMemberPaymentsGateway },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NewMemberPaymentPage);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await settle();
  });

  it('présente un stepper de quatre étapes et les cotisations à régler', () => {
    expect([...host.querySelectorAll('.cnpm-pay__step-label')].map((s) => s.textContent?.trim())).toEqual([
      'Cotisation',
      'Moyen de paiement',
      'Coordonnées',
      'Confirmation',
    ]);
    expect(host.querySelectorAll('.cnpm-pay__choice').length).toBe(3);
  });

  it('propose les quatre opérateurs avec leur logo', async () => {
    host.querySelector<HTMLInputElement>('.cnpm-pay__choice input[type="radio"]')!.click();
    await settle();
    clickStartsWith('Continuer');
    await settle();

    expect([...host.querySelectorAll('.cnpm-pay__operator-logo')].map((i) => i.getAttribute('alt'))).toEqual([
      'Orange Money',
      'Wave',
      'MTN MoMo',
      'Carte Visa',
    ]);
  });

  it('mène un règlement Orange Money jusqu’à l’issue « passerelle non configurée », sans débit', async () => {
    host.querySelector<HTMLInputElement>('.cnpm-pay__choice input[type="radio"]')!.click();
    await settle();
    clickStartsWith('Continuer');
    await settle();

    // Orange Money = premier opérateur (Mobile Money).
    host.querySelector<HTMLButtonElement>('.cnpm-pay__operator')!.click();
    await settle();
    clickStartsWith('Continuer');
    await settle();

    setInput('#pay-phone', '70 12 34 56');
    await settle();
    clickStartsWith('Continuer'); // vers la confirmation
    await settle();

    clickStartsWith('Payer');
    await new Promise((resolve) => setTimeout(resolve, 1300));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-pay__result-title')?.textContent).toContain(
      'en attente de la passerelle',
    );
    expect(host.querySelector('.cnpm-pay__result-lead')?.textContent).toContain(
      'Aucun montant n’a été débité',
    );
    expect(host.querySelector('.cnpm-pay__result-next')?.textContent).toContain('Orange Money');
  });
});
