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
        { id: 'membres', label: 'Entreprises membres', value: kpis.membersTotal, unit: null },
        { id: 'actifs', label: 'Membres actifs', value: kpis.activeMembers, unit: null },
        { id: 'recouvrement', label: 'Taux de recouvrement', value: kpis.recoveryRate, unit: 'percent' },
        { id: 'retention', label: 'Taux de rétention', value: kpis.retentionRate, unit: 'percent' },
      ],
      // La fixture ne porte pas de date de constat des indicateurs. La fiche exige
      // d'afficher la date de mise à jour : à défaut, on ne l'affiche pas plutôt que
      // d'annoncer une fraîcheur invérifiable. `meta.period` désigne un exercice, pas
      // une date de calcul.
      dataAsOf: null,
    };
    return of(highlights).pipe(delay(DemoHomeGateway.LATENCY_MS));
  }
}
