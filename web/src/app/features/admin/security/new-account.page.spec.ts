import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoSessionGateway } from '../../../layout/admin-shell/demo-session.gateway';
import { SESSION_GATEWAY } from '../../../layout/admin-shell/session-gateway';
import { ADMIN_SECURITY_GATEWAY } from './admin-security-gateway';
import { DemoAdminSecurityGateway } from './demo-admin-security.gateway';
import { NewAccountPage } from './new-account.page';

describe('NewAccountPage (création de compte)', () => {
  let fixture: ComponentFixture<NewAccountPage>;
  let host: HTMLElement;

  const settle = async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewAccountPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ADMIN_SECURITY_GATEWAY, useClass: DemoAdminSecurityGateway },
        { provide: SESSION_GATEWAY, useClass: DemoSessionGateway },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NewAccountPage);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('est un écran plein (pas une boîte modale) avec le bon titre', async () => {
    await settle();
    expect(host.querySelector('h1')?.textContent).toContain('Nouveau compte');
    expect(host.querySelector('[role="dialog"], .cnpm-dialog__panel')).toBeNull();
  });

  it('propose les deux types de compte et exclut le rôle membre côté professionnel', async () => {
    await settle();
    expect(host.querySelectorAll('input[type="radio"][value="PROFESSIONAL"]')).toHaveLength(1);
    expect(host.querySelectorAll('input[type="radio"][value="MEMBER"]')).toHaveLength(1);

    const roleOptions = Array.from(
      host.querySelectorAll<HTMLOptionElement>('#new-account-role option'),
    ).map((option) => option.value);
    expect(roleOptions).not.toContain('membre-cnpm');
    expect(roleOptions).toContain('admin-technique');
  });

  it('affiche les permissions du rôle choisi', async () => {
    await settle();
    const select = host.querySelector<HTMLSelectElement>('#new-account-role')!;
    select.value = 'gestionnaire-cotisations';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const tags = Array.from(host.querySelectorAll('.cnpm-new-account__tag')).map((tag) =>
      tag.textContent?.trim(),
    );
    expect(tags).toContain('Émission des reçus');
  });

  it('crée le compte avec les données saisies et redirige vers la liste', async () => {
    await settle();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const gateway = TestBed.inject(ADMIN_SECURITY_GATEWAY) as DemoAdminSecurityGateway;
    const created = vi.spyOn(gateway, 'createAccount');

    const set = (selector: string, value: string): void => {
      const input = host.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    set('input[name="firstName"]', 'Awa');
    set('input[name="lastName"]', 'Touré');
    set('input[name="email"]', 'a.toure@cnpm-demo.example');
    const select = host.querySelector<HTMLSelectElement>('#new-account-role')!;
    select.value = 'auditeur';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const submit = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Créer le compte',
    );
    submit?.click();
    await settle();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'PROFESSIONAL',
        firstName: 'Awa',
        lastName: 'Touré',
        roleId: 'auditeur',
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/admin/security/users']);
  });

  it('affiche la liste des membres sans compte pour un compte membre', async () => {
    await settle();
    host.querySelector<HTMLInputElement>('input[type="radio"][value="MEMBER"]')!.click();
    fixture.detectChanges();
    await settle();

    const members = host.querySelectorAll('.cnpm-new-account__member');
    expect(members.length).toBeGreaterThan(0);
    expect(host.textContent).toContain('Société Malienne de Négoce SA');
  });

  it('pré-remplit l’identité en choisissant un membre et transmet son identifiant', async () => {
    await settle();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const gateway = TestBed.inject(ADMIN_SECURITY_GATEWAY) as DemoAdminSecurityGateway;
    const created = vi.spyOn(gateway, 'createAccount');

    host.querySelector<HTMLInputElement>('input[type="radio"][value="MEMBER"]')!.click();
    fixture.detectChanges();
    await settle();

    // Choix du premier membre → pré-remplissage de l'identité.
    host.querySelector<HTMLButtonElement>('.cnpm-new-account__member')!.click();
    fixture.detectChanges();
    await settle();

    expect(host.querySelector<HTMLInputElement>('input[name="firstName"]')?.value).toBe('Oumar');
    expect(host.querySelector<HTMLInputElement>('input[name="organization"]')?.value).toBe(
      'Société Malienne de Négoce SA',
    );

    const submit = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Créer le compte',
    );
    submit?.click();
    await settle();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'MEMBER',
        memberId: 'mem-2041',
        roleId: 'membre-cnpm',
        organization: 'Société Malienne de Négoce SA',
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/admin/security/users']);
  });

  it('bloque la création d’un compte membre si aucun membre n’est choisi', async () => {
    await settle();
    const gateway = TestBed.inject(ADMIN_SECURITY_GATEWAY) as DemoAdminSecurityGateway;
    const created = vi.spyOn(gateway, 'createAccount');

    host.querySelector<HTMLInputElement>('input[type="radio"][value="MEMBER"]')!.click();
    fixture.detectChanges();
    await settle();

    const submit = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Créer le compte',
    );
    submit?.click();
    await settle();

    expect(created).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Sélectionnez le membre à rattacher.');
  });
});
