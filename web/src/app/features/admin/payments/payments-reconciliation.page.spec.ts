import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { DemoPaymentsGateway } from './demo-payments.gateway';
import {
  PAYMENTS_GATEWAY,
  PaymentsAccessError,
  PaymentsValidationError,
  type PaymentsGateway,
  type PaymentsQueuePage,
  type StatementLine,
} from './payments-gateway';
import { PaymentsReconciliationPage } from './payments-reconciliation.page';

/**
 * Deux niveaux sont éprouvés ici.
 *
 * L'écran est piloté par un port contrôlable, sans passer par la latence de
 * l'adaptateur de démonstration : c'est le seul moyen d'atteindre de façon
 * déterministe les états que la fiche exige et que l'adaptateur ne sait pas produire
 * — chargement, panne récupérable, accès refusé.
 *
 * L'adaptateur, lui, est éprouvé directement sur les règles qui protègent une écriture
 * financière : idempotence, borne du montant affecté, anomalie incomplète.
 */

const LINE: StatementLine = {
  id: 'line-test-1',
  reference: 'MM-2026-0714-99001',
  payer: 'Sahel Agro SA',
  amount: 1000000,
  channel: 'MOBILE_MONEY',
  valueDate: '2026-07-14T11:23:00Z',
  transactionReference: 'DEMO-TEST-99001',
  status: 'UNMATCHED',
  allocation: null,
  suggestions: [
    {
      id: 'sugg-test-1',
      memberCode: 'CNPM-DEMO-0101',
      memberName: 'Sahel Agro SA',
      contributionLabel: 'Cotisation annuelle 2026',
      period: 'T1 2026 – T4 2026',
      expectedAmount: 1000000,
      score: 97,
      reasons: ['Montant identique au montant attendu'],
    },
  ],
};

const EMPTY_PAGE: PaymentsQueuePage = {
  lines: [],
  totalItems: 0,
  overview: { toReconcile: 0, toConfirm: 0, anomalies: 0, amountToReconcile: 0 },
  auditTrail: [],
  channels: [],
};

/** Port dont chaque appel expose un flux que le test résout ou fait échouer à la demande. */
class ControllableGateway implements PaymentsGateway {
  readonly calls: Subject<PaymentsQueuePage>[] = [];

  search(): Subject<PaymentsQueuePage> {
    const subject = new Subject<PaymentsQueuePage>();
    this.calls.push(subject);
    return subject;
  }

  reconcile(): Subject<never> {
    return new Subject<never>();
  }

  reportAnomaly(): Subject<never> {
    return new Subject<never>();
  }

  get latest(): Subject<PaymentsQueuePage> {
    return this.calls[this.calls.length - 1];
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  // L'écran fournit lui-même l'adaptateur de démonstration pour fonctionner sans
  // route câblée ; le test substitue le port au même niveau, ce qui vérifie au passage
  // que cette fourniture reste bien remplaçable.
  TestBed.overrideComponent(PaymentsReconciliationPage, {
    set: { providers: [{ provide: PAYMENTS_GATEWAY, useValue: gateway }] },
  });

  await TestBed.configureTestingModule({
    imports: [PaymentsReconciliationPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PaymentsReconciliationPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

function buttonLabelled(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    (button.textContent ?? '').includes(label),
  );
}

describe('PaymentsReconciliationPage — états requis', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le squelette pendant le chargement, jamais une page blanche', async () => {
    const { host } = await setup();
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.querySelector('.cnpm-skeleton__status')?.textContent).toContain('Chargement');
  });

  it('distingue une file vide d’un filtre sans résultat', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next({ ...EMPTY_PAGE });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-skeleton')).toBeNull();
    // Sans filtre actif, la file est vide : rien à traiter, pas « aucun résultat ».
    expect(host.textContent).toContain('Aucune ligne dans cette file');
  });

  it('rend le statut et la confiance en toutes lettres, jamais par la seule couleur', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next({
      ...EMPTY_PAGE,
      lines: [LINE],
      totalItems: 1,
      channels: ['MOBILE_MONEY'],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const text = host.textContent ?? '';
    expect(text).toContain('MM-2026-0714-99001');
    expect(text).toContain('Non rapproché');
    expect(text).toContain('Confiance élevée');
    expect(text).toContain('Mobile Money');
    expect(text).toContain('REÇU DE DÉMONSTRATION');
    expect(text).toContain('Aucun cachet, signature ou QR officiel');
  });

  it('affiche une erreur récupérable AVEC une action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new Error('panne réseau'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--recoverable')).not.toBeNull();
    expect(buttonLabelled(host, 'Réessayer')).toBeDefined();
  });

  it('affiche « accès refusé » sur un 403, SANS action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    // Un refus de droit ne se réessaie pas : le proposer inviterait à répéter une
    // action que la permission condamne.
    gateway.latest.error(new PaymentsAccessError());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    expect(buttonLabelled(host, 'Réessayer')).toBeUndefined();
  });

  it('ouvre le panneau de rapprochement sur la ligne portée par l’URL', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next({
      ...EMPTY_PAGE,
      lines: [LINE],
      totalItems: 1,
      channels: ['MOBILE_MONEY'],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    await TestBed.inject(Router).navigate([], { queryParams: { ligne: LINE.id } });
    await fixture.whenStable();
    fixture.detectChanges();

    // La correspondance proposée et son motif sont affichés : un score qu'on ne peut
    // pas contester ne peut pas être audité.
    expect(host.textContent).toContain('Correspondances proposées');
    expect(host.textContent).toContain('Montant identique au montant attendu');
    expect(buttonLabelled(host, 'Rapprocher')).toBeDefined();
  });
});

describe('DemoPaymentsGateway — règles protégeant l’écriture', () => {
  it('ne crée pas de doublon lorsqu’une même clé d’idempotence est rejouée', async () => {
    const gateway = new DemoPaymentsGateway();
    const target = await firstOpenLine(gateway);
    const command = {
      idempotencyKey: 'test-double-clic',
      assignments: [
        {
          lineId: target.id,
          suggestionId: target.suggestions[0].id,
          allocatedAmount: target.amount,
        },
      ],
      comment: null,
    };

    const first = await firstValueFrom(gateway.reconcile(command));
    const second = await firstValueFrom(gateway.reconcile(command));

    expect(first.replayed).toBe(false);
    // Le second envoi — double clic, renvoi réseau — est reconnu, pas réécrit.
    expect(second.replayed).toBe(true);

    const awaiting = await countIn(gateway, 'a-confirmer');
    expect(awaiting).toBe(1 + INITIAL_AWAITING);
  });

  it('refuse un montant affecté supérieur au montant encaissé', async () => {
    const gateway = new DemoPaymentsGateway();
    const target = await firstOpenLine(gateway);

    await expect(
      firstValueFrom(
        gateway.reconcile({
          idempotencyKey: 'test-montant-excessif',
          assignments: [
            {
              lineId: target.id,
              suggestionId: target.suggestions[0].id,
              allocatedAmount: target.amount + 1,
            },
          ],
          comment: null,
        }),
      ),
    ).rejects.toBeInstanceOf(PaymentsValidationError);
  });

  it('refuse une anomalie sans commentaire', async () => {
    const gateway = new DemoPaymentsGateway();
    const target = await firstOpenLine(gateway);

    // La fiche exige un type ET un commentaire ; la règle est tenue par la source,
    // pas seulement par le formulaire.
    await expect(
      firstValueFrom(
        gateway.reportAnomaly({
          idempotencyKey: 'test-anomalie-vide',
          lineId: target.id,
          type: 'UNKNOWN_PAYER',
          comment: '   ',
        }),
      ),
    ).rejects.toBeInstanceOf(PaymentsValidationError);
  });
});

/** Nombre de lignes déjà en attente de confirmation dans le jeu de démonstration. */
const INITIAL_AWAITING = 2;

async function firstOpenLine(gateway: DemoPaymentsGateway): Promise<StatementLine> {
  const page = await firstValueFrom(
    gateway.search({
      queue: 'a-rapprocher',
      search: '',
      channel: null,
      sort: null,
      page: 1,
      pageSize: 50,
    }),
  );
  return page.lines.filter((line) => line.suggestions.length > 0)[0];
}

async function countIn(gateway: DemoPaymentsGateway, queue: 'a-confirmer'): Promise<number> {
  const page = await firstValueFrom(
    gateway.search({ queue, search: '', channel: null, sort: null, page: 1, pageSize: 50 }),
  );
  return page.totalItems;
}
