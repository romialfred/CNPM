import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  MEMBER_PROFILE_GATEWAY,
  type MemberProfile,
  type MemberProfileGateway,
} from './member-profile-gateway';
import { MemberProfilePage } from './member-profile.page';

const PROFILE: MemberProfile = {
  displayName: 'Adhérent de test',
  email: 'membre1@cnpm-portail.test',
  organization: 'Société de test',
  jobTitle: 'Gérant',
  phone: null,
  avatarDataUri: null,
  avatarUpdatedAt: null,
};

async function setup(gateway: MemberProfileGateway) {
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
  return { host: fixture.nativeElement as HTMLElement };
}

describe('MemberProfilePage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le profil et des initiales à défaut de photo', async () => {
    const gateway: MemberProfileGateway = {
      load: () => of(PROFILE),
      updateAvatar: () => of(PROFILE),
      deleteAvatar: () => of(PROFILE),
    };
    const { host } = await setup(gateway);

    expect(host.textContent).toContain('Adhérent de test');
    expect(host.textContent).toContain('membre1@cnpm-portail.test');
    expect(host.querySelector('.member-profile__avatar-initials')?.textContent?.trim()).toBe('AD');
    // Le champ de fichier permet de changer la photo.
    expect(host.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('rend un état d’erreur si le chargement échoue', async () => {
    const gateway: MemberProfileGateway = {
      load: (): Observable<MemberProfile> => throwError(() => new Error('boom')),
      updateAvatar: () => of(PROFILE),
      deleteAvatar: () => of(PROFILE),
    };
    const { host } = await setup(gateway);

    expect(host.textContent).toContain('Chargement impossible');
  });
});
