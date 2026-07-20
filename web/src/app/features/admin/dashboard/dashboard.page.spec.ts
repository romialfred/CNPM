import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom, Subject, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  DASHBOARD_GATEWAY,
  DashboardAccessError,
  type DashboardGateway,
  type DashboardSnapshot,
} from './dashboard-gateway';
import { DashboardPage } from './dashboard.page';
import { DemoDashboardGateway } from './demo-dashboard.gateway';

/**
 * BO-001 — refonte du tableau de bord.
 *
 * Deux campagnes, comme sur BO-011 :
 *
 * - les invariants du jeu de données, éprouvés sur l'adaptateur de démonstration ;
 * - les états et le rendu de l'écran, pilotés par un port contrôlable, car le délai
 *   de l'adaptateur ne peut produire ni l'erreur récupérable ni le refus d'accès.
 *
 * Les assertions de géométrie portent sur des valeurs EXACTES et non sur des bornes :
 * une courbe dont l'échelle serait renormalisée, ou dont l'ordonnée cesserait d'être
 * le taux publié, doit faire tomber le test. Un « entre 0 et 100 » passerait sur
 * n'importe quelle invention.
 */

/** Port dont chaque appel expose un flux que le test résout ou fait échouer à la demande. */
class ControllableGateway implements DashboardGateway {
  readonly exercises: readonly string[] = ['2024', '2023'];
  readonly calls: Subject<DashboardSnapshot>[] = [];

  load(): Observable<DashboardSnapshot> {
    const subject = new Subject<DashboardSnapshot>();
    this.calls.push(subject);
    return subject;
  }

  get latest(): Subject<DashboardSnapshot> {
    return this.calls[this.calls.length - 1];
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [DashboardPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: DASHBOARD_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DashboardPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

async function ready() {
  const context = await setup();
  const snapshot = await firstValueFrom(new DemoDashboardGateway().load('2024'));
  context.gateway.latest.next(snapshot);
  await context.fixture.whenStable();
  context.fixture.detectChanges();
  return { ...context, snapshot };
}

/** Valeur d'une propriété de style posée en ligne par Angular. */
function style(node: Element | null, property: string): string {
  return (node as HTMLElement | null)?.style.getPropertyValue(property) ?? '';
}

describe('DashboardPage — demande du commanditaire', () => {
  beforeEach(() => TestBed.resetTestingModule());

  /**
   * ÉCART ASSUMÉ avec `ref-bo-001-dashboard.md`, qui exige `ActivityFeed` (ligne 27) et
   * « activité/alertes 4 colonnes » (ligne 16). Le commanditaire a demandé le retrait ;
   * la demande est appliquée et la divergence reste à arbitrer, pas à masquer. Ce test
   * verrouille la décision prise, il ne la justifie pas.
   */
  it('ne rend plus la section « Activité récente » ni le panneau de raccourcis', async () => {
    const { host, snapshot } = await ready();

    // La donnée existe toujours au contrat : c'est bien le rendu qui a été retiré.
    expect(snapshot.activities.length).toBeGreaterThan(0);

    const text = host.textContent ?? '';
    expect(text).not.toContain('Activité récente');
    expect(text).not.toContain('Raccourcis');
    expect(host.querySelector('#titre-activite')).toBeNull();
    expect(host.querySelector('#titre-raccourcis')).toBeNull();
    // Le détail des entrées d'activité ne doit plus apparaître nulle part. C'est lui
    // qui est éprouvé, et non le libellé : celui-ci est une raison sociale, qui figure
    // aussi — légitimement — dans la colonne « Membre payeur » des paiements.
    expect(text).not.toContain('Dernière activité sur le dossier');
    expect(snapshot.activities[0].detail).toContain('Dernière activité sur le dossier');
  });

  it('conserve les alertes, la table des paiements et le graphique principal', async () => {
    const { host } = await ready();

    expect(host.querySelector('#titre-alertes')).not.toBeNull();
    expect(host.querySelector('#titre-paiements')).not.toBeNull();
    expect(host.querySelector('#titre-graphique')).not.toBeNull();
    expect(host.querySelector('#titre-segmentation')).not.toBeNull();
  });
});

describe('DashboardPage — graphiques ajoutés', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('trace la courbe du taux sur l’échelle 0–100 %, sans renormaliser la série', async () => {
    const { host, snapshot } = await ready();

    const points = Array.from(host.querySelectorAll('.cnpm-dashboard__rate-point'));
    expect(points).toHaveLength(snapshot.months.length);

    snapshot.months.forEach((month, index) => {
      // L'ordonnée EST le taux publié : aucune échelle déduite de la série, donc aucun
      // graphique flatteur obtenu en ramenant le minimum à zéro.
      expect(style(points[index], 'bottom')).toBe(`${month.rate}%`);
      // Abscisse au centre d'une bande égale, pour tomber sous le libellé du mois.
      const x = ((index + 0.5) / snapshot.months.length) * 100;
      expect(style(points[index], 'left')).toBe(`${x}%`);
    });

    const line = host.querySelector('.cnpm-dashboard__rate-line');
    const first = snapshot.months[0];
    const firstX = (0.5 / snapshot.months.length) * 100;
    expect(line?.getAttribute('d')).toMatch(
      new RegExp(`^M${firstX.toFixed(2)},${(100 - first.rate).toFixed(2)} L`),
    );

    // L'aplat referme le même tracé sur la base de la boîte, sans point supplémentaire.
    expect(host.querySelector('.cnpm-dashboard__rate-area')?.getAttribute('d')).toMatch(/ Z$/);
  });

  it('expose une table accessible pour la courbe, avec les taux réels', async () => {
    const { host, snapshot } = await ready();

    const captions = Array.from(host.querySelectorAll('caption')).map((node) => node.textContent);
    expect(captions.some((text) => text?.includes('Taux de recouvrement mensuel'))).toBe(true);

    // Chaque mois de la série figure en toutes lettres avec son taux. Le séparateur
    // décimal est laissé libre : il dépend du `LOCALE_ID`, pas de la donnée.
    const text = host.textContent ?? '';
    for (const month of snapshot.months) {
      expect(text).toContain(month.label);
      const [whole, fraction] = month.rate.toFixed(1).split('.');
      expect(text).toMatch(new RegExp(`${whole}[.,]${fraction}\\s*%`));
    }
  });

  it('compose la barre des cotisations sur les montants publiés, pas sur un recalcul', async () => {
    const { host, snapshot } = await ready();

    const expected = snapshot.contributions.expected ?? 0;
    const collected = snapshot.contributions.collected ?? 0;
    const outstanding = snapshot.contributions.outstanding ?? 0;

    const parts = host.querySelectorAll('.cnpm-dashboard__composition-part');
    expect(parts).toHaveLength(2);
    expect(style(parts[0], 'inline-size')).toBe(`${(collected / expected) * 100}%`);
    expect(style(parts[1], 'inline-size')).toBe(`${(outstanding / expected) * 100}%`);

    // Seul le taux PUBLIÉ est écrit ; aucun pourcentage recalculé à l'écran. Le
    // rapport encaissé/attendu vaut 78,4665 % : arrondi à une décimale il donnerait
    // 78,5 comme la source, mais rien ne garantit cette coïncidence sur d'autres
    // données — c'est bien `recoveryRate` qui doit être affiché.
    const [whole, fraction] = (snapshot.contributions.recoveryRate ?? 0).toFixed(1).split('.');
    expect(host.textContent).toMatch(new RegExp(`${whole}[.,]${fraction}\\s*%`));
  });

  it('sépare les arcs du donut par un vide de piste, teinte vert/bleu insuffisante bord à bord', async () => {
    const { host, snapshot } = await ready();

    // Circonférence du donut : r = 52 dans le viewBox 120. Le vide (DONUT_GAP = 4) est
    // retranché à chaque arc pour révéler la piste et distinguer les cohortes, dont le
    // seul contraste de teinte (vert « à jour » / bleu « dormant ») ne dépasse pas ~1,2:1.
    const circumference = 2 * Math.PI * 52;
    const base = snapshot.segments.filter((segment) => segment.scope === 'base');
    const total = base.reduce((sum, segment) => sum + segment.count, 0);

    const arcs = Array.from(host.querySelectorAll('.cnpm-dashboard__donut-arc'));
    expect(arcs).toHaveLength(base.length);

    base.forEach((segment, index) => {
      const full = (segment.count / total) * circumference;
      const visible = Number(arcs[index].getAttribute('stroke-dasharray')?.split(' ')[0]);
      // L'arc visible vaut la part pleine moins le vide fixe : les cohortes ne se touchent
      // plus, chacune se lisant contre la piste et non contre sa voisine.
      expect(visible).toBeCloseTo(full - 4, 6);
      expect(visible).toBeLessThan(full);
    });
  });

  it('n’affiche aucune barre de composition quand l’attendu est indisponible', async () => {
    const { fixture, gateway, host } = await setup();
    const empty = await firstValueFrom(new DemoDashboardGateway().load('2023'));
    gateway.latest.next(empty);
    await fixture.whenStable();
    fixture.detectChanges();

    // Une barre remplie de zéros ferait passer une mesure manquante pour un résultat.
    expect(host.querySelector('.cnpm-dashboard__composition')).toBeNull();
    expect(host.querySelector('.cnpm-dashboard__rate-point')).toBeNull();
    expect(host.textContent).toContain('Donnée indisponible');
    expect(host.textContent).toContain('Aucun taux mensuel');
  });

  it('ne porte aucune courbe de tendance sur les KPI sans série historique', async () => {
    const { host, snapshot } = await ready();

    const tiles = Array.from(host.querySelectorAll('.cnpm-dashboard__kpi-card'));
    expect(tiles).toHaveLength(snapshot.kpis.length);

    // Seuls le montant encaissé et le taux de recouvrement possèdent une série
    // mensuelle au contrat ; les effectifs n'en ont aucune et n'en inventent pas.
    const withSeries = snapshot.kpis.filter((kpi) => kpi.key === 'collected' || kpi.key === 'recovery');
    expect(host.querySelectorAll('.cnpm-dashboard__kpi-spark')).toHaveLength(withSeries.length);
  });

  it('donne à chaque tuile KPI un accent distinct, purement décoratif', async () => {
    const { host } = await ready();

    const accents = Array.from(host.querySelectorAll('.cnpm-dashboard__kpi-card')).map((tile) =>
      Array.from(tile.classList).find((name) => name.startsWith('cnpm-tile-accent--')),
    );
    expect(accents.every((accent) => accent !== undefined)).toBe(true);
    expect(new Set(accents).size).toBe(accents.length);

    // Le sens reste porté par le libellé : la pastille et le liseré sont masqués aux
    // technologies d'assistance, aucune information ne tient à la seule couleur.
    for (const icon of Array.from(host.querySelectorAll('.cnpm-dashboard__kpi-icon'))) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
  });
});

describe('DashboardPage — états requis', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche l’ossature pendant le premier chargement, jamais une page blanche', async () => {
    const { host } = await setup();
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.querySelector('.cnpm-skeleton__status')?.textContent).toContain('Chargement');
  });

  it('affiche une erreur récupérable AVEC une action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new Error('panne réseau'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--recoverable')).not.toBeNull();
    const retry = Array.from(host.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Réessayer'),
    );
    expect(retry).toBeDefined();
  });

  it('affiche l’état « accès refusé » sur un 403, SANS action « Réessayer »', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new DashboardAccessError());
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    const retry = Array.from(host.querySelectorAll('button')).find((button) =>
      (button.textContent ?? '').includes('Réessayer'),
    );
    expect(retry).toBeUndefined();
  });

  it('conserve la dernière donnée lisible après une panne d’actualisation', async () => {
    const { fixture, gateway, host } = await ready();
    // Une seconde requête échoue : les chiffres déjà affichés doivent survivre.
    fixture.componentInstance['retryTick'].update((tick: number) => tick + 1);
    await fixture.whenStable();
    gateway.latest.error(new Error('panne réseau'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Actualisation impossible');
    expect(host.querySelector('#titre-graphique')).not.toBeNull();
    expect(host.querySelector('.cnpm-dashboard__rate-point')).not.toBeNull();
  });
});
