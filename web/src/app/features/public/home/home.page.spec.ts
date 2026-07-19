import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { HOME_GATEWAY, type HomeGateway, type PublicHighlights } from './home-gateway';
import { HomePage } from './home.page';

const READY: PublicHighlights = {
  metrics: [
    { id: 'membres', label: 'Entreprises référencées', value: 4968, unit: null },
    { id: 'recouvrement', label: 'Taux de recouvrement', value: 78.47, unit: 'percent' },
  ],
  news: [
    {
      id: 'demo-news',
      category: 'Atelier',
      title: 'Prendre en main le portail membre',
      summary: 'Découvrir les cotisations, reçus et requêtes en ligne.',
      fictionalDemo: true,
    },
  ],
  sourceNotice: 'Données fictives; ne pas importer en production',
  dataAsOf: null,
};

class ControllableGateway implements HomeGateway {
  readonly calls: Subject<PublicHighlights>[] = [];

  loadHighlights(): Subject<PublicHighlights> {
    const result = new Subject<PublicHighlights>();
    this.calls.push(result);
    return result;
  }

  get latest(): Subject<PublicHighlights> {
    return this.calls[this.calls.length - 1];
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [HomePage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: '', children: [] },
        { path: 'auth/login', children: [] },
      ]),
      { provide: HOME_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('HomePage (PUB-001)', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche un hero complet et un squelette structurel pendant le chargement', async () => {
    const { host } = await setup();
    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain('La plateforme digitale');
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.textContent).toContain('Chargement');
  });

  it('rend les chiffres en signalant qu’ils ne sont pas les statistiques officielles', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('.cnpm-home__metric')).toHaveLength(2);
    expect(host.textContent).toContain('Chiffres illustratifs');
    expect(host.textContent).toContain('ne constituent pas les statistiques officielles du CNPM');
  });

  it('rend les actualités illustratives sans leur inventer de destination', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY);
    await fixture.whenStable();
    fixture.detectChanges();

    const news = host.querySelector('#actualites')!;
    expect(news.textContent).toContain('Contenus illustratifs');
    expect(news.textContent).toContain('Exemple de publication — aucune destination associée');
    expect(news.querySelectorAll('a')).toHaveLength(0);
  });

  it('distingue la source vide d’une panne récupérable', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next({ ...READY, metrics: [], news: [] });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Aucun chiffre publié');

    gateway.latest.error(new Error('indisponible'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Les chiffres clés sont indisponibles');
    expect(host.textContent).toContain('Réessayer');
  });

  it('relance le gateway sans recharger la page', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.error(new Error('indisponible'));
    await fixture.whenStable();
    fixture.detectChanges();

    const retry = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Réessayer'),
    )!;
    retry.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.calls).toHaveLength(2);
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
  });

  it('expose PUB-012 comme parcours distinct de la connexion', async () => {
    const { host } = await setup();
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href]'));
    expect(links.some((link) => link.getAttribute('href') === '/adhesion')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/auth/login')).toBe(true);
    expect(host.textContent).toContain('Préparer une adhésion');
  });
});
