import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { DemoReportingGateway } from './demo-reporting.gateway';
import type { ReportQuery } from './reporting-gateway';

const DEFAULT_QUERY: ReportQuery = {
  reportId: 'recouvrement-mensuel',
  exercise: '2024',
  period: 'annee',
  search: '',
  sort: null,
};

describe('DemoReportingGateway — composition BO-028', () => {
  it('maintient les agrégats financiers alignés sur les lignes du rapport', async () => {
    const report = await firstValueFrom(new DemoReportingGateway().load(DEFAULT_QUERY));
    const expected = report.rows.reduce((sum, row) => sum + row.expected, 0);
    const collected = report.rows.reduce((sum, row) => sum + row.collected, 0);

    expect(report.totals).not.toBeNull();
    expect(report.totals?.expected).toBe(expected);
    expect(report.totals?.collected).toBe(collected);
    expect(report.totals?.outstanding).toBe(expected - collected);
  });

  it('explique chaque recommandation automatique et expose la méthode du KPI', async () => {
    const report = await firstValueFrom(new DemoReportingGateway().load(DEFAULT_QUERY));

    expect(report.descriptor.definition.length).toBeGreaterThan(20);
    expect(report.descriptor.source.length).toBeGreaterThan(20);
    expect(report.updatedAt.length).toBeGreaterThan(0);
    for (const insight of report.insights) {
      expect(insight.rationale.length).toBeGreaterThan(10);
    }
  });
});
