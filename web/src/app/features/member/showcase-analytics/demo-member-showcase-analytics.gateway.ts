import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';
import type {
  MemberShowcaseAnalyticsGateway,
  ShowcaseAnalyticsQuery,
  ShowcaseAnalyticsSnapshot,
  ShowcaseDailyAggregate,
} from './member-showcase-analytics.gateway';

const PERIOD_DAYS: Readonly<Record<ShowcaseAnalyticsQuery['period'], number>> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};
const FIXED_LAST_DAY = Date.UTC(2026, 6, 18);

/** MP-017 reste une projection locale, déterministe et strictement agrégée. */
@Injectable()
export class DemoMemberShowcaseAnalyticsGateway implements MemberShowcaseAnalyticsGateway {
  load(query: ShowcaseAnalyticsQuery): Observable<ShowcaseAnalyticsSnapshot> {
    return of({
      generatedOn: '2026-07-18',
      aggregation: 'DAILY' as const,
      privacyMode: 'ANONYMOUS_AGGREGATES_ONLY' as const,
      days: buildDailyAggregates(PERIOD_DAYS[query.period]),
    }).pipe(delay(0));
  }
}

function buildDailyAggregates(dayCount: number): readonly ShowcaseDailyAggregate[] {
  return Array.from({ length: dayCount }, (_, index) => {
    const daysBeforeEnd = dayCount - index - 1;
    const date = new Date(FIXED_LAST_DAY - daysBeforeEnd * 86_400_000).toISOString().slice(0, 10);
    return {
      date,
      views: 8 + ((index * 7 + dayCount) % 17),
      // Les contacts ne sont pas exposés dans la démo : aucune interaction n'est suivie.
      contactActions: 0,
    };
  });
}
