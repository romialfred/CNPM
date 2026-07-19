import { Injectable } from '@angular/core';
import { delay, type Observable, of } from 'rxjs';
import type {
  ContributionAudience,
  ContributionCallGenerationGateway,
  ContributionGenerationContext,
  ContributionGenerationRequest,
  ContributionGenerationSimulation,
} from './contribution-call-generation-gateway';

const CONTEXT: ContributionGenerationContext = {
  fiscalYears: ['2024'],
  periods: ['T1', 'T2', 'T3', 'T4'],
  audiences: ['ALL_ACTIVE', 'NEW_MEMBERS', 'LARGE_CONTRIBUTORS'],
  asOf: '2024-06-30',
  officialScaleAvailable: false,
};

const AUDIENCE_COUNTS: Readonly<
  Record<ContributionAudience, { eligible: number; excluded: number; total: number }>
> = {
  ALL_ACTIVE: { eligible: 1248, excluded: 24, total: 748_650_000 },
  NEW_MEMBERS: { eligible: 86, excluded: 7, total: 48_900_000 },
  LARGE_CONTRIBUTORS: { eligible: 42, excluded: 2, total: 312_500_000 },
};

/**
 * Calculateur local du scénario BO-012.
 *
 * Les valeurs ne représentent aucun barème CNPM : elles permettent uniquement de
 * valider la composition, les contrôles et la revue des exceptions tant que DEC-008
 * reste ouverte. Le port ne propose volontairement aucune émission.
 */
@Injectable()
export class DemoContributionCallGenerationGateway implements ContributionCallGenerationGateway {
  loadContext(): Observable<ContributionGenerationContext> {
    return of(CONTEXT).pipe(delay(80));
  }

  simulate(request: ContributionGenerationRequest): Observable<ContributionGenerationSimulation> {
    const counts = AUDIENCE_COUNTS[request.audience];
    const suffix = `${request.fiscalYear}-${request.period}-${request.audience}`;
    // Typage contextuel explicite : sans lui, les unions littérales (sévérité, période)
    // sont élargies en `string` et ne satisfont plus le contrat du port.
    return of<ContributionGenerationSimulation>({
      scenarioReference: `SIM-GEN-${suffix}`,
      fiscalYear: request.fiscalYear,
      period: request.period,
      audience: request.audience,
      eligibleMembers: counts.eligible,
      draftCalls: counts.eligible - 3,
      excludedMembers: counts.excluded,
      blockingIssues: 3,
      illustrativeTotal: counts.total,
      issues: [
        {
          id: 'issue-001',
          memberCode: 'CNPM-2026-0142',
          organizationName: 'Atelier Horizon SARL',
          severity: 'BLOCKING',
          reason: 'Catégorie de cotisation absente',
          treatment: 'Compléter le dossier avant toute génération.',
        },
        {
          id: 'issue-002',
          memberCode: 'CNPM-2026-0381',
          organizationName: 'Kora Numérique SA',
          severity: 'BLOCKING',
          reason: 'Période d’adhésion non qualifiée',
          treatment: 'Faire valider la date d’effet par le gestionnaire.',
        },
        {
          id: 'issue-003',
          memberCode: 'CNPM-2026-0917',
          organizationName: 'Nimba Services SAS',
          severity: 'BLOCKING',
          reason: 'Aucun barème homologué applicable',
          treatment: 'Attendre la clôture de DEC-008.',
        },
        {
          id: 'issue-004',
          memberCode: 'CNPM-2026-0724',
          organizationName: 'Djoliba Emballages SARL',
          severity: 'WARNING',
          reason: 'Changement de catégorie en attente de revue',
          treatment: 'Vérifier le dossier avant la future validation à quatre yeux.',
        },
      ],
    }).pipe(delay(140));
  }
}

