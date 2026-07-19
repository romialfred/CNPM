import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { DemoSessionGateway } from './demo-session.gateway';
import { SESSION_GATEWAY, type SessionGateway } from './session-gateway';
import { TopBarComponent } from './top-bar.component';

async function setup(sessionGateway?: SessionGateway) {
  await TestBed.configureTestingModule({
    imports: [TopBarComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      sessionGateway
        ? { provide: SESSION_GATEWAY, useValue: sessionGateway }
        : { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TopBarComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('TopBarComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('borne la recherche aux membres avec un nom accessible persistant', async () => {
    const { fixture, host } = await setup();
    const emit = vi.fn();
    fixture.componentInstance.searchSubmit.subscribe(emit);
    const input = host.querySelector<HTMLInputElement>('#recherche-globale');
    const form = host.querySelector<HTMLFormElement>('form[role="search"]');

    expect(host.querySelector('label[for="recherche-globale"]')?.textContent).toContain(
      'Rechercher un membre',
    );
    if (!input || !form) throw new Error('Recherche introuvable');
    input.value = '  SOMACOP  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(emit).toHaveBeenCalledWith('SOMACOP');
  });

  it('rend le compteur et le contexte de notification', async () => {
    const { host } = await setup();
    const trigger = host.querySelector<HTMLElement>('.cnpm-topbar__notification-trigger');

    expect(trigger?.getAttribute('aria-label')).toBe('8 notifications');
    expect(host.querySelector('.cnpm-topbar__notification-count')?.textContent?.trim()).toBe('8');
    expect(host.textContent).toContain('Le centre de notifications n’est pas encore raccordé.');
  });

  it('présente une seule action globale et une identité textuelle', async () => {
    const { host } = await setup();
    const action = host.querySelector<HTMLAnchorElement>('.cnpm-topbar__primary-action');

    expect(action?.getAttribute('href')).toBe('/admin/enrollments/new');
    expect(action?.getAttribute('aria-label')).toBe('Créer un nouvel enrôlement');
    expect(host.querySelector('.cnpm-topbar__avatar')?.textContent?.trim()).toBe('AT');
    expect(host.querySelector('.cnpm-topbar__identity')?.getAttribute('aria-label')).toBe(
      'Aminata Traoré, Administrateur',
    );
  });

  it('masque l action d enrôlement sans la permission backend', async () => {
    const { host } = await setup({
      identity: of({
        displayName: 'Lecteur',
        roleLabel: 'LECTEUR',
        exerciseLabel: null,
        notificationCount: null,
        demoMode: false,
        permissions: ['MEMBER.READ'],
      }),
    });
    expect(host.querySelector('.cnpm-topbar__primary-action')).toBeNull();
  });
});
