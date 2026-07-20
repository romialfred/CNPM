import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { DemoMemberDetailGateway } from './demo-member-detail.gateway';
import {
  MEMBER_DETAIL_GATEWAY,
  MemberDetailAccessError,
  MemberDetailNotFoundError,
  type MemberDetail,
  type MemberDetailGateway,
} from './member-detail-gateway';
import { MemberDetailPage } from './member-detail.page';

/**
 * L'écran est piloté par un port contrôlable, sans passer par la latence de
 * l'adaptateur de démonstration : les états exigés par la fiche — chargement, erreur
 * récupérable avec relance, accès refusé, membre introuvable — sont ainsi éprouvés de
 * façon déterministe.
 */
class ControllableGateway implements MemberDetailGateway {
  readonly calls: Subject<MemberDetail>[] = [];

  load(): Subject<MemberDetail> {
    const subject = new Subject<MemberDetail>();
    this.calls.push(subject);
    return subject;
  }

  get latest(): Subject<MemberDetail> {
    return this.calls[this.calls.length - 1];
  }
}

const MEMBER_ID = 'MEM-0001';

function routeStub(queryValues: Record<string, string | readonly string[]> = {}) {
  const params = convertToParamMap({ id: MEMBER_ID });
  const query = convertToParamMap(queryValues);
  return {
    paramMap: new BehaviorSubject(params).asObservable(),
    queryParamMap: new BehaviorSubject(query).asObservable(),
    snapshot: { paramMap: params, queryParamMap: query },
  };
}

async function setup(queryValues: Record<string, string | readonly string[]> = {}) {
  const gateway = new ControllableGateway();

  await TestBed.configureTestingModule({
    imports: [MemberDetailPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: routeStub(queryValues) },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: MEMBER_DETAIL_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(MemberDetailPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

function retryButton(host: HTMLElement): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    (button.textContent ?? '').includes('Réessayer'),
  );
}

describe('MemberDetailPage — états requis', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche un squelette pendant le chargement, jamais une page blanche', async () => {
    const { host } = await setup();
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.querySelector('.cnpm-skeleton__status')?.textContent).toContain('Chargement');
  });

  it('affiche l’identité, les onglets et les alertes une fois la fiche reçue', async () => {
    const { fixture, gateway, host } = await setup();
    const detail = await firstValueFrom(new DemoMemberDetailGateway().load(MEMBER_ID));
    gateway.latest.next(detail);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-skeleton')).toBeNull();
    // Un seul `h1`, portant la raison sociale du membre.
    const headings = host.querySelectorAll('h1');
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain(detail.identity.organization);
    expect(host.querySelectorAll('[role="tab"]').length).toBe(6);
    expect(host.querySelector('[role="tabpanel"]')).not.toBeNull();
  });

  it('ouvre BO-004 avec le contexte partageable de BO-003', async () => {
    const { fixture, gateway, host } = await setup({ onglet: 'cotisations', q: 'somacop' });
    const detail = await firstValueFrom(new DemoMemberDetailGateway().load(MEMBER_ID));
    gateway.latest.next(detail);
    await fixture.whenStable();
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const edit = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Modifier'),
    );
    edit?.click();

    expect(navigate).toHaveBeenCalledWith(['/admin/members', MEMBER_ID, 'edit'], {
      queryParamsHandling: 'preserve',
    });
  });

  it('affiche « membre introuvable » sans proposer de réessayer', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new MemberDetailNotFoundError());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--not-found')).not.toBeNull();
    // Un identifiant inconnu ne se réessaie pas : le geste utile est le retour à la liste.
    expect(retryButton(host)).toBeUndefined();
  });

  it('affiche « accès refusé » sans proposer de réessayer', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new MemberDetailAccessError());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    expect(retryButton(host)).toBeUndefined();
  });

  it('relance le chargement au clic sur « Réessayer » après une panne', async () => {
    const { fixture, gateway, host } = await setup();
    const callsBefore = gateway.calls.length;
    gateway.latest.error(new Error('panne réseau'));
    await fixture.whenStable();
    fixture.detectChanges();

    const retry = retryButton(host);
    expect(retry).toBeDefined();
    retry?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.calls.length).toBe(callsBefore + 1);
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
  });

  it('restitue le contexte de BO-002 sans propager les paramètres propres à la fiche', async () => {
    const { fixture } = await setup({
      q: 'somacop',
      statut: 'ACTIVE',
      page: '3',
      onglet: 'historique',
      hpage: '2',
    });
    const page = fixture.componentInstance as unknown as {
      listQueryParams: () => Record<string, string>;
    };

    expect(page.listQueryParams()).toEqual({
      q: 'somacop',
      statut: 'ACTIVE',
      page: '3',
    });
  });
});

describe('DemoMemberDetailGateway — cohérence du jeu de démonstration', () => {
  it('découpe l’appel annuel sans perdre ni inventer un franc', async () => {
    const detail = await firstValueFrom(new DemoMemberDetailGateway().load(MEMBER_ID));
    const expected = detail.contributions.reduce((sum, line) => sum + line.expected, 0);
    const paid = detail.contributions.reduce((sum, line) => sum + line.paid, 0);

    // La somme des périodes égale l'appel annuel : la fiche ne doit jamais afficher un
    // total que la liste des membres contredirait.
    expect(expected).toBe(detail.summary.expected);
    expect(paid).toBe(detail.summary.paid);
    expect(detail.summary.outstanding).toBe(expected - paid);
  });

  it('signale un identifiant inconnu par une erreur dédiée', async () => {
    await expect(
      firstValueFrom(new DemoMemberDetailGateway().load('MEM-INEXISTANT')),
    ).rejects.toBeInstanceOf(MemberDetailNotFoundError);
  });

  it('n’émet un reçu que pour un paiement rapproché', async () => {
    const detail = await firstValueFrom(new DemoMemberDetailGateway().load(MEMBER_ID));
    for (const payment of detail.payments) {
      expect(payment.receipt === null).toBe(payment.status !== 'MATCHED');
    }
  });
});

describe('MemberDetailPage — synthèse', () => {
  beforeEach(() => TestBed.resetTestingModule());

  async function ready() {
    const contexte = await setup();
    const detail = await firstValueFrom(new DemoMemberDetailGateway().load(MEMBER_ID));
    contexte.gateway.latest.next(detail);
    await contexte.fixture.whenStable();
    contexte.fixture.detectChanges();
    return contexte;
  }
  it('ne duplique plus les onglets dans la vue d’ensemble', async () => {
    // Historique, paiements et documents ont chacun leur onglet. Les répéter dans la
    // synthèse imposait une grille à trois colonnes de 192, 384 et 224 px, où un
    // historique devenait illisible.
    const { host } = await ready();

    expect(host.querySelector('.cnpm-member__overview-grid')).toBeNull();
  });

  it('trace le rythme de règlement et en donne l’équivalent en toutes lettres', async () => {
    const { host } = await ready();
    const graphique = host.querySelector('.cnpm-member__chart');
    const alternative = host.querySelector('.cnpm-member__chart-data');

    expect(graphique).not.toBeNull();
    // Le graphique est masqué aux lecteurs d'écran parce que la liste qui suit porte
    // exactement les mêmes chiffres : une barre n'annonce rien qu'un nombre ne dise mieux.
    expect(graphique?.getAttribute('aria-hidden')).toBe('true');
    expect(alternative).not.toBeNull();
    expect(alternative?.querySelectorAll('dt').length).toBe(
      graphique?.querySelectorAll('.cnpm-member__chart-column').length,
    );
    expect(alternative?.textContent).toContain('réglé sur');
  });

  it('distingue les deux séries autrement que par la couleur', async () => {
    const { host } = await ready();
    const legende = host.querySelector('.cnpm-member__chart-legend');

    expect(legende?.textContent).toContain('Appelé');
    expect(legende?.textContent).toContain('Réglé');
  });
});
