import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import {
  MEMBERS_GATEWAY,
  MembersAccessError,
  type MembersGateway,
  type MembersPage as MembersPageData,
  type MemberRow,
} from './members-gateway';
import { MembersPage } from './members.page';

/**
 * Ces tests pilotent l'écran par un port contrôlable, sans passer par le délai du
 * gateway de démonstration : ils exercent de façon déterministe les états que la fiche
 * exige et que l'adaptateur de démonstration ne peut pas produire — chargement, erreur
 * récupérable avec relance, et accès refusé.
 */

const EMPTY_PAGE: MembersPageData = {
  rows: [],
  totalItems: 0,
  overview: {
    membersTotal: 0,
    active: 0,
    dormant: 0,
    prospects: 0,
    largeContributors: 0,
    expected: 0,
    collected: 0,
    recoveryRate: null,
  },
  categories: [],
  groups: [],
};

const MEMBER_ROW: MemberRow = {
  id: 'membership-demo-001',
  code: 'CNPM-DEMO-001',
  organization: 'Entreprise Démo SA',
  category: 'A',
  group: 'Groupement démo',
  contactName: 'Contact Démo',
  contactPhone: '+223 00 00 00 00',
  contactEmail: 'contact@example.test',
  due: 1_000_000,
  paid: 750_000,
  status: 'ACTIVE',
  lastActivity: '2026-07-18',
  isLargeContributor: false,
};

const READY_PAGE: MembersPageData = {
  ...EMPTY_PAGE,
  rows: [MEMBER_ROW],
  totalItems: 1,
  overview: {
    ...EMPTY_PAGE.overview,
    membersTotal: 1,
    active: 1,
    expected: MEMBER_ROW.due,
    collected: MEMBER_ROW.paid,
    recoveryRate: 75,
  },
  categories: [MEMBER_ROW.category],
  groups: [MEMBER_ROW.group],
};

/** Gateway dont chaque appel expose un flux que le test résout ou fait échouer à la demande. */
class ControllableGateway implements MembersGateway {
  readonly calls: Subject<MembersPageData>[] = [];

  search(): Subject<MembersPageData> {
    const subject = new Subject<MembersPageData>();
    this.calls.push(subject);
    return subject;
  }

  get latest(): Subject<MembersPageData> {
    return this.calls[this.calls.length - 1];
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MembersPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEMBERS_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(MembersPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return {
    fixture,
    gateway,
    host: fixture.nativeElement as HTMLElement,
    router: TestBed.inject(Router),
  };
}

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const match = Array.from(host.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  if (!match) {
    throw new Error(`Bouton introuvable : ${label}`);
  }
  return match;
}

describe('MembersPage — états requis', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le squelette pendant le chargement, jamais une page blanche', async () => {
    const { host } = await setup();
    // Avant toute réponse du port, l'écran doit montrer le squelette de la table.
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.querySelector('.cnpm-skeleton__status')?.textContent).toContain('Chargement');
  });

  it('passe à l’état prêt une fois les données reçues', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next({ ...EMPTY_PAGE });
    await fixture.whenStable();
    fixture.detectChanges();
    // Base vide sans filtre : état « première utilisation », pas le squelette.
    expect(host.querySelector('.cnpm-skeleton')).toBeNull();
    expect(host.textContent).toContain('Aucun membre enregistré');
  });

  it('affiche une erreur récupérable AVEC une action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new Error('panne réseau'));
    await fixture.whenStable();
    fixture.detectChanges();

    const error = host.querySelector('.cnpm-error--recoverable');
    expect(error).not.toBeNull();
    // La matrice loading-empty-error impose « réessayer » pour une erreur récupérable.
    const retry = Array.from(host.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réessayer'),
    );
    expect(retry).toBeDefined();
  });

  it('relance le chargement au clic sur « Réessayer », sans recharger la page', async () => {
    const { fixture, gateway, host } = await setup();
    const callsBefore = gateway.calls.length;
    gateway.latest.error(new Error('panne'));
    await fixture.whenStable();
    fixture.detectChanges();

    const retry = Array.from(host.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réessayer'),
    ) as HTMLButtonElement;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Un nouvel appel au port a été émis : la relance repart en chargement.
    expect(gateway.calls.length).toBe(callsBefore + 1);
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
  });

  it('affiche l’état « accès refusé » sur un 403, SANS action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    // Un refus de droit ne se réessaie pas : répéter une requête condamnée n'a pas de sens.
    gateway.latest.error(new MembersAccessError());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    const retry = Array.from(host.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Réessayer'),
    );
    expect(retry).toBeUndefined();
  });

  it('ouvre BO-009 depuis l action primaire Nouveau membre', async () => {
    const { host, router } = await setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    button(host, 'Nouveau membre').click();

    expect(navigate).toHaveBeenCalledWith(['/admin/enrollments/new']);
  });

  it('ouvre la fiche et son historique en conservant le contexte de liste', async () => {
    const { fixture, gateway, host, router } = await setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    button(host, 'Voir').click();
    button(host, 'Historique').click();

    expect(navigate).toHaveBeenNthCalledWith(1, ['/admin/members', MEMBER_ROW.id], {
      queryParamsHandling: 'preserve',
    });
    expect(navigate).toHaveBeenNthCalledWith(2, ['/admin/members', MEMBER_ROW.id], {
      queryParams: { onglet: 'historique', hpage: null },
      queryParamsHandling: 'merge',
    });
  });
});
