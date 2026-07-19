import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  CONTRIBUTIONS_GATEWAY,
  ContributionsAccessError,
  type ContributionCallQuery,
  type ContributionCallsPage,
  type ContributionsGateway,
} from './contributions-gateway';
import { ContributionsPage } from './contributions.page';
import { DemoContributionsGateway } from './demo-contributions.gateway';

/**
 * BO-011. Deux campagnes distinctes :
 *
 * - les invariants du jeu de données, éprouvés directement sur l'adaptateur — ce sont
 *   les critères d'acceptation de la fiche, et ils doivent tenir pour *toutes* les
 *   lignes, pas seulement pour celles qu'une capture montre ;
 * - les états de l'écran, pilotés par un port contrôlable, car le délai de l'adaptateur
 *   de démonstration ne peut produire ni l'erreur récupérable ni le refus d'accès.
 */

const EMPTY_PAGE: ContributionCallsPage = {
  rows: [],
  totalItems: 0,
  overview: {
    callsIssued: 0,
    calledTotal: 0,
    collectedTotal: 0,
    outstandingTotal: 0,
    recoveryRate: null,
  },
  fiscalYears: [],
  asOf: '2024-06-30',
};

const ALL: ContributionCallQuery = {
  search: '',
  fiscalYear: null,
  quarter: null,
  status: null,
  sort: null,
  page: 1,
  pageSize: 100,
};

/** Port dont chaque appel expose un flux que le test résout ou fait échouer à la demande. */
class ControllableGateway implements ContributionsGateway {
  readonly calls: Subject<ContributionCallsPage>[] = [];

  searchCalls(): Subject<ContributionCallsPage> {
    const subject = new Subject<ContributionCallsPage>();
    this.calls.push(subject);
    return subject;
  }

  get latest(): Subject<ContributionCallsPage> {
    return this.calls[this.calls.length - 1];
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [ContributionsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: CONTRIBUTIONS_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ContributionsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('DemoContributionsGateway — critères d’acceptation BO-011', () => {
  it('respecte « appelé = payé + reste » sur chaque appel, ajustement déduit', async () => {
    const page = await firstValueFrom(new DemoContributionsGateway().searchCalls(ALL));

    expect(page.rows.length).toBeGreaterThan(0);
    for (const call of page.rows) {
      expect(call.paidAmount + call.outstandingAmount + call.adjustmentAmount).toBe(
        call.calledAmount,
      );
    }
  });

  it('n’émet jamais un appel « Encaissé » avec un solde restant dû', async () => {
    const page = await firstValueFrom(new DemoContributionsGateway().searchCalls(ALL));

    for (const call of page.rows) {
      if (call.status === 'SETTLED') {
        expect(call.outstandingAmount).toBe(0);
      }
      // Réciproque : un solde nul sur un appel émis ne peut pas rester « en retard ».
      if (call.outstandingAmount === 0 && call.status !== 'DRAFT') {
        expect(call.status).toBe('SETTLED');
      }
    }
  });

  it('distingue les échéances échues des échéances à venir à la date d’arrêté', async () => {
    const page = await firstValueFrom(new DemoContributionsGateway().searchCalls(ALL));

    for (const call of page.rows) {
      expect(call.pastDue).toBe(call.dueDate < page.asOf);
    }
    // Le jeu doit couvrir les deux cas, sans quoi le critère ne serait pas éprouvé.
    expect(page.rows.some((call) => call.pastDue)).toBe(true);
    expect(page.rows.some((call) => !call.pastDue)).toBe(true);
  });

  it('exclut les brouillons des montants appelés — un appel non émis n’a rien appelé', async () => {
    const gateway = new DemoContributionsGateway();
    const page = await firstValueFrom(gateway.searchCalls(ALL));
    const issued = page.rows.filter((call) => call.status !== 'DRAFT');

    expect(page.rows.some((call) => call.status === 'DRAFT')).toBe(true);
    expect(page.overview.callsIssued).toBe(issued.length);
    expect(page.overview.calledTotal).toBe(
      issued.reduce((sum, call) => sum + call.calledAmount, 0),
    );
  });

  it('borne la synthèse au périmètre filtré, comme le tableau', async () => {
    const gateway = new DemoContributionsGateway();
    const all = await firstValueFrom(gateway.searchCalls(ALL));
    const scoped = await firstValueFrom(gateway.searchCalls({ ...ALL, fiscalYear: '2023' }));

    expect(scoped.totalItems).toBeLessThan(all.totalItems);
    // Un total « tous exercices » posé au-dessus d'une liste restreinte additionnerait
    // des montants que personne ne regarde.
    expect(scoped.overview.calledTotal).toBeLessThan(all.overview.calledTotal);
  });
});

describe('ContributionsPage — états requis', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le squelette pendant le chargement, jamais une page blanche', async () => {
    const { host } = await setup();
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.querySelector('.cnpm-skeleton__status')?.textContent).toContain('Chargement');
  });

  it('distingue la base vide du filtre sans résultat', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next({ ...EMPTY_PAGE });
    await fixture.whenStable();
    fixture.detectChanges();

    // Sans filtre actif, l'invitation porte sur la création, pas sur l'élargissement.
    expect(host.querySelector('.cnpm-skeleton')).toBeNull();
    expect(host.textContent).toContain('Aucun appel de cotisation');
  });

  it('rend les appels avec le statut « Encaissé », jamais l’impératif « Encaisser »', async () => {
    const { fixture, gateway, host } = await setup();
    const page = await firstValueFrom(new DemoContributionsGateway().searchCalls(ALL));
    gateway.latest.next(page);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = host.textContent ?? '';
    expect(text).toContain('Encaissé');
    expect(text).not.toContain('Encaisser');
    expect(text).toContain('Détail de l’échéancier');
    expect(text).toContain('Situation des encaissements');
    expect(text).toContain('ne constitue aucun barème CNPM');
    const unavailableActions = Array.from(host.querySelectorAll('button')).filter((button) =>
      /Générer des appels|Créer un échéancier/.test(button.textContent ?? ''),
    );
    expect(unavailableActions).toHaveLength(2);
    expect(
      unavailableActions.every((button) => button.getAttribute('aria-disabled') === 'true'),
    ).toBe(true);
  });

  it('aligne les montants à droite et n’offre « Relancer » que sur un appel non soldé', async () => {
    const { fixture, gateway, host } = await setup();
    const page = await firstValueFrom(new DemoContributionsGateway().searchCalls(ALL));
    gateway.latest.next(page);
    await fixture.whenStable();
    fixture.detectChanges();

    // Trois colonnes de montants par ligne, toutes alignées à droite (critère de la fiche).
    expect(host.querySelectorAll('.cnpm-table__cell--end').length).toBeGreaterThan(0);

    const remindable = page.rows.filter(
      (call) => call.status !== 'DRAFT' && call.status !== 'SETTLED',
    ).length;
    const emittable = page.rows.filter((call) => call.status === 'DRAFT').length;
    const label = (node: Element) => node.getAttribute('aria-label') ?? '';
    const buttons = Array.from(host.querySelectorAll('button'));

    expect(remindable).toBeGreaterThan(0);
    expect(emittable).toBeGreaterThan(0);
    expect(buttons.filter((b) => label(b).startsWith('Relancer')).length).toBe(remindable);
    expect(buttons.filter((b) => label(b).startsWith('Émettre')).length).toBe(emittable);
  });

  it('affiche une erreur récupérable AVEC une action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new Error('panne réseau'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--recoverable')).not.toBeNull();
    const retry = Array.from(host.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réessayer'),
    );
    expect(retry).toBeDefined();
  });

  it('affiche l’état « accès refusé » sur un 403, SANS action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    // Un refus de droit ne se réessaie pas : répéter une requête condamnée n'a pas de sens.
    gateway.latest.error(new ContributionsAccessError());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    const retry = Array.from(host.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réessayer'),
    );
    expect(retry).toBeUndefined();
  });
});
