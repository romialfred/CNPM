import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiProblemInterceptor } from '../../../core/api/api-problem.interceptor';
import { provideCnpmApi } from '../../../core/api/api.config';
import { DashboardAccessError } from './dashboard-gateway';
import { HttpDashboardGateway } from './http-dashboard.gateway';

describe('HttpDashboardGateway', () => {
  let gateway: HttpDashboardGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(withInterceptors([apiProblemInterceptor])),
        provideHttpClientTesting(),
        HttpDashboardGateway,
      ],
    });
    gateway = TestBed.inject(HttpDashboardGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('lit GET /dashboards/{exercise} et projette l’instantané', async () => {
    const promise = firstValueFrom(gateway.load('2026'));
    const request = http.expectOne('/v1/dashboards/2026');
    expect(request.request.method).toBe('GET');

    request.flush({
      exercise: '2026',
      generatedAt: '2026-07-21T00:00:00Z',
      kpis: [{ key: 'active', label: 'Membres actifs', value: 0, definition: 'x' }],
      months: [],
      trend: null,
      segments: [{ key: 'active', label: 'Actifs', count: 0, share: null, scope: 'base' }],
      memberBase: 0,
      contributions: { expected: null, collected: null, outstanding: null, recoveryRate: null },
      payments: [],
      alerts: [],
      activities: [],
    });

    const snapshot = await promise;
    expect(snapshot.exercise).toBe('2026');
    expect(snapshot.memberBase).toBe(0);
    expect(snapshot.kpis).toHaveLength(1);
    expect(snapshot.contributions.recoveryRate).toBeNull();
  });

  it('complète les sections absentes par des listes vides et des contributions nulles', async () => {
    const promise = firstValueFrom(gateway.load('2025'));
    http.expectOne('/v1/dashboards/2025').flush({
      exercise: '2025',
      generatedAt: '2026-07-21T00:00:00Z',
    });

    const snapshot = await promise;
    expect(snapshot.kpis).toEqual([]);
    expect(snapshot.payments).toEqual([]);
    expect(snapshot.trend).toBeNull();
    expect(snapshot.contributions).toEqual({
      expected: null,
      collected: null,
      outstanding: null,
      recoveryRate: null,
    });
  });

  it('traduit un refus d’habilitation (403) en DashboardAccessError', async () => {
    const promise = firstValueFrom(gateway.load('2026'));
    http.expectOne('/v1/dashboards/2026').flush(
      { code: 'FORBIDDEN', message: 'Accès refusé' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(promise).rejects.toBeInstanceOf(DashboardAccessError);
  });

  it('propose l’exercice courant et le précédent au sélecteur', () => {
    const year = new Date().getFullYear();
    expect(gateway.exercises).toEqual([String(year), String(year - 1)]);
  });
});
