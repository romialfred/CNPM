import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemberCnpmPage } from './member-cnpm.page';
import { MEMBER_EVENTS_GATEWAY, type MemberEventsGateway } from './member-events.gateway';

const emptyEventsGateway: MemberEventsGateway = {
  list: () => of([]),
};

describe('MemberCnpmPage — point d’entrée « La COGEF »', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberCnpmPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: MEMBER_EVENTS_GATEWAY, useValue: emptyEventsGateway },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MemberCnpmPage);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('affiche le titre institutionnel et un contenu principal identifiable', () => {
    expect(host.querySelector('main#contenu-principal')).not.toBeNull();
    expect(host.querySelector('h1')?.textContent).toContain('La COGEF');
  });

  it('n’invente aucune actualité : sans événement publié, la section reste en état vide honnête', () => {
    const emptyTitle = host.querySelector('.cnpm-empty__title')?.textContent?.trim();
    expect(emptyTitle).toBe('Aucune actualité publiée');
  });

  it('propose des accès rapides vers des écrans réels de l’espace membre', () => {
    const links = Array.from(
      host.querySelectorAll<HTMLAnchorElement>('.member-cnpm__card'),
    ).map((link) => link.getAttribute('href'));

    expect(links).toEqual([
      '/member/directory',
      '/member/showcase/edit',
      '/member/requests',
      '/member/documents',
    ]);
  });
});
