import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_GATEWAY } from './auth-gateway';
import { SetPasswordPage } from './set-password.page';

/**
 * Ce qui est vérifié : le jeton vient du lien et n'est jamais réaffiché, une saisie trop
 * courte ou discordante ne part pas au serveur, et un lien mort se dit sans préciser
 * pourquoi il l'est.
 */

const VALID = 'phrase-de-passe-longue-2026';

function setup(params: Record<string, string>, activation: boolean, gateway: unknown) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [SetPasswordPage],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      { provide: AUTH_GATEWAY, useValue: gateway },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { queryParamMap: convertToParamMap(params), data: { activation } },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(SetPasswordPage);
  fixture.detectChanges();
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

function fill(host: HTMLElement, password: string, confirmation: string) {
  const [pwd, confirm] = [...host.querySelectorAll('input')] as HTMLInputElement[];
  for (const [field, value] of [
    [pwd, password],
    [confirm, confirmation],
  ] as const) {
    field.value = value;
    field.dispatchEvent(new Event('input'));
    field.dispatchEvent(new Event('blur'));
  }
}

describe('SetPasswordPage', () => {
  let setPassword: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setPassword = vi.fn(() => of(undefined));
  });

  it('n’affiche aucun formulaire sans jeton dans le lien', () => {
    const { host } = setup({}, true, { setPassword });

    expect(host.querySelectorAll('input')).toHaveLength(0);
    expect(host.textContent).toContain('Ce lien est incomplet');
  });

  it('ne réaffiche jamais le jeton à l’écran', () => {
    const { host } = setup({ token: 'jeton-secret-du-lien' }, true, { setPassword });

    expect(host.textContent).not.toContain('jeton-secret-du-lien');
    expect(host.innerHTML).not.toContain('jeton-secret-du-lien');
  });

  it('parle d’activation pour un compte neuf et de remplacement pour une récupération', () => {
    expect(setup({ token: 't' }, true, { setPassword }).host.textContent).toContain(
      'Activez votre compte',
    );
    expect(setup({ token: 't' }, false, { setPassword }).host.textContent).toContain(
      'Choisissez un nouveau mot de passe',
    );
  });

  it('ne soumet pas un mot de passe trop court', async () => {
    const { fixture, host } = setup({ token: 'jeton' }, true, { setPassword });

    fill(host, 'court', 'court');
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(setPassword).not.toHaveBeenCalled();
  });

  it('ne soumet pas deux saisies discordantes — une faute de frappe enfermerait dehors', async () => {
    const { fixture, host } = setup({ token: 'jeton' }, true, { setPassword });

    fill(host, VALID, VALID + '-x');
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(setPassword).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(host.textContent).toContain('ne correspondent pas');
  });

  it('transmet le jeton du lien et le mot de passe, puis annonce le succès', async () => {
    const { fixture, host } = setup({ token: 'jeton-du-lien' }, true, { setPassword });

    fill(host, VALID, VALID);
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(setPassword).toHaveBeenCalledWith('jeton-du-lien', VALID);
    expect(host.textContent).toContain('Mot de passe enregistré');
  });

  it('annonce un lien mort sans dire s’il est inconnu, périmé ou déjà utilisé', async () => {
    const failing = vi.fn(() => throwError(() => new Error('refus')));
    const { fixture, host } = setup({ token: 'jeton' }, false, { setPassword: failing });

    fill(host, VALID, VALID);
    host.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    const text = host.textContent ?? '';
    expect(text).toContain('Ce lien n’est plus valable');
    expect(text).not.toContain('expiré depuis');
    expect(text).not.toContain('inconnu');
  });
});
