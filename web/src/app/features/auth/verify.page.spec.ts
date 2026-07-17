import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AUTH_GATEWAY, type AuthGateway } from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';
import { VerifyPage } from './verify.page';

/** Passerelle contrôlée : aucun identifiant réel, aucune latence. */
class StubGateway implements AuthGateway {
  resendCalls = 0;
  codeOutcome: 'authenticated' | 'invalid-code' = 'authenticated';

  submitCredentials() {
    return of({ outcome: 'mfa-required', challengeId: 'challenge-1' } as const);
  }

  verifyCode() {
    return of(
      this.codeOutcome === 'authenticated'
        ? ({ outcome: 'authenticated', redirectTo: '/' } as const)
        : ({ outcome: 'invalid-code' } as const),
    );
  }

  resendCode() {
    this.resendCalls++;
    return of(undefined);
  }
}

describe('VerifyPage (AUTH-001 — 2FA)', () => {
  let gateway: StubGateway;

  async function setup(withChallenge = true) {
    gateway = new StubGateway();
    await TestBed.configureTestingModule({
      imports: [VerifyPage],
      providers: [provideRouter([]), { provide: AUTH_GATEWAY, useValue: gateway }],
    }).compileComponents();
    if (withChallenge) {
      TestBed.inject(AuthFlowStore).startChallenge('challenge-1', 'admin');
    } else {
      TestBed.inject(AuthFlowStore).clear();
    }
    const fixture = TestBed.createComponent(VerifyPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  /**
   * Cible la région d'annonce du renvoi précisément.
   *
   * Un sélecteur générique `[role="status"]` attraperait la région hors ligne, qui
   * porte le même rôle et précède celle-ci dans le DOM.
   */
  function liveRegionText(element: HTMLElement): string {
    return element.querySelector('.cnpm-verify__announcement')?.textContent?.trim() ?? '';
  }

  it('bascule en session expirée sans défi actif plutôt que d’exposer un formulaire inopérant', async () => {
    const { element } = await setup(false);

    expect(element.textContent).toContain('Session de connexion expirée');
    expect(element.querySelector('.cnpm-otp')).toBeNull();
  });

  it('affiche le formulaire OTP quand un défi est actif', async () => {
    const { element } = await setup();

    expect(element.querySelectorAll('.cnpm-otp__cell')).toHaveLength(6);
    expect(element.querySelectorAll('h1')).toHaveLength(1);
  });

  it('annonce le renvoi à chaque envoi, et pas seulement au premier', async () => {
    const { fixture, element } = await setup();
    const page = fixture.componentInstance as unknown as {
      canResend: () => boolean;
      resendCountdown: { set: (value: number) => void };
      resend: () => void;
    };

    page.resendCountdown.set(0);
    page.resend();
    fixture.detectChanges();
    const first = liveRegionText(element);

    page.resendCountdown.set(0);
    page.resend();
    fixture.detectChanges();
    const second = liveRegionText(element);

    expect(gateway.resendCalls).toBe(2);
    expect(first).toContain('Un nouveau code a été envoyé.');
    // Une région live n'annonce qu'une mutation : réécrire le même texte ne
    // produirait aucune annonce au deuxième renvoi.
    expect(second).not.toBe(first);
    expect(second).toContain('envoi n° 2');
  });

  it('ne renvoie pas de code tant que le délai n’est pas écoulé', async () => {
    const { fixture } = await setup();
    const page = fixture.componentInstance as unknown as { resend: () => void };

    page.resend();

    expect(gateway.resendCalls).toBe(0);
  });

  it('n’annonce rien avant le premier renvoi', async () => {
    const { element } = await setup();

    expect(liveRegionText(element)).toBe('');
  });

  it('signale un code invalide et vide les cases', async () => {
    const { fixture, element } = await setup();
    gateway.codeOutcome = 'invalid-code';
    const page = fixture.componentInstance as unknown as {
      form: { setValue: (value: { code: string }) => void };
      submit: () => void;
    };
    page.form.setValue({ code: '999999' });

    page.submit();
    fixture.detectChanges();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Code non valide');
    const values = Array.from(
      element.querySelectorAll<HTMLInputElement>('.cnpm-otp__cell'),
    ).map((cell) => cell.value);
    expect(values).toEqual(['', '', '', '', '', '']);
  });

  it('ne soumet pas un code incomplet', async () => {
    const { fixture } = await setup();
    const verifySpy = vi.spyOn(gateway, 'verifyCode');
    const page = fixture.componentInstance as unknown as {
      form: { setValue: (value: { code: string }) => void };
      submit: () => void;
    };
    page.form.setValue({ code: '12' });

    page.submit();

    expect(verifySpy).not.toHaveBeenCalled();
  });

  it('n’expose aucun lien inerte (UX-DEC-011)', async () => {
    const { element } = await setup();

    // Seul le retour à la connexion existe, et uniquement en état « session expirée ».
    expect(element.querySelectorAll('a')).toHaveLength(0);
  });
});
