import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  AUDIT_GATEWAY,
  AuditAccessError,
  AuditAuthenticationError,
  type AuditEvent,
  type AuditEventPage,
  type AuditEventQuery,
  type AuditGateway,
} from './audit-gateway';
import { AuditPage } from './audit.page';

const EVENT: AuditEvent = {
  id: '00000000-0000-4000-8000-000000000001',
  createdAt: '2026-07-19T09:42:00Z',
  actorUserId: '10000000-0000-4000-8000-000000000001',
  actorType: 'USER',
  actionCode: 'AUDIT_VIEWED',
  entityType: 'AUDIT_LOG',
  entityId: '30000000-0000-4000-8000-000000000001',
  beforeHash: 'a'.repeat(64),
  afterHash: 'b'.repeat(64),
  correlationId: '20000000-0000-4000-8000-000000000001',
};

const READY_PAGE: AuditEventPage = {
  items: [EVENT],
  page: 1,
  size: 10,
  totalElements: 35,
  totalPages: 4,
};

class ActivatedRouteStub {
  private readonly subject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  readonly queryParamMap;
  readonly snapshot;

  constructor(params: Record<string, string>) {
    this.subject = new BehaviorSubject(convertToParamMap(params));
    this.queryParamMap = this.subject.asObservable();
    this.snapshot = { queryParamMap: this.subject.value };
  }
}

class ControllableAuditGateway implements AuditGateway {
  readonly calls: {
    readonly query: AuditEventQuery;
    readonly response: Subject<AuditEventPage>;
  }[] = [];

  search(query: AuditEventQuery): Subject<AuditEventPage> {
    const response = new Subject<AuditEventPage>();
    this.calls.push({ query, response });
    return response;
  }

  get latest(): Subject<AuditEventPage> {
    return this.calls[this.calls.length - 1].response;
  }
}

async function setup(params: Record<string, string> = { page: '2', size: '10' }) {
  const gateway = new ControllableAuditGateway();
  const route = new ActivatedRouteStub(params);
  await TestBed.configureTestingModule({
    imports: [AuditPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: route },
      { provide: AUDIT_GATEWAY, useValue: gateway },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(AuditPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return {
    fixture,
    gateway,
    navigate,
    host: fixture.nativeElement as HTMLElement,
  };
}

function findButton(host: HTMLElement, label: string): HTMLButtonElement | undefined {
  return Array.from(host.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(label),
  );
}

describe('AuditPage — BO-032', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit page/size dans l’URL et affiche un chargement annoncé', async () => {
    const { gateway, host } = await setup();

    expect(gateway.calls[0].query).toEqual({ page: 2, size: 10 });
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();
    expect(host.textContent).toContain('Chargement des journaux d’audit');
  });

  it('rend tous les champs contractuels et une fiche sémantique dédiée au reflow 320/360', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.querySelector('table caption')?.textContent).toContain(
      'du plus récent au plus ancien',
    );
    expect(host.querySelector(`time[datetime="${EVENT.createdAt}"]`)).not.toBeNull();
    expect(host.textContent).toContain(EVENT.id);
    expect(host.textContent).toContain(EVENT.actorUserId);
    expect(host.textContent).toContain(EVENT.actionCode);
    expect(host.textContent).toContain(EVENT.entityType);
    expect(host.textContent).toContain(EVENT.entityId);
    expect(host.textContent).toContain(EVENT.beforeHash);
    expect(host.textContent).toContain(EVENT.afterHash);
    expect(host.textContent).toContain(EVENT.correlationId);
    expect(host.querySelector('.cnpm-audit__mobile-list article dl')).not.toBeNull();
    expect(host.querySelector('.cnpm-audit__panel input')).toBeNull();
    expect(findButton(host, 'Exporter')).toBeUndefined();
  });

  it('met à jour les paramètres URL à la pagination et remet la page à 1 si size change', async () => {
    const { fixture, gateway, host, navigate } = await setup();
    gateway.latest.next(READY_PAGE);
    await fixture.whenStable();
    fixture.detectChanges();

    const next = host.querySelector<HTMLButtonElement>('button[aria-label="Page suivante"]');
    expect(next).not.toBeNull();
    next?.click();
    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { page: 3 },
      queryParamsHandling: 'merge',
    });

    const size = host.querySelector<HTMLSelectElement>('#taille-page');
    expect(size).not.toBeNull();
    if (size) {
      size.value = '25';
      size.dispatchEvent(new Event('change'));
    }
    expect(navigate).toHaveBeenLastCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { page: 1, size: 25 },
      queryParamsHandling: 'merge',
    });
  });

  it('distingue collection vide, erreur récupérable, session expirée et refus 403', async () => {
    const empty = await setup({ page: '1', size: '25' });
    empty.gateway.latest.next({
      items: [],
      page: 0,
      size: 25,
      totalElements: 0,
      totalPages: 0,
    });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun événement d’audit');

    empty.gateway.latest.next({
      items: [],
      page: 3,
      size: 25,
      totalElements: 80,
      totalPages: 4,
    });
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun événement sur cette page');
    expect(
      empty.host.querySelector<HTMLButtonElement>('button[aria-label="Page précédente"]'),
    ).not.toBeNull();

    TestBed.resetTestingModule();
    const failed = await setup({ page: '1', size: '25' });
    failed.gateway.latest.error(new Error('service indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    const retry = findButton(failed.host, 'Réessayer');
    expect(retry).toBeDefined();
    const callsBeforeRetry = failed.gateway.calls.length;
    retry?.click();
    await failed.fixture.whenStable();
    expect(failed.gateway.calls).toHaveLength(callsBeforeRetry + 1);

    TestBed.resetTestingModule();
    const expired = await setup({ page: '1', size: '25' });
    expired.gateway.latest.error(new AuditAuthenticationError());
    await expired.fixture.whenStable();
    expired.fixture.detectChanges();
    expect(expired.host.querySelector('.cnpm-error--session-ended')).not.toBeNull();
    expect(expired.host.querySelector('a[href="/auth/login"]')?.textContent).toContain(
      'Se reconnecter',
    );

    TestBed.resetTestingModule();
    const forbidden = await setup({ page: '1', size: '25' });
    forbidden.gateway.latest.error(new AuditAccessError());
    await forbidden.fixture.whenStable();
    forbidden.fixture.detectChanges();
    expect(forbidden.host.querySelector('.cnpm-error--forbidden')).not.toBeNull();
    expect(forbidden.host.textContent).toContain('AUDIT.READ');
    expect(findButton(forbidden.host, 'Réessayer')).toBeUndefined();
  });

  it('retombe sur page 1 et size 25 pour des paramètres URL invalides', async () => {
    const { gateway } = await setup({ page: '-4', size: '100' });
    expect(gateway.calls[0].query).toEqual({ page: 1, size: 25 });
  });

  it('recalibre une page URL hors limites sur la dernière page servie', async () => {
    const { fixture, gateway, navigate } = await setup({ page: '999', size: '25' });
    gateway.latest.next({
      items: [],
      page: 998,
      size: 25,
      totalElements: 80,
      totalPages: 4,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { page: 4 },
      queryParamsHandling: 'merge',
    });
  });
});
