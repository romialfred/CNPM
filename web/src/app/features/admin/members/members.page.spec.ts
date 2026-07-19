import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import {
  MEMBERS_GATEWAY,
  MembersAccessError,
  type MembersGateway,
  type MembersPage as MembersPageData,
  type MembersOverview,
  type MemberRow,
} from './members-gateway';
import { MembersPage } from './members.page';

/**
 * Ces tests pilotent l'écran par un port contrôlable, sans passer par le délai du
 * gateway de démonstration : ils exercent de façon déterministe les états que la fiche
 * exige et que l'adaptateur de démonstration ne peut pas produire — chargement, erreur
 * récupérable avec relance, et accès refusé.
 */

const EMPTY_OVERVIEW: MembersOverview = {
  membersTotal: 0,
  active: 0,
  dormant: 0,
  prospects: 0,
  largeContributors: 0,
  expected: 0,
  collected: 0,
  recoveryRate: null,
};

const EMPTY_PAGE: MembersPageData = {
  rows: [],
  totalItems: 0,
  overview: EMPTY_OVERVIEW,
  categories: [],
  groups: [],
  supportedSortKeys: ['code', 'organization', 'due', 'paid', 'status', 'lastActivity'],
};

const MEMBER_ROW: MemberRow = {
  id: 'membership-demo-001',
  organizationId: 'organization-demo-001',
  code: 'CNPM-2026-001',
  organization: 'Entreprise Sahel SA',
  category: 'A',
  group: 'Industries',
  contactName: 'Contact principal',
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
    ...EMPTY_OVERVIEW,
    membersTotal: 1,
    active: 1,
    expected: MEMBER_ROW.due ?? 0,
    collected: MEMBER_ROW.paid ?? 0,
    recoveryRate: 75,
  },
  categories: [MEMBER_ROW.category],
  groups: MEMBER_ROW.group ? [MEMBER_ROW.group] : [],
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

async function setup(withEnrollmentPermission = true) {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MembersPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEMBERS_GATEWAY, useValue: gateway },
      withEnrollmentPermission
        ? { provide: SESSION_GATEWAY, useClass: DemoSessionGateway }
        : {
            provide: SESSION_GATEWAY,
            useValue: {
              identity: of({
                displayName: 'Lecteur',
                roleLabel: 'LECTEUR',
                exerciseLabel: null,
                notificationCount: null,
                demoMode: false,
                permissions: ['MEMBER.READ'],
              }),
            },
          },
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

  it('masque le CTA BO-009 sans ENROLLMENT.CREATE', async () => {
    const { host } = await setup(false);
    expect(
      Array.from(host.querySelectorAll('button')).some((item) =>
        item.textContent?.includes('Nouveau membre'),
      ),
    ).toBe(false);
  });

  it('ouvre la fiche et son historique en conservant le contexte de liste', async () => {
    const { fixture, gateway, host, router } = await setup();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    button(host, 'Voir').click();
    button(host, 'Historique').click();

    expect(navigate).toHaveBeenNthCalledWith(1, ['/admin/members', MEMBER_ROW.organizationId], {
      queryParamsHandling: 'preserve',
    });
    expect(navigate).toHaveBeenNthCalledWith(2, ['/admin/members', MEMBER_ROW.organizationId], {
      queryParams: { onglet: 'historique', hpage: null },
      queryParamsHandling: 'merge',
    });
  });
});
