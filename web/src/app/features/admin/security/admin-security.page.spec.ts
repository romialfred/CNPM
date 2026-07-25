import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  ADMIN_SECURITY_GATEWAY,
  type AdminSecurityGateway,
  type AdminSecuritySnapshot,
  type SecurityAccount,
} from './admin-security-gateway';
import { AdminSecurityPage } from './admin-security.page';

/**
 * Le tableau des comptes est filtrable par statut et par rôle, et ces filtres vivent dans
 * l'URL. Ce qui est vérifié ici, c'est la promesse faite à l'opérateur : ce qu'il voit
 * correspond au filtre, le filtre se partage, et une liste vide sous filtre ne se
 * confond jamais avec une plateforme sans compte — les deux appellent des gestes opposés.
 */

function account(overrides: Partial<SecurityAccount> & Pick<SecurityAccount, 'id'>) {
  return {
    fullName: 'Compte de test',
    email: 'compte@example.test',
    roleId: 'admin-technique',
    roleLabel: 'Administrateur technique',
    status: 'ACTIVE',
    twoFactor: 'ENABLED',
    lastLoginAt: '2026-07-21T08:30:00Z',
    lastLoginLabel: '21 juillet 2026, 08:30',
    activeSessions: 2,
    ...overrides,
  } satisfies SecurityAccount;
}

const ACTIF = account({
  id: 'a-1',
  fullName: 'Aminata Coulibaly',
  email: 'aminata.coulibaly@example.test',
});

const SUSPENDU = account({
  id: 'a-2',
  fullName: 'Boubacar Traoré',
  email: 'boubacar.traore@example.test',
  roleId: 'auditeur',
  roleLabel: 'Auditeur',
  status: 'SUSPENDED',
});

const INVITE = account({
  id: 'a-3',
  fullName: 'Fatoumata Diallo',
  email: 'fatoumata.diallo@example.test',
  status: 'INVITED',
  twoFactor: 'PENDING',
  lastLoginAt: null,
  lastLoginLabel: null,
  activeSessions: 0,
});

const SNAPSHOT: AdminSecuritySnapshot = {
  accounts: [ACTIF, SUSPENDU, INVITE],
  roles: [
    { id: 'admin-technique', label: 'Administrateur technique', description: '', accounts: 2 },
    { id: 'auditeur', label: 'Auditeur', description: '', accounts: 1 },
  ],
  permissions: [],
  sessions: [],
  audit: [],
  policy: [],
  posture: {
    accountsTotal: 3,
    activeAccounts: 1,
    suspendedAccounts: 1,
    twoFactorEnabled: 2,
    openSessions: 4,
  },
  counts: { accounts: 3, roles: 2, permissions: 0, sessions: 0, auditEntries: 0 },
  membersWithoutAccount: [],
  canManagePermissions: false,
};

class ActivatedRouteStub {
  private readonly subject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  readonly queryParamMap;
  readonly snapshot;

  constructor(params: Record<string, string>) {
    this.subject = new BehaviorSubject(convertToParamMap(params));
    this.queryParamMap = this.subject.asObservable();
    // `data` porte l'onglet par défaut de la route (BO-030 / BO-031 partagent l'écran).
    this.snapshot = { queryParamMap: this.subject.value, data: {} as Record<string, unknown> };
  }
}

const GATEWAY: AdminSecurityGateway = {
  load: () => of(SNAPSHOT),
  createAccount: () => of(ACTIF),
  changeAccountStatus: () => of(ACTIF),
  resetTwoFactor: () => of(ACTIF),
  deleteAccount: () => of(undefined),
  issueCredentialToken: () =>
    of({
      token: 'demo-lien-a-1',
      expiresAt: '2026-07-22T00:00:00Z',
      activation: false,
    }),
  setPermissionGrant: () => {
    throw new Error('non sollicité');
  },
} as unknown as AdminSecurityGateway;

async function setup(params: Record<string, string> = {}) {
  await TestBed.configureTestingModule({
    imports: [AdminSecurityPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: new ActivatedRouteStub(params) },
      { provide: ADMIN_SECURITY_GATEWAY, useValue: GATEWAY },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AdminSecurityPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, navigate, host: fixture.nativeElement as HTMLElement };
}

/** Noms affichés dans le tableau des comptes, dans l'ordre du rendu. */
function displayedNames(host: HTMLElement): string[] {
  return [...host.querySelectorAll('.cnpm-security__identity-name')].map((node) =>
    (node.textContent ?? '').trim(),
  );
}

describe('AdminSecurityPage — filtres du tableau des comptes', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('affiche tous les comptes lorsque aucun filtre n’est posé', async () => {
    const { host } = await setup();

    expect(displayedNames(host)).toEqual([
      'Aminata Coulibaly',
      'Boubacar Traoré',
      'Fatoumata Diallo',
    ]);
  });

  it('ne garde que les comptes du statut demandé par l’URL', async () => {
    const { host } = await setup({ statut: 'SUSPENDED' });

    expect(displayedNames(host)).toEqual(['Boubacar Traoré']);
  });

  it('ne garde que les comptes du rôle demandé par l’URL', async () => {
    const { host } = await setup({ role: 'auditeur' });

    expect(displayedNames(host)).toEqual(['Boubacar Traoré']);
  });

  it('combine statut et rôle plutôt que de les opposer', async () => {
    const { host } = await setup({ statut: 'ACTIVE', role: 'auditeur' });

    expect(displayedNames(host)).toEqual([]);
  });

  it('ignore un statut inconnu au lieu de vider le tableau', async () => {
    const { host } = await setup({ statut: 'INEXISTANT' });

    expect(displayedNames(host)).toHaveLength(3);
  });

  it('porte le filtre choisi dans l’URL — la vue filtrée se partage', async () => {
    const { fixture, navigate } = await setup();
    const select = fixture.nativeElement.querySelector('#filtre-statut') as HTMLSelectElement;

    select.value = 'SUSPENDED';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { statut: 'SUSPENDED' } }),
    );
  });

  it('retire les trois filtres d’un seul geste', async () => {
    const { fixture, navigate } = await setup({ statut: 'SUSPENDED', role: 'auditeur', q: 'tra' });
    const reset = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Réinitialiser'),
    ) as HTMLButtonElement;

    reset.click();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { q: null, statut: null, role: null } }),
    );
  });

  it('distingue « aucun résultat » sous filtre d’une plateforme sans compte', async () => {
    const { host } = await setup({ statut: 'ACTIVE', role: 'auditeur' });

    expect(host.textContent).toContain('Aucun compte ne correspond');
    expect(host.textContent).not.toContain('Aucun compte enregistré');
  });
});

describe('AdminSecurityPage — identité du compte', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('expose la dernière connexion et les sessions ouvertes sous l’identité', async () => {
    const { host } = await setup({ statut: 'SUSPENDED' });

    // Le gabarit espace les fragments (@if, <time>) : on compare le texte lu, pas la
    // mise en forme du HTML.
    const text = (host.textContent ?? '').replace(/\s+/g, ' ');
    expect(text).toContain('Dernière connexion : 21 juillet 2026, 08:30');
    expect(text).toContain('2 sessions ouvertes');
  });

  it('dit « jamais connecté » plutôt que d’afficher une date absente', async () => {
    const { host } = await setup({ statut: 'INVITED' });

    const text = host.textContent ?? '';
    expect(text).toContain('Jamais connecté');
    expect(text).not.toContain('session ouverte');
  });
});
