import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

export type ShowcaseAnalyticsPeriod = '7d' | '30d' | '90d';

/** Agrégat journalier sans IP, cookie, contact ni identifiant de visiteur. */
export interface ShowcaseDailyAggregate {
  readonly date: string;
  readonly views: number;
  readonly contactActions: number;
}

export interface ShowcaseAnalyticsSnapshot {
  readonly generatedOn: string;
  readonly aggregation: 'DAILY';
  readonly privacyMode: 'ANONYMOUS_AGGREGATES_ONLY';
  readonly days: readonly ShowcaseDailyAggregate[];
}

export interface ShowcaseAnalyticsQuery {
  readonly period: ShowcaseAnalyticsPeriod;
}

export interface MemberShowcaseAnalyticsGateway {
  load(query: ShowcaseAnalyticsQuery): Observable<ShowcaseAnalyticsSnapshot | null>;
}

export const MEMBER_SHOWCASE_ANALYTICS_GATEWAY = new InjectionToken<MemberShowcaseAnalyticsGateway>(
  'MEMBER_SHOWCASE_ANALYTICS_GATEWAY',
);
