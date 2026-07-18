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
      category: 'Atelier fictif',
      title: 'Actualité de démonstration',
      summary: 'Cette publication n’annonce aucun événement réel.',
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

  it('rend les chiffres et signale sans ambiguïté leur provenance fictive', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('.cnpm-home__metric')).toHaveLength(2);
    expect(host.textContent).toContain('Données fictives de démonstration');
    expect(host.textContent).toContain("Aucune date d'arrêté officielle n'est publiée");
  });

  it('rend les actualités fictives sans leur inventer de destination', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY);
    await fixture.whenStable();
    fixture.detectChanges();

    const news = host.querySelector('#actualites')!;
    expect(news.textContent).toContain('Contenus fictifs de démonstration');
    expect(news.textContent).toContain('Publication fictive — aucune destination associée');
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
    expect(host.textContent).toContain('Les chiffres de démonstration sont indisponibles');
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

  it('n’expose aucun lien d’adhésion tant que PUB-012 n’existe pas', async () => {
    const { host } = await setup();
    const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a[href]'));
    expect(links.some((link) => /adhésion/i.test(link.textContent ?? ''))).toBe(false);
    expect(links.some((link) => link.getAttribute('href') === '/auth/login')).toBe(true);
  });
});
