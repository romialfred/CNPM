import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CNPM_DATA_MODE } from '../../../core/api/api.config';
import { SESSION_GATEWAY, type SessionGateway } from '../../../layout/admin-shell/session-gateway';
import {
  ReferenceValueConflictError,
  SETTINGS_GATEWAY,
  type ReferenceValue,
  type ReferenceValueInput,
  type ReferenceValuePage,
  type ReferenceValueQuery,
  type ReferenceValuesGateway,
  type ReferenceValueUpdate,
} from './settings-gateway';
import { SettingsPage } from './settings.page';

const VALUE: ReferenceValue = {
  id: '33000000-0000-4000-8000-000000000001',
  domain: 'REF_CLASSE_INTERNE',
  code: 'REF_STANDARD',
  label: 'Valeur strictement contrôlée',
  sortOrder: 10,
  active: true,
  validFrom: null,
  validTo: null,
  version: 7,
};

class SettingsStub implements ReferenceValuesGateway {
  readonly lists: Subject<ReferenceValuePage>[] = [];
  readonly queries: ReferenceValueQuery[] = [];
  readonly create = vi.fn((input: ReferenceValueInput) => of({ ...VALUE, ...input, version: 0 }));
  readonly update = vi.fn((id: string, version: number, changes: ReferenceValueUpdate) =>
    of({ ...VALUE, ...changes, id, version: version + 1 }),
  );

  list(query: ReferenceValueQuery): Subject<ReferenceValuePage> {
    this.queries.push(query);
    const result = new Subject<ReferenceValuePage>();
    this.lists.push(result);
    return result;
  }
}

const session: SessionGateway = {
  identity: of({
    displayName: 'Agent',
    roleLabel: 'Administrateur fonctionnel',
    exerciseLabel: null,
    notificationCount: null,
    demoMode: true,
    permissions: ['ADMIN.REFERENTIAL.READ', 'ADMIN.REFERENTIAL.WRITE'],
  }),
};

function route(initial: Record<string, string> = {}) {
  const query = new BehaviorSubject(convertToParamMap(initial));
  return {
    query,
    value: {
      queryParamMap: query.asObservable(),
      snapshot: { queryParamMap: query.value },
    },
  };
}

async function setup(
  initial: Record<string, string> = {},
  mode: 'http' | 'demo' = 'demo',
  sessionGateway: SessionGateway = session,
) {
  const gateway = new SettingsStub();
  const activatedRoute = route(initial);
  await TestBed.configureTestingModule({
    imports: [SettingsPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRoute.value },
      { provide: CNPM_DATA_MODE, useValue: mode },
      { provide: SESSION_GATEWAY, useValue: sessionGateway },
      { provide: SETTINGS_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SettingsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return {
    fixture,
    gateway,
    activatedRoute,
    host: fixture.nativeElement as HTMLElement,
  };
}

function buttonByText(host: HTMLElement, text: string): HTMLButtonElement {
  const button = [...host.querySelectorAll<HTMLButtonElement>('button')].find((candidate) =>
    candidate.textContent?.includes(text),
  );
  if (!button) throw new Error(`Bouton introuvable : ${text}`);
  return button;
}

function setInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('SettingsPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('lit le domaine et la pagination depuis l’URL, puis rend le registre', async () => {
    const { fixture, gateway, host } = await setup({
      domain: 'REF_CLASSE_INTERNE',
      page: '2',
      size: '10',
    });
    expect(gateway.queries[0]).toEqual({
      domain: 'REF_CLASSE_INTERNE',
      page: 2,
      pageSize: 10,
    });
    expect(host.querySelector('.cnpm-skeleton')).not.toBeNull();

    gateway.lists[0].next({ rows: [VALUE], totalItems: 11, totalPages: 2 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain(VALUE.label);
    expect(host.textContent).toContain('11 valeurs trouvées');
    expect(host.querySelector('table caption')?.textContent).toContain('Valeurs de référentiel');
  });

  it('conserve le filtre domaine dans l’URL partageable', async () => {
    const { fixture, host } = await setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const input = host.querySelector<HTMLInputElement>('#settings-filter-domain')!;
    setInput(input, ' DOMAINE_LIBRE ');
    host
      .querySelector<HTMLFormElement>('.cnpm-settings__filter form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith([], {
      relativeTo: expect.anything(),
      queryParams: { domain: 'DOMAINE_LIBRE', page: null },
      queryParamsHandling: 'merge',
    });
  });

  it('crée uniquement les champs de ReferenceValueInput', async () => {
    const { fixture, gateway, host } = await setup();
    buttonByText(host, 'Créer une valeur').click();
    fixture.detectChanges();

    setInput(host.querySelector<HTMLInputElement>('#settings-domain')!, 'REF_NOUVEAU');
    setInput(host.querySelector<HTMLInputElement>('#settings-code')!, 'REF_CODE');
    setInput(host.querySelector<HTMLInputElement>('#settings-label')!, 'Valeur créée');
    setInput(host.querySelector<HTMLInputElement>('#settings-sort-order')!, '30');
    host
      .querySelector<HTMLFormElement>('.cnpm-settings__editor-form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(gateway.create).toHaveBeenCalledWith({
      domain: 'REF_NOUVEAU',
      code: 'REF_CODE',
      label: 'Valeur créée',
      sortOrder: 30,
      active: true,
    });
  });

  it('PATCH uniquement le champ modifié et transmet la version chargée', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.lists[0].next({ rows: [VALUE], totalItems: 1, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    buttonByText(host, 'Modifier').click();
    fixture.detectChanges();
    setInput(host.querySelector<HTMLInputElement>('#settings-label')!, 'Libellé révisé');
    host
      .querySelector<HTMLFormElement>('.cnpm-settings__editor-form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(gateway.update).toHaveBeenCalledWith(VALUE.id, VALUE.version, {
      label: 'Libellé révisé',
    });
  });

  it('annonce le conflit optimiste sans écraser les changements', async () => {
    const { fixture, gateway, host } = await setup();
    gateway.lists[0].next({ rows: [VALUE], totalItems: 1, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();
    gateway.update.mockImplementation(() => throwError(() => new ReferenceValueConflictError()));

    buttonByText(host, 'Modifier').click();
    fixture.detectChanges();
    setInput(host.querySelector<HTMLInputElement>('#settings-label')!, 'Changement local');
    host
      .querySelector<HTMLFormElement>('.cnpm-settings__editor-form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Conflit détecté');
    expect(host.textContent).toContain('Vos changements n’ont pas été écrasés');
    expect(host.querySelector<HTMLInputElement>('#settings-label')?.value).toBe(
      'Changement local',
    );
  });

  it('garde les changements non enregistrés et expose les associations accessibles', async () => {
    const { fixture, host } = await setup();
    buttonByText(host, 'Créer une valeur').click();
    fixture.detectChanges();
    setInput(host.querySelector<HTMLInputElement>('#settings-label')!, 'Brouillon');
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);

    expect(fixture.componentInstance.confirmNavigation()).toBe(false);
    expect(confirm).toHaveBeenCalled();
    expect(host.querySelector('label[for="settings-domain"]')).not.toBeNull();
    expect(host.querySelector('label[for="settings-code"]')).not.toBeNull();
    expect(host.querySelector('label[for="settings-label"]')).not.toBeNull();
    expect(host.querySelector('label[for="settings-sort-order"]')).not.toBeNull();
    expect(host.querySelector('label[for="settings-active"]')).not.toBeNull();
    expect(host.querySelector<HTMLInputElement>('#settings-domain')?.required).toBe(true);
    expect(host.querySelector<HTMLInputElement>('#settings-code')?.required).toBe(true);
    expect(host.querySelector<HTMLInputElement>('#settings-label')?.required).toBe(true);
  });

  it('actualise le résumé à mesure que les erreurs locales sont corrigées', async () => {
    const { fixture, host } = await setup();
    buttonByText(host, 'Créer une valeur').click();
    fixture.detectChanges();
    host
      .querySelector<HTMLFormElement>('.cnpm-settings__editor-form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelector('a[href="#settings-domain"]')).not.toBeNull();
    setInput(host.querySelector<HTMLInputElement>('#settings-domain')!, 'REF_CORRIGE');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.querySelector('a[href="#settings-domain"]')).toBeNull();
    expect(host.querySelector('a[href="#settings-code"]')).not.toBeNull();
  });

  it('interdit fermeture et navigation pendant une sauvegarde en cours', async () => {
    const { fixture, gateway, host } = await setup();
    const pending = new Subject<ReferenceValue>();
    gateway.create.mockReturnValue(pending);
    buttonByText(host, 'Créer une valeur').click();
    fixture.detectChanges();
    setInput(host.querySelector<HTMLInputElement>('#settings-domain')!, 'REF_NOUVEAU');
    setInput(host.querySelector<HTMLInputElement>('#settings-code')!, 'REF_CODE');
    setInput(host.querySelector<HTMLInputElement>('#settings-label')!, 'Valeur créée');
    host
      .querySelector<HTMLFormElement>('.cnpm-settings__editor-form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.confirmNavigation()).toBe(false);
    expect(buttonByText(host, 'Fermer').getAttribute('aria-disabled')).toBe('true');
    buttonByText(host, 'Fermer').click();
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-settings__editor')).not.toBeNull();

    pending.next({ ...VALUE, domain: 'REF_NOUVEAU', code: 'REF_CODE', version: 0 });
    pending.complete();
    await fixture.whenStable();
  });

  it('reste en lecture seule sans ADMIN.REFERENTIAL.WRITE', async () => {
    const readOnlySession: SessionGateway = {
      identity: of({
        displayName: 'Lecteur',
        roleLabel: 'Lecture seule',
        exerciseLabel: null,
        notificationCount: null,
        demoMode: false,
        permissions: ['ADMIN.REFERENTIAL.READ'],
      }),
    };
    const { fixture, gateway, host } = await setup({}, 'http', readOnlySession);
    gateway.lists[0].next({ rows: [VALUE], totalItems: 1, totalPages: 1 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      [...host.querySelectorAll('button')].some((button) =>
        button.textContent?.includes('Créer une valeur'),
      ),
    ).toBe(false);
    expect(host.textContent).toContain('Lecture seule');
  });
});
