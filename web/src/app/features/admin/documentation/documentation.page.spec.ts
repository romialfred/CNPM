import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { DocumentationPage } from './documentation.page';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [DocumentationPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DocumentationPage);
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

describe('DocumentationPage', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('affiche le manuel utilisateur par défaut, avec un sommaire ancré', async () => {
    const { host } = await setup();

    expect(host.textContent).toContain('Démarrage et connexion');
    // Le sommaire pointe sur les ancres des sections.
    const tocLinks = [...host.querySelectorAll<HTMLAnchorElement>('.cnpm-doc-page__toc-link')];
    expect(tocLinks.length).toBeGreaterThan(0);
    expect(tocLinks[0].getAttribute('href')).toBe('#um-demarrage');
    // La bascule « Manuel utilisateur » est active.
    const active = host.querySelector('.cnpm-doc-page__switch-btn--active');
    expect(active?.textContent?.trim()).toBe('Manuel utilisateur');
    expect(active?.getAttribute('aria-pressed')).toBe('true');
  });

  it('bascule vers la documentation technique et son dictionnaire de données', async () => {
    const { fixture, host } = await setup();

    const technicalButton = [
      ...host.querySelectorAll<HTMLButtonElement>('.cnpm-doc-page__switch-btn'),
    ].find((b) => b.textContent?.trim() === 'Documentation technique');
    expect(technicalButton).toBeTruthy();
    technicalButton!.click();
    fixture.detectChanges();

    expect(host.textContent).toContain('Base de données et dictionnaire');
    expect(host.textContent).toContain('iam.user_account');
    // La section d'architecture ouvre bien le manuel technique.
    expect(host.querySelector('#tech-architecture')).not.toBeNull();
    expect(host.textContent).not.toContain('Démarrage et connexion');
  });
});
