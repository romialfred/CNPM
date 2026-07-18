import { Injectable } from '@angular/core';
import { delay, Observable, of } from 'rxjs';
import fixtures from '../../../../assets/demo-fixtures.json';
import type { HomeGateway, PublicHighlights } from './home-gateway';

/**
 * Adaptateur de démonstration de l'accueil public, alimenté par les fixtures.
 *
 * NON destiné à la production. Les chiffres proviennent exclusivement de
 * `docs/ui-handoff/data/demo-fixtures.json` (copie déclarée), qui porte la mention
 * « Donnees fictives; ne pas importer en production ».
 */
@Injectable()
export class DemoHomeGateway implements HomeGateway {
  private static readonly LATENCY_MS = 250;

  loadHighlights(): Observable<PublicHighlights> {
    const kpis = fixtures.kpis;
    const highlights: PublicHighlights = {
      metrics: [
        { id: 'membres', label: 'Entreprises référencées', value: kpis.membersTotal, unit: null },
        { id: 'actifs', label: 'Membres actifs', value: kpis.activeMembers, unit: null },
        {
          id: 'cotisations',
          label: 'Cotisations encaissées',
          value: kpis.collectedContributions,
          unit: 'currency',
        },
        {
          id: 'recouvrement',
          label: 'Taux de recouvrement',
          value: kpis.recoveryRate,
          unit: 'percent',
        },
        { id: 'recus', label: 'Reçus émis', value: kpis.receiptsIssued, unit: null },
      ],
      news: [
        {
          id: 'prise-en-main',
          category: 'Atelier fictif',
          title: 'Prendre en main le portail membre',
          summary:
            'Un scénario de démonstration pour découvrir les cotisations, reçus et requêtes en ligne.',
          fictionalDemo: true,
        },
        {
          id: 'services-numeriques',
          category: 'Repère fictif',
          title: 'Retrouver ses services numériques',
          summary:
            'Un aperçu éditorial fictif des démarches réunies dans l’espace sécurisé du membre.',
          fictionalDemo: true,
        },
        {
          id: 'reseau',
          category: 'Rencontre fictive',
          title: 'Faire vivre le réseau des entreprises',
          summary:
            'Un contenu de maquette, sans annonce d’événement réel ni engagement institutionnel.',
          fictionalDemo: true,
        },
      ],
      sourceNotice: fixtures.meta.warning,
      // La fixture ne porte pas de date de constat des indicateurs. La fiche exige
      // d'afficher la date de mise à jour : à défaut, on ne l'affiche pas plutôt que
      // d'annoncer une fraîcheur invérifiable. `meta.period` désigne un exercice, pas
      // une date de calcul.
      dataAsOf: null,
    };
    return of(highlights).pipe(delay(DemoHomeGateway.LATENCY_MS));
  }
}
