import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AUTH_GATEWAY, type AuthGateway, type CredentialsRequest } from './auth-gateway';
import { AuthFlowStore } from './auth-flow.store';
import { LoginPage } from './login.page';

/** Passerelle contrôlée : aucun identifiant réel, aucune latence, résultat piloté par le test. */
class StubGateway implements AuthGateway {
  lastRequest?: CredentialsRequest;
  outcome: 'mfa-required' | 'enrollment-required' | 'invalid' | 'forbidden' = 'mfa-required';
  unavailable = false;

  submitCredentials(request: CredentialsRequest) {
    this.lastRequest = request;
    if (this.unavailable) {
      return throwError(() => new Error('indisponible'));
    }
    if (this.outcome === 'mfa-required') {
      return of({ outcome: 'mfa-required', challengeId: 'challenge-1' } as const);
    }
    return of({ outcome: this.outcome } as const);
  }

  verifyCode() {
    return of({ outcome: 'authenticated', redirectTo: '/' } as const);
  }

  resendCode() {
    return of(undefined);
  }

  beginTotpEnrollment() {
    return of({
      enrollmentId: 'stub',
      qrImage: 'data:image/svg+xml,stub',
      manualKey: 'STUB',
      issuer: 'CNPM',
      account: 'stub@cnpm.example',
    } as const);
  }

  activateTotp() {
    return of({ outcome: 'activated', redirectTo: '/' } as const);
  }
}

describe('LoginPage (AUTH-001)', () => {
  let gateway: StubGateway;

  async function setup() {
    gateway = new StubGateway();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        // Route de destination minimale : la navigation doit se résoudre sans charger
        // la vraie page de vérification, qui n'est pas le sujet de ces tests.
        provideRouter([
          { path: 'auth/verify', children: [] },
          { path: 'auth/2fa-enrollment', children: [] },
        ]),
        { provide: AUTH_GATEWAY, useValue: gateway },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    return { fixture, element };
  }

  /**
   * Renseigne le formulaire puis synchronise la vue.
   *
   * Le `detectChanges` final est nécessaire : écrire directement la valeur du DOM
   * court-circuite le binding Angular, qui garderait sinon en mémoire la valeur
   * précédente et n'écrirait pas un retour à la chaîne vide.
   */
  function fill(
    fixture: { detectChanges: () => void },
    element: HTMLElement,
    email: string,
    password: string,
  ): void {
    const emailInput = element.querySelector<HTMLInputElement>('input[type="email"]')!;
    const passwordInput = element.querySelector<HTMLInputElement>('input[type="password"]')!;
    emailInput.value = email;
    emailInput.dispatchEvent(new Event('input'));
    passwordInput.value = password;
    passwordInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(element: HTMLElement): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  it('affiche un seul titre de niveau 1', async () => {
    const { element } = await setup();
    expect(element.querySelectorAll('h1')).toHaveLength(1);
  });

  it('place le focus initial sur le champ e-mail', async () => {
    const { element } = await setup();
    const emailInput = element.querySelector<HTMLInputElement>('input[type="email"]');
    expect(document.activeElement).toBe(emailInput);
  });

  it('utilise les autocomplete attendus par le pattern 2FA', async () => {
    const { element } = await setup();
    expect(element.querySelector('input[type="email"]')?.getAttribute('autocomplete')).toBe(
      'username',
    );
    expect(element.querySelector('input[type="password"]')?.getAttribute('autocomplete')).toBe(
      'current-password',
    );
  });

  it('propose le choix de l’espace sans dupliquer le formulaire', async () => {
    const { element } = await setup();
    expect(element.querySelectorAll('[role="tab"]')).toHaveLength(2);
    expect(element.querySelectorAll('form')).toHaveLength(1);
  });

  it('transmet l’espace sélectionné à la passerelle', async () => {
    const { fixture, element } = await setup();
    fill(fixture, element, 'agent@cnpm.example', 'secret');
    submit(element);
    expect(gateway.lastRequest?.space).toBe('admin');
  });

  it('affiche une erreur neutre et conserve l’e-mail quand les identifiants sont refusés', async () => {
    const { fixture, element } = await setup();
    gateway.outcome = 'invalid';
    fill(fixture, element, 'agent@cnpm.example', 'mauvais');
    submit(element);
    fixture.detectChanges();

    const alert = element.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Identifiants non reconnus');
    // Le message ne doit pas révéler si le compte existe.
    expect(alert?.textContent).not.toContain('existe');
    expect(element.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe(
      'agent@cnpm.example',
    );
  });

  it('efface le mot de passe après un échec', async () => {
    const { fixture, element } = await setup();
    gateway.outcome = 'invalid';
    fill(fixture, element, 'agent@cnpm.example', 'mauvais');
    submit(element);
    fixture.detectChanges();

    expect(element.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe('');
  });

  it('ouvre l’étape 2FA et mémorise le défi quand les identifiants sont acceptés', async () => {
    const { fixture, element } = await setup();
    const router = TestBed.inject(Router);
    // La navigation réelle est neutralisée : le test vérifie l'intention de navigation,
    // pas le routeur, dont la table est volontairement vide ici.
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fill(fixture, element, 'agent@cnpm.example', 'secret');
    submit(element);

    expect(TestBed.inject(AuthFlowStore).activeChallenge()?.id).toBe('challenge-1');
    expect(navigate).toHaveBeenCalledWith(['/auth/verify']);
  });

  it('conduit à l’enrôlement forcé à la première connexion, sans atteindre le tableau de bord', async () => {
    const { fixture, element } = await setup();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    gateway.outcome = 'enrollment-required';

    fill(fixture, element, 'nouveau@cnpm.example', 'secret');
    submit(element);

    // On va vers l'enrôlement, jamais vers la vérification d'un code inexistant.
    expect(navigate).toHaveBeenCalledWith(['/auth/2fa-enrollment']);
    expect(navigate).not.toHaveBeenCalledWith(['/auth/verify']);
    // L'espace choisi (admin par défaut) est porté par le flow pour la redirection finale.
    const challenge = TestBed.inject(AuthFlowStore).activeChallenge();
    expect(challenge?.space).toBe('admin');
    expect(challenge?.id).toBe('enrollment-pending');
  });

  it('n’appelle pas la passerelle si le formulaire est invalide', async () => {
    const { element } = await setup();
    submit(element);
    expect(gateway.lastRequest).toBeUndefined();
  });

  it('transmet le consentement « se souvenir » plutôt que de l’ignorer', async () => {
    const { fixture, element } = await setup();
    fill(fixture, element, 'agent@cnpm.example', 'secret');
    const checkbox = element.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    submit(element);

    expect(gateway.lastRequest?.rememberDevice).toBe(true);
  });

  it('n’active pas « se souvenir » par défaut', async () => {
    const { fixture, element } = await setup();
    fill(fixture, element, 'agent@cnpm.example', 'secret');
    submit(element);

    expect(gateway.lastRequest?.rememberDevice).toBe(false);
  });

  it('distingue un accès refusé d’identifiants erronés', async () => {
    const { fixture, element } = await setup();
    gateway.outcome = 'forbidden';
    fill(fixture, element, 'suspendu@cnpm.example', 'secret');
    submit(element);
    fixture.detectChanges();

    const text = element.textContent ?? '';
    expect(text).toContain('Accès non autorisé');
    expect(text).not.toContain('Identifiants non reconnus');
  });

  it('annonce un profil HTTP indisponible sans transmettre davantage le mot de passe', async () => {
    const { fixture, element } = await setup();
    gateway.unavailable = true;
    fill(fixture, element, 'agent@cnpm.example', 'secret');
    submit(element);
    fixture.detectChanges();

    expect(element.textContent).toContain('Connexion indisponible');
    expect(element.textContent).toContain("Aucun identifiant n'a été transmis");
    expect(element.querySelector<HTMLInputElement>('input[type="password"]')?.value).toBe('');
  });

  it('relie l’alerte au formulaire après un échec', async () => {
    const { fixture, element } = await setup();
    gateway.outcome = 'invalid';
    fill(fixture, element, 'agent@cnpm.example', 'mauvais');
    submit(element);
    fixture.detectChanges();

    const describedBy = element.querySelector('form')?.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(element.querySelector(`#${describedBy}`)?.textContent).toContain(
      'Identifiants non reconnus',
    );
  });

  it('n’affiche aucun lien inerte tant que la destination n’existe pas (UX-DEC-011)', async () => {
    const { element } = await setup();
    // Un lien visible qui ne mène nulle part est un défaut : tant que la récupération
    // et le support ne sont pas arbitrés, aucune affordance n'est exposée.
    expect(element.querySelectorAll('a')).toHaveLength(0);
  });

  it('ne signale pas en erreur un champ vide simplement traversé au clavier', async () => {
    const { fixture, element } = await setup();
    const email = element.querySelector<HTMLInputElement>('input[type="email"]')!;

    // Le focus initial est sur l'e-mail ; le quitter sans saisir ne doit rien reprocher.
    email.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(email.getAttribute('aria-invalid')).toBeNull();
    expect(element.textContent).not.toContain('requise');
  });

  it('signale les champs requis une fois la soumission tentée', async () => {
    const { fixture, element } = await setup();
    submit(element);
    fixture.detectChanges();

    const text = element.textContent ?? '';
    expect(text).toContain('L’adresse e-mail est requise.');
    expect(text).toContain('Le mot de passe est requis.');
  });

  it('distingue un e-mail vide d’un e-mail au format invalide', async () => {
    const { fixture, element } = await setup();
    const email = element.querySelector<HTMLInputElement>('input[type="email"]')!;
    email.value = 'pas-un-email';
    email.dispatchEvent(new Event('input'));
    email.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    // Un format invalide est signalé dès le blur : l'utilisateur a réellement saisi
    // quelque chose d'incorrect, contrairement au champ vide.
    expect(element.textContent).toContain('Saisissez une adresse e-mail valide.');
  });
});
