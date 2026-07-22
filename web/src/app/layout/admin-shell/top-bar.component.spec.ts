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

  it('présente une seule action globale et le menu du compte connecté', async () => {
    const { host } = await setup();
    const action = host.querySelector<HTMLAnchorElement>('.cnpm-topbar__primary-action');

    expect(action?.getAttribute('href')).toBe('/admin/enrollments/new');
    expect(action?.getAttribute('aria-label')).toBe('Créer un nouvel enrôlement');
    // L'identité devient un menu de compte : initiales, nom + rôle, et la déconnexion.
    expect(host.querySelector('.cnpm-account-menu__avatar')?.textContent?.trim()).toBe('TR');
    expect(host.querySelector('.cnpm-account-menu__trigger')?.getAttribute('aria-label')).toBe(
      'Compte de TIEGNAN Romuald, Propriétaire',
    );
  });

  it('garde le repère de recherche monté alors que le champ est replié', async () => {
    // Le champ a cédé sa place au titre. Le formulaire, lui, reste dans le document :
    // le retirer supprimerait le repère `role="search"` exigé par FRM-012 (P0).
    const { host } = await setup();
    const field = host.querySelector<HTMLElement>('.cnpm-topbar__field');
    const toggle = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');

    expect(host.querySelector('form[role="search"]')).not.toBeNull();
    expect(field?.hasAttribute('hidden')).toBe(true);
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.getAttribute('aria-controls')).toBe('recherche-globale-champ');
    expect(field?.id).toBe('recherche-globale-champ');
  });

  it('déplie puis replie le champ de recherche', async () => {
    const { fixture, host } = await setup();
    const toggle = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');

    toggle?.click();
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-topbar__field')?.hasAttribute('hidden')).toBe(false);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');

    toggle?.click();
    fixture.detectChanges();
    expect(host.querySelector('.cnpm-topbar__field')?.hasAttribute('hidden')).toBe(true);
  });

  it('ramène le focus sur le déclencheur quand Échap referme le champ', async () => {
    // Sans ce retour, le focus resterait sur un champ devenu `hidden` : le navigateur le
    // renverrait au document et la personne au clavier repartirait du haut de la page.
    const { fixture, host } = await setup();
    const toggle = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');

    toggle?.click();
    fixture.detectChanges();
    const input = host.querySelector<HTMLInputElement>('#recherche-globale');
    input?.focus();
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.querySelector('.cnpm-topbar__field')?.hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });

  it('referme le panneau de notifications par Échap en rendant le focus au déclencheur', async () => {
    // Le tiroir de recherche du même composant offre déjà ce comportement : sans lui ici,
    // la personne au clavier repartirait du haut du document (WCAG 2.2, critère 2.4.3).
    const { fixture, host } = await setup();
    const panel = host.querySelector<HTMLDetailsElement>('.cnpm-topbar__notifications');
    const trigger = host.querySelector<HTMLElement>('.cnpm-topbar__notification-trigger');
    if (!panel || !trigger) throw new Error('Panneau de notifications introuvable');

    // L'état vient du DOM natif, pas d'un signal parallèle.
    panel.open = true;
    fixture.detectChanges();
    // Le focus doit être DANS le panneau : c'est la seule situation où le rapatrier
    // est correct. Ailleurs, ce serait un vol de focus.
    trigger.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('referme le panneau sur Échap frappé ailleurs, sans déplacer le focus', async () => {
    // Défaut trouvé par vérification adversariale : le gestionnaire rapatriait le focus
    // sans regarder d'où venait la touche. Un Échap frappé n'importe où dans la page
    // sautait donc sur la cloche, et `preventDefault` privait tout autre consommateur
    // de la touche. Ce test échoue sur la version fautive.
    const { fixture, host } = await setup();
    const panel = host.querySelector<HTMLDetailsElement>('.cnpm-topbar__notifications');
    const ailleurs = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');
    if (!panel || !ailleurs) throw new Error('Panneau de notifications introuvable');

    panel.open = true;
    fixture.detectChanges();
    ailleurs.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(panel.open).toBe(false);
    expect(document.activeElement).toBe(ailleurs);
  });

  it('n intercepte pas l Échap du champ de recherche quand le panneau est ouvert', async () => {
    // Les deux dépliants coexistent. Sans garde, l'Échap du champ était consommé deux
    // fois : `closeSearch()` posait le focus sur son déclencheur, puis le gestionnaire
    // du panneau l'écrasait vers la cloche.
    const { fixture, host } = await setup();
    const panel = host.querySelector<HTMLDetailsElement>('.cnpm-topbar__notifications');
    const toggle = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');
    if (!panel || !toggle) throw new Error('Barre incomplète');

    panel.open = true;
    toggle.click();
    fixture.detectChanges();
    const input = host.querySelector<HTMLInputElement>('#recherche-globale');
    input?.focus();
    input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(toggle);
  });

  it('referme le panneau quand le focus en sort au clavier', async () => {
    // Le panneau ne contient aucun élément focalisable : une tabulation depuis le
    // `<summary>` le laissait ouvert indéfiniment. Sous 479 px il est en `position:
    // fixed` pleine largeur et recouvrirait l'élément qui vient de prendre le focus.
    const { fixture, host } = await setup();
    const panel = host.querySelector<HTMLDetailsElement>('.cnpm-topbar__notifications');
    const ailleurs = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');
    if (!panel || !ailleurs) throw new Error('Panneau de notifications introuvable');

    panel.open = true;
    fixture.detectChanges();
    panel.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: ailleurs }));
    fixture.detectChanges();

    expect(panel.open).toBe(false);
  });

  it('referme le panneau de notifications au clic extérieur sans voler le focus', async () => {
    const { fixture, host } = await setup();
    const panel = host.querySelector<HTMLDetailsElement>('.cnpm-topbar__notifications');
    const ailleurs = host.querySelector<HTMLButtonElement>('.cnpm-topbar__search-toggle');
    if (!panel || !ailleurs) throw new Error('Panneau de notifications introuvable');

    panel.open = true;
    fixture.detectChanges();
    ailleurs.focus();
    ailleurs.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(panel.open).toBe(false);
    // Le focus appartient à la cible du clic : le ramener au déclencheur le lui volerait.
    expect(document.activeElement).toBe(ailleurs);
  });

  it('laisse le panneau de notifications ouvert lors d un clic à l intérieur', async () => {
    const { fixture, host } = await setup();
    const panel = host.querySelector<HTMLDetailsElement>('.cnpm-topbar__notifications');
    const contenu = host.querySelector<HTMLElement>('.cnpm-topbar__notification-panel');
    if (!panel || !contenu) throw new Error('Panneau de notifications introuvable');

    panel.open = true;
    fixture.detectChanges();
    contenu.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(panel.open).toBe(true);
  });

  it('affiche une accroche nominative sans dupliquer le h1 de la page', async () => {
    const { host } = await setup();
    const title = host.querySelector<HTMLElement>('.cnpm-topbar__title');

    expect(title?.textContent).toContain('Plateforme Nationale de Gestion des Membres du CNPM');
    expect(title?.textContent).toContain('Bonjour TIEGNAN');
    // La barre est présente sur toutes les pages : un `h1` ici en ferait deux par écran.
    expect(host.querySelector('h1')).toBeNull();
  });

  it('retombe sur un titre neutre tant que l identité est inconnue', async () => {
    const { host } = await setup({ identity: of(null) });

    expect(host.querySelector('.cnpm-topbar__headline')?.textContent?.trim()).toBe(
      'Espace d’administration',
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
