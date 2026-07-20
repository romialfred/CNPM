import { registerLocaleData } from '@angular/common';
import localeFrMl from '@angular/common/locales/fr-ML';
import { LOCALE_ID, provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LucideCoins } from '@lucide/angular';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type CnpmInsightTone,
  type InsightStat,
  InsightSummaryComponent,
} from './insight-summary.component';

// L'application impose le formatage `fr-ML` ; le tester sous une autre locale
// validerait un rendu que personne ne verra.
registerLocaleData(localeFrMl);

/** Chiffres seuls : le séparateur de milliers `fr-ML` est une espace insécable étroite. */
const digits = (text: string | null | undefined): string => (text ?? '').replace(/\D/g, '');

describe('InsightSummaryComponent', () => {
  let fixture: ComponentFixture<InsightSummaryComponent>;
  let host: HTMLElement;

  const monter = (
    stats: readonly InsightStat[],
    extras: { tone?: CnpmInsightTone; icon?: unknown; unit?: string; note?: string } = {},
  ): void => {
    fixture = TestBed.createComponent(InsightSummaryComponent);
    fixture.componentRef.setInput('title', 'Cotisations de l’exercice');
    fixture.componentRef.setInput('headingId', 'synthese-cotisations');
    fixture.componentRef.setInput('stats', stats);
    if (extras.tone) {
      fixture.componentRef.setInput('tone', extras.tone);
    }
    if (extras.icon) {
      fixture.componentRef.setInput('icon', extras.icon);
    }
    if (extras.unit) {
      fixture.componentRef.setInput('unit', extras.unit);
    }
    if (extras.note) {
      fixture.componentRef.setInput('note', extras.note);
    }
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightSummaryComponent],
      providers: [provideZonelessChangeDetection(), { provide: LOCALE_ID, useValue: 'fr-ML' }],
    }).compileComponents();
  });

  describe('en-tête', () => {
    it('retient la teinte neutre et n’affiche aucun pictogramme sans entrée', () => {
      // Cas des appels existants : cinq pages ne passent ni teinte ni pictogramme.
      monter([{ label: 'Attendu', value: 12 }]);

      expect(host.querySelector('.cnpm-insight__header--neutre')).not.toBeNull();
      expect(host.querySelector('.cnpm-insight__emblem')).toBeNull();
    });

    it('applique la teinte demandée et retire la précédente', () => {
      monter([{ label: 'Attendu', value: 12 }], { tone: 'indigo' });
      expect(host.querySelector('.cnpm-insight__header--indigo')).not.toBeNull();

      fixture.componentRef.setInput('tone', 'ambre');
      fixture.detectChanges();

      expect(host.querySelector('.cnpm-insight__header--ambre')).not.toBeNull();
      // Deux teintes simultanées superposeraient deux fonds.
      expect(host.querySelector('.cnpm-insight__header--indigo')).toBeNull();
    });

    it('rend le pictogramme fourni et le masque aux technologies d’assistance', () => {
      monter([{ label: 'Attendu', value: 12 }], { icon: LucideCoins });

      const emblem = host.querySelector('.cnpm-insight__emblem');
      expect(emblem).not.toBeNull();
      // Décoratif : il double le titre, l'annoncer serait du bruit.
      expect(emblem?.getAttribute('aria-hidden')).toBe('true');
      expect(emblem?.querySelector('svg')).not.toBeNull();
    });

    it('accepte aussi la donnée d’icône plutôt que son composant', () => {
      monter([{ label: 'Attendu', value: 12 }], { icon: LucideCoins.icon });

      expect(host.querySelector('.cnpm-insight__emblem svg')).not.toBeNull();
    });

    it('ignore un nom d’icône en chaîne au lieu de faire tomber le panneau', () => {
      // Sans `provideLucideIcons`, une chaîne n'est pas résoluble et lève à
      // l'exécution. Les chiffres du panneau ne doivent pas dépendre d'un ornement.
      monter([{ label: 'Attendu', value: 12 }], { icon: 'users' });

      expect(host.querySelector('.cnpm-insight__emblem')).toBeNull();
      expect(host.querySelector('.cnpm-insight__stat dd')?.textContent).toContain('12');
    });

    it('porte le titre en h2 identifié, avec son unité', () => {
      monter([{ label: 'Attendu', value: 12 }], { unit: '(FCFA)' });

      const titre = host.querySelector('h2.cnpm-insight__title');
      expect(titre?.id).toBe('synthese-cotisations');
      expect(titre?.textContent).toContain('Cotisations de l’exercice');
      expect(host.querySelector('.cnpm-insight__unit')?.textContent).toContain('(FCFA)');
      expect(host.querySelector('section')?.getAttribute('aria-labelledby')).toBe(
        'synthese-cotisations',
      );
    });
  });

  describe('mesure en nombre', () => {
    it('rend valeur, suffixe et décimales sans introduire de barre', () => {
      monter([
        { label: 'Attendu', value: 1234, suffix: ' FCFA' },
        { label: 'Taux', value: 68.4, decimals: 1, suffix: ' %' },
      ]);

      const dd = host.querySelectorAll('.cnpm-insight__stat dd');
      expect(digits(dd[0]?.textContent)).toBe('1234');
      expect(dd[0]?.textContent).toContain('FCFA');
      expect(dd[1]?.textContent).toContain('68,4');
      expect(host.querySelector('[role="progressbar"]')).toBeNull();
    });

    it('sépare par un filet la mesure marquée « apart »', () => {
      monter([
        { label: 'Actifs', value: 10 },
        { label: 'Prospects', value: 3, apart: true },
      ]);

      const stats = host.querySelectorAll('.cnpm-insight__stat');
      expect(stats[0]?.classList.contains('cnpm-insight__stat--apart')).toBe(false);
      expect(stats[1]?.classList.contains('cnpm-insight__stat--apart')).toBe(true);
    });

    it('rend un tiret et le motif d’absence quand la valeur est nulle', () => {
      monter([{ label: 'Attendu', value: null }]);

      expect(host.querySelector('.cnpm-insight__assistive')?.textContent).toContain(
        'Donnée indisponible',
      );
      expect(host.querySelector('.cnpm-insight__stat dd')?.textContent).toContain('—');
    });
  });

  describe('mesure en jauge', () => {
    const taux = (value: number | null): readonly InsightStat[] => [
      { label: 'Taux de recouvrement', value, suffix: ' %', display: 'jauge' },
    ];

    it('expose une barre de progression bornée et sa valeur', () => {
      monter(taux(68));

      const barre = host.querySelector('[role="progressbar"]');
      expect(barre).not.toBeNull();
      expect(barre?.getAttribute('aria-valuemin')).toBe('0');
      expect(barre?.getAttribute('aria-valuemax')).toBe('100');
      expect(barre?.getAttribute('aria-valuenow')).toBe('68');
      expect((barre?.querySelector('.cnpm-insight__fill') as HTMLElement).style.inlineSize).toBe(
        '68%',
      );
    });

    it('affiche la valeur en chiffres à côté de la barre', () => {
      // Une barre seule ne se lit pas : la valeur exacte n'est pas déductible.
      monter(taux(68));

      expect(host.querySelector('.cnpm-insight__figure')?.textContent).toContain('68 %');
    });

    it('tire son nom accessible du libellé de la mesure', () => {
      monter(taux(68));

      const barre = host.querySelector('[role="progressbar"]');
      const cible = barre?.getAttribute('aria-labelledby');
      expect(cible).toBe('synthese-cotisations-mesure-0');
      expect(host.querySelector(`#${cible}`)?.textContent).toContain('Taux de recouvrement');
      // Le texte annoncé doit coïncider avec le chiffre affiché.
      expect(barre?.getAttribute('aria-valuetext')).toContain('68 %');
    });

    it('borne la barre à 100 sans falsifier le chiffre affiché', () => {
      monter(taux(140));

      const barre = host.querySelector('[role="progressbar"]');
      expect(barre?.getAttribute('aria-valuenow')).toBe('100');
      expect((barre?.querySelector('.cnpm-insight__fill') as HTMLElement).style.inlineSize).toBe(
        '100%',
      );
      // Effacer le dépassement masquerait l'anomalie au lieu de la montrer.
      expect(host.querySelector('.cnpm-insight__figure')?.textContent).toContain('140');
    });

    it('borne la barre à 0 quand la source passe sous l’échelle', () => {
      monter(taux(-20));

      const barre = host.querySelector('[role="progressbar"]');
      expect(barre?.getAttribute('aria-valuenow')).toBe('0');
      expect((barre?.querySelector('.cnpm-insight__fill') as HTMLElement).style.inlineSize).toBe(
        '0%',
      );
    });

    it('n’affiche aucune barre quand la donnée est indisponible', () => {
      // Une jauge à zéro se lirait comme un taux nul ; un taux absent n'est pas nul.
      monter(taux(null));

      expect(host.querySelector('[role="progressbar"]')).toBeNull();
      expect(host.querySelector('.cnpm-insight__assistive')?.textContent).toContain(
        'Donnée indisponible',
      );
    });
  });
});
