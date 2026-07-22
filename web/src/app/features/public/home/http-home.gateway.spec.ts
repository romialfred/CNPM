import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideCnpmApi } from '../../../core/api/api.config';
import { HttpHomeGateway } from './http-home.gateway';

describe('HttpHomeGateway', () => {
  let gateway: HttpHomeGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCnpmApi(),
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpHomeGateway,
      ],
    });
    gateway = TestBed.inject(HttpHomeGateway);
    http = TestBed.inject(HttpTestingController);
  });

  it('lit GET /public/highlights et projette les chiffres clés', async () => {
    const promise = firstValueFrom(gateway.loadHighlights());
    const request = http.expectOne('/v1/public/highlights');
    expect(request.request.method).toBe('GET');

    request.flush({
      metrics: [
        { id: 'members', label: 'Entreprises membres', value: 0, unit: null },
        { id: 'active-members', label: 'Membres actifs', value: 0, unit: null },
      ],
      news: [],
      sourceNotice: 'Chiffres établis à partir du registre des membres du CNPM.',
      dataAsOf: '2026-07-22T00:00:00Z',
    });

    const highlights = await promise;
    expect(highlights.metrics).toHaveLength(2);
    expect(highlights.metrics[0]).toEqual({
      id: 'members',
      label: 'Entreprises membres',
      value: 0,
      unit: null,
    });
    expect(highlights.sourceNotice).toContain('registre des membres');
    expect(highlights.dataAsOf).toBe('2026-07-22T00:00:00Z');
  });

  it('n’expose jamais d’éditorial : news reste vide même si le serveur en renvoyait', async () => {
    const promise = firstValueFrom(gateway.loadHighlights());
    http.expectOne('/v1/public/highlights').flush({
      metrics: [],
      news: [{ id: 'x', title: 'ne doit pas passer' }],
      sourceNotice: 'source',
      dataAsOf: null,
    });

    const highlights = await promise;
    expect(highlights.news).toEqual([]);
    expect(highlights.dataAsOf).toBeNull();
  });
});
