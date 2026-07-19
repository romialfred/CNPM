import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type ContributionGenerationPeriod = 'T1' | 'T2' | 'T3' | 'T4';
export type ContributionAudience = 'ALL_ACTIVE' | 'NEW_MEMBERS' | 'LARGE_CONTRIBUTORS';
export type ContributionSimulationSeverity = 'BLOCKING' | 'WARNING' | 'INFORMATION';

export interface ContributionGenerationContext {
  readonly fiscalYears: readonly string[];
  readonly periods: readonly ContributionGenerationPeriod[];
  readonly audiences: readonly ContributionAudience[];
  /** Date d'arrêté déterministe du jeu de démonstration. */
  readonly asOf: string;
  /** `false` tant que DEC-008 ne fournit aucun barème CNPM opposable. */
  readonly officialScaleAvailable: false;
}

export interface ContributionGenerationRequest {
  readonly fiscalYear: string;
  readonly period: ContributionGenerationPeriod;
  readonly audience: ContributionAudience;
}

export interface ContributionSimulationIssue {
  readonly id: string;
  readonly memberCode: string;
  readonly organizationName: string;
  readonly severity: ContributionSimulationSeverity;
  readonly reason: string;
  readonly treatment: string;
}

export interface ContributionGenerationSimulation {
  readonly scenarioReference: string;
  readonly fiscalYear: string;
  readonly period: ContributionGenerationPeriod;
  readonly audience: ContributionAudience;
  readonly eligibleMembers: number;
  readonly draftCalls: number;
  readonly excludedMembers: number;
  readonly blockingIssues: number;
  /** Montant purement fictif, explicitement non opposable dans l'interface. */
  readonly illustrativeTotal: number;
  readonly issues: readonly ContributionSimulationIssue[];
}

/** Port de BO-012. Aucune méthode d'émission ou de publication n'est exposée. */
export interface ContributionCallGenerationGateway {
  loadContext(): Observable<ContributionGenerationContext>;
  simulate(
    request: ContributionGenerationRequest,
  ): Observable<ContributionGenerationSimulation>;
}

export const CONTRIBUTION_CALL_GENERATION_GATEWAY =
  new InjectionToken<ContributionCallGenerationGateway>('CONTRIBUTION_CALL_GENERATION_GATEWAY');

