import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import {
  type EditableMemberCore,
  MEMBER_EDIT_GATEWAY,
  MemberEditAccessError,
  MemberEditConflictError,
  type MemberEditGateway,
  MemberEditNotFoundError,
  type MemberCoreUpdate,
} from './member-edit-gateway';
import { MemberEditPage } from './member-edit.page';

const MEMBER: EditableMemberCore = {
  id: '10000000-0000-4000-8000-000000000001',
  legalName: 'Ateliers Nimba',
  tradeName: 'Nimba Atelier',
  organizationType: 'Société anonyme',
  sectorCode: 'FABRICATION_01',
  status: 'ACTIVE',
  riskLevel: 'NORMAL',
  version: 7,
};

class MemberEditStub implements MemberEditGateway {
  readonly load = vi.fn<(id: string) => Observable<EditableMemberCore>>(() => of(MEMBER));
  readonly update = vi.fn(
    (id: string, version: number, changes: MemberCoreUpdate): Observable<EditableMemberCore> =>
      of({
        ...MEMBER,
        ...changes,
        id,
        tradeName: changes.tradeName || null,
        sectorCode: changes.sectorCode || null,
        version: version + 1,
      }),
  );
}

function activatedRoute() {
  const params = new BehaviorSubject(convertToParamMap({ id: MEMBER.id }));
  const query = new BehaviorSubject(
    convertToParamMap({ page: '2', statut: 'ACTIVE', onglet: 'adhesion' }),
  );
  return {
    paramMap: params.asObservable(),
    queryParamMap: query.asObservable(),
    snapshot: { paramMap: params.value, queryParamMap: query.value },
  };
}

async function setup(configure?: (gateway: MemberEditStub) => void) {
  const gateway = new MemberEditStub();
  configure?.(gateway);
  await TestBed.configureTestingModule({
    imports: [MemberEditPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRoute() },
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      { provide: MEMBER_EDIT_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MemberEditPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

function pageApi(fixture: ReturnType<typeof TestBed.createComponent<MemberEditPage>>) {
  return fixture.componentInstance as unknown as {
    form: MemberEditPage['form'];
    submit(): void;
    reloadCurrent(): void;
  };
}

describe('MemberEditPage BO-004', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('charge uniquement le noyau descriptif et explique les volets protégés', async () => {
    const { gateway, host } = await setup();
    expect(gateway.load).toHaveBeenCalledWith(MEMBER.id);
    expect(host.textContent).toContain('Identité descriptive');
    expect(host.textContent).toContain('Volets non modifiables ici');
    expect(host.textContent).toContain('MEMBER.SENSITIVE.WRITE');
    expect((host.querySelector('#member-legal-name') as HTMLInputElement).value).toBe(
      MEMBER.legalName,
    );
    expect(host.querySelectorAll('.cnpm-member-edit__fields input')).toHaveLength(4);
  });

  it('refuse une raison sociale vide et focalise un résumé relié au champ', async () => {
    const { fixture, gateway, host } = await setup();
    const page = pageApi(fixture);
    page.form.controls.legalName.setValue('   ');
    page.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(gateway.update).not.toHaveBeenCalled();
    const summary = host.querySelector('.cnpm-error-summary') as HTMLElement;
    expect(summary.textContent).toContain('La raison sociale est obligatoire.');
    expect(summary.querySelector('a')?.getAttribute('href')).toBe('#member-legal-name');
    expect(document.activeElement).toBe(summary);
  });

  it('transmet If-Match via la version du read-model puis revient sur BO-003', async () => {
    const { fixture, gateway } = await setup();
    const page = pageApi(fixture);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    page.form.controls.legalName.setValue('Ateliers Nimba révisés');
    page.submit();
    await fixture.whenStable();

    expect(gateway.update).toHaveBeenCalledWith(
      MEMBER.id,
      MEMBER.version,
      expect.objectContaining({ legalName: 'Ateliers Nimba révisés' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/admin/members', MEMBER.id], {
      queryParams: { page: '2', statut: 'ACTIVE', onglet: 'adhesion' },
    });
  });

  it('distingue les états 403 et 404 au chargement', async () => {
    const forbidden = await setup((gateway) =>
      gateway.load.mockReturnValue(throwError(() => new MemberEditAccessError())),
    );
    expect(forbidden.host.textContent).toContain('Modification non autorisée');

    TestBed.resetTestingModule();
    const notFound = await setup((gateway) =>
      gateway.load.mockReturnValue(throwError(() => new MemberEditNotFoundError())),
    );
    expect(notFound.host.textContent).toContain('Dossier membre introuvable');
  });

  it('rend le conflit 409 récupérable sans masquer les données saisies', async () => {
    const { fixture, gateway, host } = await setup((stub) =>
      stub.update.mockReturnValue(
        throwError(() => new MemberEditConflictError('Version obsolète')),
      ),
    );
    const page = pageApi(fixture);
    page.form.controls.tradeName.setValue('Valeur locale non sauvegardée');
    page.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Version obsolète');
    expect(host.textContent).toContain('Recharger la version courante');
    expect(page.form.controls.tradeName.value).toBe('Valeur locale non sauvegardée');
    expect(gateway.load).toHaveBeenCalledTimes(1);
  });

  it('annonce distinctement un refus 403 survenu au moment de la sauvegarde', async () => {
    const { fixture, host } = await setup((stub) =>
      stub.update.mockReturnValue(throwError(() => new MemberEditAccessError())),
    );
    pageApi(fixture).submit();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.textContent).toContain('Droit de modification refusé');
    expect(host.textContent).toContain('MEMBER.WRITE');
  });

  it('protège une saisie non enregistrée lors de la navigation', async () => {
    const { fixture } = await setup();
    const page = pageApi(fixture);
    page.form.controls.tradeName.setValue('Changement local');
    page.form.markAsDirty();
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
    expect(fixture.componentInstance.confirmNavigation()).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
  });
});
