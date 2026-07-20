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
 * l'adaptateur de fixtures : c'est le seul moyen d'atteindre de façon
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
  transactionReference: 'TRX-TEST-99001',
  status: 'UNMATCHED',
  allocation: null,
  suggestions: [
    {
      id: 'sugg-test-1',
      memberCode: 'CNPM-2026-0101',
      memberName: 'Sahel Agro SA',
      contributionLabel: 'Cotisation annuelle 2026',
      period: 'T1 2026 – T4 2026',
      expectedAmount: 1000000,
      score: 97,
      reasons: ['Montant identique au montant attendu'],
    },
    {
      id: 'sugg-test-2',
      memberCode: 'CNPM-2026-0208',
      memberName: 'Sahel Agro Services',
      contributionLabel: 'Cotisation annuelle 2026',
      period: 'T1 2026 – T4 2026',
      expectedAmount: 1000000,
      score: 62,
      reasons: ['Raison sociale voisine'],
    },
  ],
};

/** Ligne déjà rapprochée, en attente du second agent : elle porte l'étape 3. */
const LINE_TO_CONFIRM: StatementLine = {
  ...LINE,
  id: 'line-test-2',
  reference: 'VB-2026-0712-88002',
  status: 'TO_CONFIRM',
  suggestions: [],
  allocation: {
    memberCode: 'CNPM-2026-0101',
    memberName: 'Sahel Agro SA',
    contributionLabel: 'Cotisation annuelle 2026',
    allocatedAmount: 1000000,
    remainder: 0,
  },
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
  // L'écran fournit lui-même l'adaptateur de fixtures pour fonctionner sans
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

/** Rend la file donnée puis stabilise la vue. */
async function emit(
  context: Awaited<ReturnType<typeof setup>>,
  lines: readonly StatementLine[],
): Promise<void> {
  context.gateway.latest.next({
    ...EMPTY_PAGE,
    lines,
    totalItems: lines.length,
    channels: ['MOBILE_MONEY'],
  });
  await context.fixture.whenStable();
  context.fixture.detectChanges();
}

async function examine(
  context: Awaited<ReturnType<typeof setup>>,
  lineId: string,
): Promise<void> {
  await TestBed.inject(Router).navigate([], { queryParams: { ligne: lineId } });
  await context.fixture.whenStable();
  context.fixture.detectChanges();
}

function buttonLabelled(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    (button.textContent ?? '').includes(label),
  );
}

/** Index (à partir de 1) de l'étape marquée courante ; 0 si aucune ne l'est. */
function currentStep(host: HTMLElement): number {
  const steps = Array.from(host.querySelectorAll('.cnpm-recon__step'));
  return steps.findIndex((step) => step.getAttribute('aria-current') === 'step') + 1;
}

describe('PaymentsReconciliationPage — états requis', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le squelette pendant le chargement, jamais une page blanche', async () => {
    const { host } = await setup();
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.querySelector('.cnpm-skeleton__status')?.textContent).toContain('Chargement');
  });

  it('distingue une file vide d’un filtre sans résultat', async () => {
    const context = await setup();
    await emit(context, []);

    expect(context.host.querySelector('.cnpm-skeleton')).toBeNull();
    // Sans filtre actif, la file est vide : rien à traiter, pas « aucun résultat ».
    expect(context.host.textContent).toContain('Aucun paiement dans cette file');
  });

  it('rend le statut et le canal en toutes lettres, jamais par la seule couleur', async () => {
    const context = await setup();
    await emit(context, [LINE]);

    const text = context.host.textContent ?? '';
    expect(text).toContain('MM-2026-0714-99001');
    expect(text).toContain('Non rapproché');
    expect(text).toContain('Mobile Money');
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
});

describe('PaymentsReconciliationPage — indicateur d’avancement', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('reste à l’étape 1 tant qu’aucun paiement n’est choisi', async () => {
    const context = await setup();
    await emit(context, [LINE]);

    expect(currentStep(context.host)).toBe(1);
    // Aucune étape ultérieure n'est annoncée franchie : le parcours ne ment pas.
    expect(context.host.querySelectorAll('.cnpm-recon__step--done')).toHaveLength(0);
    expect(context.host.textContent).toContain('Aucun paiement sélectionné');
  });

  it('passe à l’étape 2 dès qu’un paiement non rapproché est examiné', async () => {
    const context = await setup();
    await emit(context, [LINE]);
    await examine(context, LINE.id);

    expect(currentStep(context.host)).toBe(2);
    expect(context.host.querySelectorAll('.cnpm-recon__step--done')).toHaveLength(1);
    // L'avancement est écrit, pas seulement figuré par une pastille colorée.
    expect(context.host.textContent).toContain('Étape en cours');
  });

  it('passe à l’étape 3 pour une ligne en attente de confirmation', async () => {
    const context = await setup();
    await emit(context, [LINE_TO_CONFIRM]);
    await examine(context, LINE_TO_CONFIRM.id);

    expect(currentStep(context.host)).toBe(3);
    expect(context.host.querySelectorAll('.cnpm-recon__step--done')).toHaveLength(2);
  });
});

describe('PaymentsReconciliationPage — plan de rapprochement', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le score chiffré, son qualificatif et les motifs de correspondance', async () => {
    const context = await setup();
    await emit(context, [LINE]);
    await examine(context, LINE.id);

    const text = context.host.textContent ?? '';
    // Le score est une donnée réelle du port : il est affiché tel quel, avec les
    // motifs qui le fondent — un score qu'on ne peut pas contester ne s'audite pas.
    expect(text).toContain('Score 97 sur 100');
    expect(text).toContain('Confiance élevée');
    expect(text).toContain('Montant identique au montant attendu');
    expect(buttonLabelled(context.host, 'Confirmer le rapprochement')).toBeDefined();
    expect(text).toContain('validation par un second agent');
  });

  it('ne dévoile les correspondances alternatives que sur demande', async () => {
    const context = await setup();
    await emit(context, [LINE]);
    await examine(context, LINE.id);

    expect(context.host.textContent).not.toContain('Sahel Agro Services');
    const disclosure = context.host.querySelector<HTMLButtonElement>('.cnpm-recon__disclosure');
    expect(disclosure?.getAttribute('aria-expanded')).toBe('false');

    disclosure?.click();
    await context.fixture.whenStable();
    context.fixture.detectChanges();

    expect(context.host.textContent).toContain('Sahel Agro Services');
    expect(
      context.host.querySelector('.cnpm-recon__disclosure')?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('qualifie l’écart par un mot, pas par la seule couleur du badge', async () => {
    const context = await setup();
    await emit(context, [LINE]);
    await examine(context, LINE.id);

    // Mode « complète » par défaut : le montant reçu est affecté en totalité.
    expect(context.host.textContent).toContain('Affectation complète, aucun reste');
  });

  it('sélectionne un paiement à la fois, par bouton radio', async () => {
    const context = await setup();
    await emit(context, [LINE, LINE_TO_CONFIRM]);

    const radios = context.host.querySelectorAll<HTMLInputElement>(
      'input[name="paiement-examine"]',
    );
    expect(radios).toHaveLength(2);
    // Aucune case à cocher : une écriture financière en lot n'est pas arbitrée
    // (FIN-DEC-001), l'écran ne l'offre donc pas.
    expect(context.host.querySelector('.cnpm-table__checkbox')).toBeNull();

    await examine(context, LINE_TO_CONFIRM.id);
    const checked = context.host.querySelectorAll<HTMLInputElement>(
      'input[name="paiement-examine"]:checked',
    );
    expect(checked).toHaveLength(1);
  });
});

describe('PaymentsReconciliationPage — fonctions non supportées par le contrat', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('rend l’import et l’export présents mais neutralisés, motif à l’appui', async () => {
    const context = await setup();
    await emit(context, [LINE]);

    for (const id of ['motif-import', 'motif-export']) {
      const trigger = context.host.querySelector<HTMLButtonElement>(
        `button[aria-describedby="${id}"]`,
      );
      expect(trigger).not.toBeNull();
      expect(trigger?.getAttribute('aria-disabled')).toBe('true');
      // Un contrôle neutralisé sans motif laisse l'agent chercher une cause : le
      // motif est lié programmatiquement, pas seulement écrit à côté.
      expect(context.host.querySelector(`#${id}`)?.textContent?.trim()).not.toBe('');
    }
  });

  it('n’offre ni enregistrement en brouillon ni filtre par période', async () => {
    const context = await setup();
    await emit(context, [LINE]);
    await examine(context, LINE.id);

    const text = context.host.textContent ?? '';
    // `ReconciliationStatus` ne comporte aucun état de brouillon et `PaymentsQuery`
    // aucune période : rendre ces contrôles promettrait un effet qui n'existe pas.
    expect(buttonLabelled(context.host, 'Enregistrer brouillon')).toBeUndefined();
    expect(text).not.toContain('brouillon');
    expect(text).not.toContain('Période :');
    expect(context.host.querySelector('#filtre-periode')).toBeNull();
  });

  it('n’emploie aucun qualificatif plus affirmatif que les seuils en vigueur', async () => {
    const context = await setup();
    await emit(context, [LINE]);
    await examine(context, LINE.id);

    // FIN-DEC-001 bloque les seuils : « Correspondance très fiable » amplifierait une
    // règle que personne n'a arbitrée.
    expect(context.host.textContent).not.toContain('très fiable');
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

/** Nombre de lignes déjà en attente de confirmation dans le jeu de fixtures. */
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
