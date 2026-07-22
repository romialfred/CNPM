import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BlockedAuthPage, type BlockedAuthContent } from './blocked-auth.page';

const CONTENT: BlockedAuthContent = {
  screenId: 'AUTH-004',
  eyebrow: 'Accès au compte',
  title: 'Mot de passe oublié',
  description: 'Le parcours est en attente de configuration.',
  decision: "Le fournisseur d'identité doit être validé.",
};

describe('BlockedAuthPage (AUTH-003 à AUTH-007)', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [BlockedAuthPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { blockedAuth: CONTENT } } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(BlockedAuthPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it("rend un titre unique et la référence de l'écran", async () => {
    const { element } = await setup();
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('Mot de passe oublié');
    expect(element.textContent).toContain('AUTH-004');
    expect(element.textContent).toContain('UX-DEC-011');
  });

  it('reste fermé sans formulaire, champ, secret ou action simulée', async () => {
    const { element } = await setup();
    expect(element.querySelector('form')).toBeNull();
    expect(element.querySelector('input')).toBeNull();
    expect(element.querySelector('button')).toBeNull();
    expect(element.textContent).toContain("Aucune opération n'est simulée");
  });

  it('propose le retour à la connexion et le retour au site public', async () => {
    const { element } = await setup();
    const links = [...element.querySelectorAll<HTMLAnchorElement>('a')];
    // Le retour au site (shell, en tête de DOM) précède le retour à la connexion (contenu).
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/auth/login']);
  });
});
