import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnavailableHttpFeatureError } from '../../../core/api/unavailable-feature';
import {
  MEMBER_PROFILE_GATEWAY,
  type MemberProfileGateway,
  type MemberProfileSnapshot,
} from './member-profile-gateway';
import { MemberProfilePage } from './member-profile.page';

const READY_PROFILE: MemberProfileSnapshot = {
  displayLabel: 'Membre de démonstration',
  roleLabel: 'Administrateur fictif de l’entreprise',
  organizationName: 'Entreprise Démo Sahel',
  memberReference: 'CNPM-DEMO-0001',
  organizationTypeLabel: 'Entreprise fictive',
  membershipLabel: 'Adhésion active — scénario',
  membershipSince: '2024-03-18',
  disclosure: 'Profil local, fictif et non modifiable. Aucune donnée membre réelle.',
};

class ControllableGateway implements MemberProfileGateway {
  readonly responses: Subject<MemberProfileSnapshot | null>[] = [];

  load(): Subject<MemberProfileSnapshot | null> {
    const response = new Subject<MemberProfileSnapshot | null>();
    this.responses.push(response);
    return response;
  }

  get latest(): Subject<MemberProfileSnapshot | null> {
    return this.responses[this.responses.length - 1];
  }
}

async function setup() {
  const gateway = new ControllableGateway();
  await TestBed.configureTestingModule({
    imports: [MemberProfilePage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: MEMBER_PROFILE_GATEWAY, useValue: gateway },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MemberProfilePage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, gateway, host: fixture.nativeElement as HTMLElement };
}

describe('MemberProfilePage — MP-013', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche un profil fictif en lecture seule, sans donnée sensible ni action', async () => {
    const { fixture, gateway, host } = await setup();
    expect(host.textContent).toContain('Chargement du profil entreprise fictif');

    gateway.latest.next(READY_PROFILE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.querySelectorAll('h1')).toHaveLength(1);
    expect(host.textContent).toContain('Entreprise Démo Sahel');
    expect(host.textContent).toContain('CNPM-DEMO-0001');
    expect(host.textContent).toContain('18/03/2024');
    expect(host.querySelector('.member-profile h1')).toBe(document.activeElement);
    expect(host.querySelectorAll('.member-profile form, .member-profile input')).toHaveLength(0);
    expect(host.querySelectorAll('.member-profile button, .member-profile a')).toHaveLength(0);
    expect(host.textContent).not.toMatch(/Keycloak|secret|jeton|RCCM|NIF|KYC/i);
  });

  it('distingue vide, erreur récupérable et indisponibilité HTTP', async () => {
    const empty = await setup();
    empty.gateway.latest.next(null);
    await empty.fixture.whenStable();
    empty.fixture.detectChanges();
    expect(empty.host.textContent).toContain('Aucun profil entreprise');

    TestBed.resetTestingModule();
    const failed = await setup();
    failed.gateway.latest.error(new Error('indisponible'));
    await failed.fixture.whenStable();
    failed.fixture.detectChanges();
    expect(failed.host.textContent).toContain('Le profil n’a pas pu être chargé');
    expect(failed.host.textContent).toContain('Réessayer');

    TestBed.resetTestingModule();
    const unavailable = await setup();
    unavailable.gateway.latest.error(new UnavailableHttpFeatureError('MP-013'));
    await unavailable.fixture.whenStable();
    unavailable.fixture.detectChanges();
    expect(unavailable.host.textContent).toContain('Profil entreprise indisponible en mode HTTP');
  });
});
