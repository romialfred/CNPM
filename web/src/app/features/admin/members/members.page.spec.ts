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

describe('MembersPage — vue en tuiles', () => {
  async function rendu(vue?: string) {
    const contexte = await setup();
    if (vue) {
      await contexte.router.navigate([], { queryParams: { vue } });
    }
    contexte.gateway.latest.next(READY_PAGE);
    await contexte.fixture.whenStable();
    contexte.fixture.detectChanges();
    return contexte;
  }

  it('rend le tableau par défaut et les tuiles quand l’URL le demande', async () => {
    const parDefaut = await rendu();
    expect(parDefaut.host.querySelector('cnpm-data-table')).not.toBeNull();
    expect(parDefaut.host.querySelectorAll('.cnpm-members__tile')).toHaveLength(0);

    TestBed.resetTestingModule();
    const tuiles = await rendu('tuiles');
    expect(tuiles.host.querySelector('cnpm-data-table')).toBeNull();
    expect(tuiles.host.querySelectorAll('.cnpm-members__tile')).toHaveLength(1);
  });

  it('expose les actions de la tuile en permanence, jamais au seul survol', async () => {
    // La tuile ne se retourne plus : la maquette montre des cartes fixes portant des
    // actions, et une action révélée au seul survol est inatteignable au toucher.
    const { host } = await rendu('tuiles');
    const tuile = host.querySelector('.cnpm-members__tile');
    const actions = Array.from(
      tuile?.querySelectorAll<HTMLButtonElement>('.cnpm-members__tile-action') ?? [],
    );

    // Plus de dos : ni conteneur, ni mécanique de retournement.
    expect(host.querySelector('.cnpm-members__tile-back')).toBeNull();
    expect(host.querySelector('.cnpm-members__tile-inner')).toBeNull();

    expect(actions).toHaveLength(2);
    for (const action of actions) {
      // Chaque bouton garde un nom accessible : deux pictogrammes muets rendraient la
      // rangée indéchiffrable pour un lecteur d'écran.
      expect(action.textContent?.trim()).toBeTruthy();
      expect(action.getAttribute('title')).toBeTruthy();
      expect(action.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('rend les panneaux de synthèse en entier, pictogramme compris', async () => {
    // Régression vécue : le pictogramme était passé par son NOM (`icon="users"`).
    // `LucideDynamicIcon` accepte une chaîne, mais elle suppose un registre nom → icône
    // que ce dépôt n'installe pas ; l'exception « Unable to resolve icon » vidait tout le
    // panneau. Les chiffres disparaissaient sans qu'aucun test n'échoue.
    const { host } = await rendu();
    const panneaux = Array.from(host.querySelectorAll('cnpm-insight-summary'));

    expect(panneaux).toHaveLength(2);
    for (const panneau of panneaux) {
      expect(panneau.querySelector('.cnpm-insight__emblem svg')).not.toBeNull();
      // Le panneau porte bien ses mesures, pas seulement son titre.
      expect(panneau.querySelectorAll('.cnpm-insight__stat').length).toBeGreaterThan(0);
      expect(panneau.querySelector('.cnpm-insight__stat dt')?.textContent?.trim()).toBeTruthy();
      expect(panneau.querySelector('.cnpm-insight__stat dd')?.textContent?.trim()).toBeTruthy();
    }
  });

  it('rend le taux de recouvrement en jauge accessible', async () => {
    const { host } = await rendu();
    const jauge = host.querySelector('[role="progressbar"]');

    expect(jauge).not.toBeNull();
    expect(jauge?.getAttribute('aria-valuemin')).toBe('0');
    expect(jauge?.getAttribute('aria-valuemax')).toBe('100');
    // Le nom accessible est le libellé affiché, et la valeur est lisible en toutes
    // lettres : une barre dont la valeur ne dépend que d'une longueur ne se lit pas.
    const libelle = jauge?.getAttribute('aria-labelledby');
    expect(host.querySelector(`#${libelle}`)?.textContent?.trim()).toBe('Taux de recouvrement');
    expect(jauge?.getAttribute('aria-valuetext')).toContain('%');
  });

  it('annonce la vue active par aria-pressed', async () => {
    const { host } = await rendu('tuiles');
    const boutons = Array.from(host.querySelectorAll('.cnpm-members__view'));

    expect(boutons.map((bouton) => bouton.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
    ]);
  });

  it('accompagne chaque presentation d un pictogramme decoratif', async () => {
    const { host } = await rendu('tuiles');
    const boutons = Array.from(host.querySelectorAll('.cnpm-members__view'));

    // On n'assere PAS `aria-hidden` sur le pictogramme : `@lucide/angular` le pose de
    // lui-meme en l'absence de `title`. L'affirmer testerait la bibliotheque, pas ce
    // code — l'audit independant l'a montre en le mutant sans faire echouer le test.
    // Ce qui doit etre verifie ici, c'est que le libelle ecrit reste la seule source du
    // nom accessible : aucun `aria-label` ne doit le supplanter.
    expect(boutons).toHaveLength(2);
    expect(boutons.map((bouton) => bouton.textContent?.trim())).toEqual(['Tableau', 'Tuiles']);
    for (const bouton of boutons) {
      expect(bouton.querySelector('svg')).not.toBeNull();
      expect(bouton.getAttribute('aria-label')).toBeNull();
    }
  });

  it('derive le bandeau d indicateurs de la meme source que le tableau', async () => {
    // Un bandeau qui contredirait le total affiche plus bas serait le « total
    // incoherent » que la fiche BO-002 interdit : les deux viennent d'`overview`.
    const { host } = await rendu();
    const libelles = Array.from(host.querySelectorAll('.cnpm-members__kpi-label')).map(
      (element) => element.textContent?.trim(),
    );

    expect(libelles).toEqual([
      'Base de membres',
      'Membres actifs',
      'Cotisants dormants',
      'Taux de recouvrement',
    ]);
    // La base exclut les prospects : la legende doit le dire, faute de quoi le chiffre
    // se lirait comme un total tous statuts confondus.
    expect(host.querySelector('.cnpm-members__kpi-caption')?.textContent).toContain(
      'prospects exclus',
    );
  });

  it('double le badge de statut par un lisere, sans jamais le remplacer', async () => {
    // Le lisere est une redondance visuelle. Le statut reste ecrit en toutes lettres :
    // retirer la couleur ne doit retirer aucune information (WCAG 2.2, critere 1.4.1).
    const { host } = await rendu('tuiles');
    const tuiles = Array.from(host.querySelectorAll('.cnpm-members__tile'));

    expect(tuiles.length).toBeGreaterThan(0);
    for (const tuile of tuiles) {
      const accent = Array.from(tuile.classList).find((classe) =>
        classe.startsWith('cnpm-members__tile--'),
      );
      expect(accent).toBeDefined();
      expect(tuile.querySelector('cnpm-badge')?.textContent?.trim()).toBeTruthy();
    }
  });
});
